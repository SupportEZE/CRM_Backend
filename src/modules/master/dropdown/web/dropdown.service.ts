import { HttpStatus, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { ResponseService } from 'src/services/response.service';
import { DropdownModel } from '../models/dropdown.model';
import { Model, ClientSession } from 'mongoose';
import { OptionModel } from '../models/dropdown-options.model';
import { PostalCodeModel } from './../../location-master/postal-code/models/postal-code.model';
import { Like, toObjectId } from 'src/common/utils/common.utils';
import { GlobalService } from 'src/shared/global/global.service';
import { ProductModel } from '../../product/models/product.model';
import { OrgModel } from '../../org/models/org.model';

@Injectable()
export class DropdownService {
  constructor(
    @InjectModel(DropdownModel.name)
    private dropdownModel: Model<DropdownModel>,
    @InjectModel(OptionModel.name) private optionModel: Model<OptionModel>,
    @InjectModel(PostalCodeModel.name)
    private postalCodeModel: Model<PostalCodeModel>,
    @InjectModel(ProductModel.name) private productModel: Model<ProductModel>,
    @InjectModel(OrgModel.name) private orgModel: Model<OrgModel>,
    private readonly res: ResponseService,
    private readonly globalService: GlobalService,
  ) { }

  async create(req: Request, params: any): Promise<any> {
    try {
      const exist = await this.dropdownModel
        .findOne({
          dropdown_name: params.dropdown_name,
          is_delete: 0,
          org_id: req['user']['org_id'],
          module_id: params.module_id,
        })
        .exec();
      if (exist) {
        return this.res.error(HttpStatus.BAD_REQUEST, 'WARNING.ALREADY_EXIST');
      }

      const saveObj: Record<string, any> = {
        ...req['createObj'],
        ...params,
        dropdown_editable: true,
        status: 1,
      };

      if (
        params.dependent_dropdown_name &&
        params.dependent_dropdown_name.trim() !== ''
      ) {
        const dependent = await this.dropdownModel
          .findOne({
            dropdown_name: params.dependent_dropdown_name,
            is_delete: 0,
            org_id: req['user']['org_id'],
          })
          .exec();

        if (!dependent) {
          return this.res.error(
            HttpStatus.BAD_REQUEST,
            'ERROR.BAD_REQ',
            'Dependent dropdown not found',
          );
        }

        saveObj.dependent_dropdown_id = dependent._id;
      }

      const document = new this.dropdownModel(saveObj);
      await document.save();

      return this.res.success('SUCCESS.CREATE');
    } catch (error) {
      return this.res.error(HttpStatus.BAD_REQUEST, 'ERROR.BAD_REQ', error);
    }
  }

  async update(req: Request, params: any): Promise<any> {
    try {
      const exist: Record<string, any> = await this.dropdownModel
        .findOne({
          dropdown_name: params.dropdown_name,
          is_delete: 0,
          org_id: req['user']['org_id'],
        })
        .exec();
      if (!exist) return this.res.success('WARNING.NOT_EXIST');
      const updateObj: Record<string, any> = {
        ...req['updateObj'],
        ...params,
      };
      await this.dropdownModel.updateOne(
        { dropdown_name: params.dropdown_name },
        updateObj,
      );
      return this.res.success('SUCCESS.UPDATE');
    } catch (error) {
      return this.res.error(HttpStatus.BAD_REQUEST, 'ERROR.BAD_REQ', error);
    }
  }

  async delete(req: Request, params: any): Promise<any> {
    try {
      const updateObj: Record<string, any> = {
        ...req['updateObj'],
        is_delete: 1,
      };

      await this.dropdownModel.updateOne(
        {
          dropdown_name: params.dropdown_name,
          module_id: params.module_id,
          module_type: params.module_type,
          org_id: req['user']['org_id'],
        },
        updateObj,
      );

      await this.optionModel.updateOne(
        {
          dropdown_name: params.dropdown_name,
          module_id: params.module_id,
          module_type: params.module_type,
          org_id: req['user']['org_id'],
        },
        updateObj,
      );

      return this.res.success('SUCCESS.DELETE');
    } catch (error) {
      return this.res.error(
        HttpStatus.BAD_REQUEST,
        'ERROR.BAD_REQ',
        error.message,
      );
    }
  }

  async read(req: Request, params: any): Promise<any> {
    try {
      let match: Record<string, any> = {
        is_delete: 0,
        module_id: params.module_id,
        dropdown_editable: true,
        org_id: req['user']['org_id'],
      };
      let projection: Record<string, any> = {
        created_at: 1,
        created_name: 1,
        module_name: 1,
        dropdown_name: 1,
        dependent_dropdown_name: 1,
        dependent_dropdown_id: 1,
        dropdown_display_name: 1,
      };
      const result: Record<string, any>[] = await this.dropdownModel
        .find(match, projection)
        .sort({ dropdown_display_name: 1 });
      return this.res.success('SUCCESS.FETCH', result);
    } catch (error) {
      return this.res.error(
        HttpStatus.BAD_REQUEST,
        'ERROR.BAD_REQ',
        error.message,
      );
    }
  }

  async createOption(req: Request, params: any): Promise<any> {
    try {
      const dropdownId = toObjectId(params.dropdown_id);

      const match: Record<string, any> = {
        module_id: params.module_id,
        option_name: params.option_name,
        dropdown_id: dropdownId,
        is_delete: 0,
      };

      if (params.dependent_option_name?.trim()) {
        match.dependent_option_name = params.dependent_option_name.trim();
      }

      const exist = await this.optionModel.findOne(match).exec();
      if (exist) {
        return this.res.error(HttpStatus.BAD_REQUEST, 'WARNING.EXIST');
      }
      const saveObj: Record<string, any> = {
        ...req['createObj'],
        ...params,
        dropdown_id: dropdownId,
        value: params.option_name,
      };

      if (params.dependent_option_name?.trim()) {
        saveObj.dependent_option_name = params.dependent_option_name.trim();
        saveObj.dependent_option_value = params.dependent_option_name.trim();
      }
      const document = new this.optionModel(saveObj);
      await document.save();

      return this.res.success('SUCCESS.CREATE');
    } catch (error) {
      return this.res.error(
        HttpStatus.BAD_REQUEST,
        'ERROR.BAD_REQ',
        error.message,
      );
    }
  }

  // This Adds dropdowns options
  async addDropdownOptions(created: any, params: { org_id: number, dropdown_name: string, dropdown_options: string[], module_id: number }, session?: ClientSession): Promise<any> {
    try {
      // find dropdown
      let dropdown = await this.getDropdown(
        { org_id: params?.org_id, dropdown_name: params?.dropdown_name },
        {}
      );

      // if dropdown DNE then create one
      if (!dropdown) {
        dropdown = await this.dropdownModel.insertOne({
          ...created,
          module_name: 'Products',
          org_id: params?.org_id,
          module_type: 'child',
          module_id: params?.module_id,
          dropdown_name: params?.dropdown_name,
          dropdown_display_name: params?.dropdown_name,
        }, {session});
      }

      // creating documents for insertMany
      const dropdown_options = Array.isArray(params?.dropdown_options)
        ? params?.dropdown_options
        : [params?.dropdown_options];
      const docs = params?.dropdown_options?.map((item) => {
        return {
          org_id: params?.org_id,
          module_name: dropdown.module_name,
          module_id: dropdown.module_id,
          dropdown_id: dropdown._id,
          dropdown_name: dropdown.dropdown_name,
          option_name: item,
          value: item,
        };
      });

      const result = await this.optionModel.insertMany(docs, { ordered: false, session })
      return result;
    } catch (err) {
      console.error(`Error during adding option.`, err);
      return this.res.error(HttpStatus.BAD_REQUEST, 'ERROR.BAD_REQ', err);
    }
  }

  async deleteOption(req: Request, params: any): Promise<any> {
    try {
      const exist: Record<string, any> = await this.optionModel
        .findOne({ _id: params._id })
        .exec();
      if (!exist)
        return this.res.error(HttpStatus.BAD_REQUEST, 'WARNING.NOT_EXIST');
      if (params.is_delete === exist.is_delete)
        return this.res.error(HttpStatus.BAD_REQUEST, 'WARNING.ALREADY_DELETE');
      const updateObj: Record<string, any> = {
        ...req['updateObj'],
        ...params,
      };
      await this.optionModel.updateOne({ _id: params._id }, updateObj);
      return this.res.success('SUCCESS.DELETE');
    } catch (error) {
      return this.res.error(
        HttpStatus.BAD_REQUEST,
        'ERROR.BAD_REQ',
        error.message,
      );
    }
  }

  async readOption(req: Request, params: any): Promise<any> {
    try {
      let match: Record<string, any> = {
        is_delete: 0,
        org_id: req['user']['org_id'],
        dropdown_id: toObjectId(params.dropdown_id),
      };
      const projection: Record<string, any> = {
        _id: 1,
        option_name: 1,
        dependent_option_name: 1,
      };
      if (params.activity) {
        let result: Record<string, any> = await this.optionModel
          .findOne(
            {
              _id: params.dropdown_id,
            },
            projection,
          )
          .lean();
        return this.res.success('SUCCESS.FETCH', result);
      }
      if (params?.filters?.option_name)
        match.option_name = Like(params.filters.option_name);
      let result: Record<string, any>[] = await this.optionModel
        .find(match, projection)
        .sort({ option_name: 1 })
        .lean();
      result = result.map((row: any) => {
        return {
          ...row,
          label: row.option_name,
          value: row._id,
        };
      });
      return this.res.success('SUCCESS.FETCH', result);
    } catch (error) {
      return this.res.error(
        HttpStatus.BAD_REQUEST,
        'ERROR.BAD_REQ',
        error.message,
      );
    }
  }

  async readDropdown(req: Request, params: any): Promise<any> {
    try {
      let match: Record<string, any> = {
        is_delete: 0,
        module_id: params.module_id,
        org_id: req['user']['org_id'],
        dropdown_name: params.dropdown_name,
      };

      if (params.dropdown_option && params.dropdown_option.trim() !== '') {
        match = { ...match, dependent_option_name: params.dropdown_option };
      }

      if (
        req?.url.includes(global.MODULE_ROUTES[31]) ||
        req?.url.includes(global.MODULE_ROUTES[32])
      ) {
        match.value = { $ne: 'Enquiry' };
      }

      const projection: Record<string, any> = {
        _id: 1,
        option_name: 1,
        value: 1,
        sequence: 1,
      };
      if (params?.filters?.search)
        match.option_name = Like(params.filters.search);
      let result: Record<string, any>[] = await this.optionModel
        .find(match, projection)
        .lean();

      result = result.map((row: any) => {
        return {
          _id: row._id,
          label: row.option_name,
          value: row.value,
          sequence: row.sequence,
        };
      });

      if (params?.internalCall) return result;
      return this.res.success('SUCCESS.FETCH', result);
    } catch (error) {
      return this.res.error(
        HttpStatus.BAD_REQUEST,
        'ERROR.BAD_REQ',
        error.message,
      );
    }
  }

  async getDropdown(params: { org_id: number, dropdown_name: string }, fields: any): Promise<any> {
    try {
      const dropdown_data = await this.dropdownModel.findOne(params, { ...fields })
      return dropdown_data;
    } catch (error) {
      return this.res.error(
        HttpStatus.BAD_REQUEST,
        'ERROR.BAD_REQ',
        error.message,
      );
    }
  }

  async readDesignation(req: Request, params: any): Promise<any> {
    try {
      let match: Record<string, any> = {
        is_delete: 0,
        module_id: 7,
        org_id: req['user']['org_id'],
        dropdown_name: 'designation',
      };

      if (params.dropdown_option && params.dropdown_option.trim() !== '') {
        match = { ...match, dependent_option_name: params.dropdown_option };
      }

      const projection: Record<string, any> = {
        _id: 1,
        option_name: 1,
        value: 1,
      };
      if (params?.filters?.search)
        match.option_name = Like(params.filters.search);
      let result: Record<string, any>[] = await this.optionModel
        .find(match, projection)
        .lean();

      result = result.map((row: any) => {
        return {
          label: row.option_name,
          value: row._id,
        };
      });
      if (params?.internalCall) return result;
      return this.res.success('SUCCESS.FETCH', result);
    } catch (error) {
      return this.res.error(
        HttpStatus.BAD_REQUEST,
        'ERROR.BAD_REQ',
        error.message,
      );
    }
  }

  // async readDropdown(req: Request, params: any): Promise<any> {
  //   try {
  //     const match: Record<string, any> = {
  //       is_delete: 0,
  //       module_id: params.module_id,
  //       org_id: req['user']?.org_id || 2,  // fallback for testing
  //       dropdown_name: params.dropdown_name
  //     };

  //     // OPTIONAL: only apply this if a dependent filter is actually required
  //     if (params.dropdown_option?.trim()) {
  //       match.dependent_option_name = params.dropdown_option;
  //     }

  //     const projection: Record<string, any> = {
  //       option_name: 1,
  //       value: 1,
  //       sequence: 1
  //     };

  //     // OPTIONAL search filter for label
  //     if (params?.filters?.search) {
  //       match.option_name = {
  //         $regex: new RegExp(params.filters.search, 'i')
  //       };
  //     }

  //     // 🧪 Log final match
  //     console.log('MATCH =>', match);

  //     let result: Record<string, any>[] = await this.optionModel.find(match, projection).lean();

  //     result = result.map((row: any) => ({
  //       label: row.option_name,
  //       value: row.value,
  //       sequence: row.sequence ?? null
  //     }));

  //     if (params?.internalCall) return result;
  //     return this.res.success('SUCCESS.FETCH', result);
  //   } catch (error) {
  //     return this.res.error(HttpStatus.BAD_REQUEST, 'ERROR.BAD_REQ', error.message);
  //   }
  // }

  async readDropdownWithPagination(req: Request, params: any): Promise<any> {
    try {
      const match: Record<string, any> = {
        is_delete: 0,
        module_id: params.module_id,
        org_id: req['user']['org_id'],
        dropdown_name: params.dropdown_name,
      };

      const page: number = params?.page || global.PAGE;
      const limit: number = params?.limit || global.LIMIT;
      const skip: number = (page - 1) * limit;

      if (params?.filters?.category_name) {
        match.option_name = Like(params.filters.category_name);
      }

      const projection: Record<string, any> = {
        option_name: 1,
        value: 1,
        _id: 1,
      };

      const [result, total] = await Promise.all([
        this.optionModel.find(match, projection).skip(skip).limit(limit).lean(),
        this.optionModel.countDocuments(match),
      ]);

      if (params?.internalCall) {
        return this.res.pagination(result, total, page, limit);
      }

      return this.res.pagination(result, total, page, limit);
    } catch (error) {
      return this.res.error(
        HttpStatus.BAD_REQUEST,
        'ERROR.BAD_REQ',
        error.message,
      );
    }
  }

  async readProductRelatedDropdown(req: Request, params: any): Promise<any> {
    try {
      const orgId: number = req['user']['org_id'];
      const moduleId: number = params.module_id;
      const isSpecialOrg = global.SPECIAL_ORGANIZATION_CODE.includes(orgId);
      let match: Record<string, any> = {}

      if (isSpecialOrg) {
        match = {
          is_delete: 0,
          org_id: orgId,
          module_id: { $in: [6, 4, 7] }
        };
      } else {
        match = {
          is_delete: 0,
          org_id: orgId,
          module_id: moduleId
        };
      }

      const dropdowns = await this.dropdownModel.find(match).lean();
      if (!dropdowns || dropdowns.length === 0)
        return this.res.error(HttpStatus.NOT_FOUND, 'ERROR.NOT_FOUND');

      const grouped: Record<string, any[]> = {};

      let allowedDropdowns: string[] = [];

      if (isSpecialOrg) {
        allowedDropdowns = ['category_name', 'sub_category', 'brand'];
      }

      const sortedDropdowns = [
        ...dropdowns
          .filter((d) => d.dropdown_name === 'category_name')
          .filter((d) => !isSpecialOrg || allowedDropdowns.includes(d.dropdown_name)),
        ...dropdowns
          .filter((d) => d.dropdown_name !== 'category_name')
          .filter((d) => !isSpecialOrg || allowedDropdowns.includes(d.dropdown_name)),
      ];

      for (const dropdown of sortedDropdowns) {
        const dropdownName = dropdown.dropdown_name;

        const options = await this.optionModel
          .find({
            is_delete: 0,
            org_id: orgId,
            module_id: moduleId,
            dropdown_name: dropdownName,
          })
          .lean();

        const values = options.map((opt) => opt.option_name);
        const matchField =
          dropdownName === 'category_name'
            ? 'category_name'
            : `form_data.${dropdownName}`;

        const baseMatch: Record<string, any> = {
          is_delete: 0,
          org_id: orgId,
          [matchField]: { $in: values },
        };

        const aggregationPipeline: any[] = [{ $match: baseMatch }];

        const isArrayField = ['brand', 'colors'].includes(dropdownName);
        const groupField =
          dropdownName === 'category_name'
            ? '$category_name'
            : `$form_data.${dropdownName}`;

        if (isArrayField) {
          aggregationPipeline.push({ $unwind: groupField });
        }

        aggregationPipeline.push({
          $group: {
            _id: groupField,
            count: { $sum: 1 },
          },
        });

        const productCounts =
          await this.productModel.aggregate(aggregationPipeline);
        const countMap = Object.fromEntries(
          productCounts.map((p) => [p._id, p.count]),
        );

        grouped[dropdownName] = options.map(opt => ({
          label: opt.option_name,
          value: opt.option_name,
          count: countMap[opt.option_name] || 0,
        }));
      }
      return grouped;
    } catch (error) {
      return this.res.error(HttpStatus.BAD_REQUEST, 'ERROR.BAD_REQ', error);
    }
  }

  async readCountry(req: any, params: any): Promise<any> {
    try {
      const { org_id } = req.user;
      const orgData: any = await this.orgModel
        .findOne({ is_delete: 0, org_id }, { country: 1 })
        .lean();

      const data = Array.isArray(orgData?.country)
        ? orgData.country
        : orgData?.country
          ? [orgData.country]
          : [];

      if (data.length === 0) {
        return this.res.error(HttpStatus.BAD_REQUEST, 'ERROR.NOT_FOUND');
      }
      return this.res.success('SUCCESS.FETCH', data);
    } catch (error) {
      return this.res.error(
        HttpStatus.INTERNAL_SERVER_ERROR,
        error.message || 'ERROR.INTERNAL',
      );
    }
  }
}
