import { HttpStatus, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { CustomFormModel } from './models/custom-form.model';
import { DefaultFormModel } from './models/default-form.model';
import { ResponseService } from 'src/services/response.service';
import { RedisService } from 'src/services/redis.service';
import { StaticFormModel } from './models/static-form.model';
import { DB_NAMES } from 'src/config/db.constant';

@Injectable()
export class FormBuilderService {
  constructor
    (
      @InjectModel(CustomFormModel.name, DB_NAMES().CORE_DB) private customFormModel: Model<CustomFormModel>,
      @InjectModel(DefaultFormModel.name, DB_NAMES().CORE_DB) private defaultFormModel: Model<DefaultFormModel>,
      @InjectModel(StaticFormModel.name, DB_NAMES().CORE_DB) private staticFormModel: Model<StaticFormModel>,
      private readonly res: ResponseService,
      private readonly redisService: RedisService
    ) { }

  async create(req: Request, params: any): Promise<any> {
    try {
      const orgId = req['user']['org_id'];
      const formId = params.form_id;

      params.org_id = orgId;
      const match = { form_id: formId, org_id: orgId };
      params.match = match;

      const exist = await this.customFormModel.findOne(match);
      if (exist) return this.update(req, params);

      const saveObj = {
        ...req['createObj'],
        ...params,
      };

      const document = new this.customFormModel(saveObj);
      await document.save();

      return this.res.success('SUCCESS.CREATE');
    } catch (error) {
      return this.res.error(HttpStatus.BAD_REQUEST, 'ERROR.BAD_REQ', error);
    }
  }

  async update(req: Request, params: any): Promise<any> {
    try {
      const updateObj = {
        ...req['updateObj'],
        form_data: params.form_data,
      };

      await this.customFormModel.updateOne(
        { form_id: params.form_id, org_id: req['user']['org_id'] },
        updateObj
      );

      return this.res.success('SUCCESS.UPDATE');
    } catch (error) {
      return this.res.error(HttpStatus.BAD_REQUEST, 'ERROR.BAD_REQ', error.message);
    }
  }

  async read(req: Request, params: any): Promise<any> {
    try {
      let orgId: number
      if (params.org_id) {
        orgId = params.org_id;
      } else {
        orgId = req['user']['org_id'];
      }
      const formId = params.form_id;

      const where = { is_delete: 0, org_id: orgId, form_id: formId };
      const projection: Record<string, any> = {
        _id: 1,
        form_id: 1,
        form_data: 1,
        form_type: 1,
        form_source: 1,
      };
      
      let formData: Record<string, any> = await this.customFormModel.findOne(where, projection);

      if (!formData) {
        delete where.org_id;
        formData = await this.defaultFormModel.findOne(where, projection);
        if (!formData) {
          delete where.org_id;
          formData = await this.staticFormModel.findOne(where, projection);

        }
      }

      if (formData?.form_data?.length) {
        formData.form_data.sort((a: any, b: any) => a.sequence - b.sequence);
      }
      if (params.internalCall) return formData;
      return this.res.success('SUCCESS.FETCH', formData);
    } catch (error) {
      return this.res.error(HttpStatus.BAD_REQUEST, 'ERROR.BAD_REQ', error);
    }
  }


  async mergeFormsData(req: Request, params: any): Promise<any> {
    try {
      const orgId = req['user']['org_id'];
      const moduleId = params.module_id;

      const formIds = await this.defaultFormModel
        .find({ module_id: moduleId }, { form_id: 1 })
        .lean()
        .then(forms => forms.map(f => f.form_id));

      const redisKey = this.redisService.buildKey(['org', orgId, 'form', 'all']);
      let formData = await this.redisService.get(redisKey);

      const projection: Record<string, any> = { _id: 1, form_id: 1, form_data: 1, form_type: 1, form_source: 1 };

      if (!formData) {
        let customForms = await this.customFormModel.find({ org_id: orgId, form_id: { $in: formIds } }, projection);
        const defaultForms = await this.defaultFormModel.find({ form_id: { $in: formIds } }, projection);

        formData = defaultForms.map((defaultForm) => {
          const custom = customForms.find(c => c.form_id === defaultForm.form_id);
          return custom || defaultForm;
        });

        if (formData?.length) await this.redisService.set(redisKey, formData);
      }

      params.forms = formData;
      const merged = await this.mergeForms(req, params);
      return this.res.success('SUCCESS.FETCH', merged);
    } catch (error) {
      return this.res.error(HttpStatus.BAD_REQUEST, 'ERROR.BAD_REQ', error);
    }
  }

  async mergeForms(req: Request, params: any): Promise<any> {
    try {
      const forms = params.forms;
      if (!forms.length) return null;

      const mergedForm = { ...forms[0], form_data: [...forms[0].form_data] };
      let currentId = 1 + Math.max(...forms.flatMap(f => f.form_data.map(d => d.id || 0)));
      let sequence = mergedForm.form_data.length;

      for (let i = 1; i < forms.length; i++) {
        for (const item of forms[i].form_data) {
          item.id = currentId++;
          item.sequence = ++sequence;
          item.list_sequence = sequence;
          mergedForm.form_data.push(item);
        }
      }

      return mergedForm;
    } catch (error) {
      return this.res.error(HttpStatus.BAD_REQUEST, 'ERROR.BAD_REQ', error);
    }
  }

  async readFormUserWise(req: Request, params: any): Promise<any> {
    try {
      const platform = params.platform;

      const where = {
        platform,
        login_type_id: params.login_type_id,
        module_id: params.module_id
      };

      const projection: Record<string, any> = {
        _id: 1,
        module_id: 1,
        form_id: 1,
        form_type: 1
      };

      const formData: Record<string, any> = await this.defaultFormModel.findOne(where, projection);

      if (!formData) {
        return this.res.error(HttpStatus.BAD_REQUEST, 'ERROR.NOT_FOUND');
      }

      if (params.internalCall) return formData;

      if (formData?.form_data?.length) {
        formData.form_data.sort((a: any, b: any) => a.sequence - b.sequence);
      }

      return this.res.success('SUCCESS.FETCH', formData);
    } catch (error) {
      return this.res.error(HttpStatus.BAD_REQUEST, 'ERROR.BAD_REQ', error);
    }
  }

}
