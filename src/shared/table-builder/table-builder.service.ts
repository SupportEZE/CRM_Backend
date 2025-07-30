import { HttpStatus, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { CustomTableModel } from './models/custom-table.model';
import { DefaultTableModel } from './models/default-table.model';
import { HeadersModel } from './models/headers.model';
import { ResponseService } from 'src/services/response.service';
import { FormBuilderService } from '../form-builder/form-builder.service';
import { toObjectId } from 'src/common/utils/common.utils';
import { CustomFormModel } from '../form-builder/models/custom-form.model';
import { DB_NAMES } from 'src/config/db.constant';
@Injectable()
export class TableBuilderService {
  constructor
    (
      @InjectModel(CustomTableModel.name, DB_NAMES().CORE_DB) private customTableModel: Model<CustomTableModel>,
      @InjectModel(DefaultTableModel.name, DB_NAMES().CORE_DB) private defaultTableModel: Model<DefaultTableModel>,
      @InjectModel(HeadersModel.name, DB_NAMES().CORE_DB) private headersModel: Model<HeadersModel>,
      @InjectModel(CustomFormModel.name, DB_NAMES().CORE_DB) private customFormModel: Model<CustomFormModel>,
      private readonly res: ResponseService,
      private readonly formBuilderService: FormBuilderService,
    ) { }

  async create(req: Request, params: any): Promise<any> {
    try {
      const orgId = req['user']['org_id'];
      const tableId = params.table_id;
      params.org_id = orgId;
      const match = { table_id: tableId };
      params.match = match;
      if (!params?.table_data?.tableHead) {
        return this.res.error(HttpStatus.BAD_REQUEST, 'ERROR.BAD_REQ', 'wrong table data formet');
      }

      await this.createForm(req, params);

      const existing = await this.customTableModel.findOne(match);
      if (existing) return await this.update(req, params);

      const saveObj = {
        ...req['createObj'],
        ...params,
      };

      const document = new this.customTableModel(saveObj);
      await document.save();
      return this.res.success('SUCCESS.CREATE');
    } catch (error) {
      return this.res.error(HttpStatus.BAD_REQUEST, 'ERROR.BAD_REQ', error);
    }
  }

  async createForm(req: Request, params: any): Promise<any> {
    try {
      const orgId = req['user']['org_id'];
      const formId = params.form_id;
      const existingForm = await this.customFormModel.findOne({ form_id: formId, org_id: orgId });

      const formData = params?.table_data?.tableHead || [];

      if (existingForm) {
        await this.customFormModel.updateOne({ form_id: formId, org_id: orgId }, { form_data: formData });
        return true;
      }

      const saveObj = {
        org_id: orgId,
        ...req['createObj'],
        form_id: formId,
        form_source: 'custom-listing',
        platform: params.platform,
        form_data: formData,
        form_type: 'add',
        form_name: params.form_name
      };

      const document = new this.customFormModel(saveObj);
      await document.save();
      return true;
    } catch (error) {
      throw error
    }
  }

  async update(req: Request, params: any): Promise<any> {
    try {
      const updateObj = {
        ...req['updateObj'],
        table_data: params.table_data,
      };

      await this.customTableModel.updateOne(params.match, updateObj);
      return this.res.success('SUCCESS.UPDATE');
    } catch (error) {
      return this.res.error(HttpStatus.BAD_REQUEST, 'ERROR.BAD_REQ', error);
    }
  }

  async read(req: Request, params: any): Promise<any> {
    try {

      const tableId = params.table_id;
      const platform = params.platform;
      const orgId = req['user']['org_id']

      const projection: Record<string, any> = {
        _id: 1,
        table_id: 1,
        table_data: 1,
        table_source: 1,
      };

      const where = { platform, table_id: tableId, org_id: orgId };
      let tableData = await this.customTableModel.findOne(where, projection);

      if (!tableData) {
        delete where.org_id
        tableData = await this.defaultTableModel.findOne(where, projection);
      }
      if (!tableData) return this.res.error(HttpStatus.BAD_REQUEST, 'ERROR.NOT_FOUND');
      if (params?.form_id) {
        params.internalCall = true;
        const formData = await this.formBuilderService.read(req, params);
        if (!formData && formData.form_data.length === 0) return this.res.error(HttpStatus.BAD_REQUEST, 'ERROR.BAD_REQ');
        formData.form_data.sort((a: any, b: any) => a.listing_sequence - b.listing_sequence);
        tableData.table_data.tableHead = formData.form_data
      }

      return this.res.success('SUCCESS.FETCH', tableData);
    } catch (error) {
      return this.res.error(HttpStatus.BAD_REQUEST, 'ERROR.BAD_REQ', error);
    }
  }

  async readHeader(req: any, params: any): Promise<any> {
    try {
      params.internalCall = true;
      const data = await this.formBuilderService.read(req, params);
      if (!data) return this.res.error(HttpStatus.BAD_REQUEST, 'ERROR.BAD_REQ');

      let excluded: string[] = [];

      if (req.user.role_id === 2) {
        const headers = await this.headersModel.find({ table_id: params.table_id, level: 1 });
        excluded = headers.map((item: any) => item.field_name);
      } else if (req.user.role_id === 3) {
        const headers = await this.headersModel.find({ table_id: params.table_id, user_id: req.user._id });
        excluded = headers.map((item: any) => item.field_name);
      }

      const headers = data.form_data
        .map((row: any) => row.label)
        .filter((label: string) => !excluded.includes(label));

      return this.res.success('SUCCESS.FETCH', headers);
    } catch (error) {
      console.error('ReadHeader error:', error);
      return this.res.error(HttpStatus.BAD_REQUEST, 'ERROR.BAD_REQ', error.message || error);
    }
  }

  async createHeader(req: any, params: any): Promise<any> {
    try {
      const orgId = req.user.org_id;
      params.org_id = orgId;
      params.user_id = toObjectId(params.user_id);

      const existing = await this.headersModel.findOne(params);
      if (existing) return this.res.success('ERROR.EXIST');

      const saveObj = {
        ...req['createObj'],
        ...params,
      };

      const document = new this.headersModel(saveObj);
      await document.save();

      return this.res.success('SUCCESS.CREATE');
    } catch (error) {
      console.error('CreateHeader error:', error);
      return this.res.error(HttpStatus.BAD_REQUEST, 'ERROR.BAD_REQ', error.message || error);
    }
  }

  async readTableUserWise(req: Request, params: any): Promise<any> {
    try {
      const platform = params.platform;

      const projection: Record<string, any> = {
        _id: 1,
        table_id: 1,
        module_id: 1,
        table_type: 1
      };

      const where = {
        platform,
        login_type_id: params.login_type_id,
        module_id: params.module_id
      };

      const tableData = await this.defaultTableModel.findOne(where, projection);

      if (!tableData) {
        return this.res.error(HttpStatus.BAD_REQUEST, 'ERROR.NOT_FOUND');
      }

      if (params?.form_id) {
        params.internalCall = true;
        const formData = await this.formBuilderService.read(req, params);
        if (!formData || formData.form_data.length === 0) {
          return this.res.error(HttpStatus.BAD_REQUEST, 'ERROR.BAD_REQ');
        }
        formData.form_data.sort((a: any, b: any) => a.listing_sequence - b.listing_sequence);
        tableData.table_data.tableHead = formData.form_data;
      }
      return tableData
    } catch (error) {
      return this.res.error(HttpStatus.BAD_REQUEST, 'ERROR.BAD_REQ', error);
    }
  }
}
