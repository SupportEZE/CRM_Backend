import { HttpStatus, Injectable } from '@nestjs/common';
import { ResponseService } from 'src/services/response.service';
import { CustomerTypeModel } from '../models/customer-type.model';
import { Model } from 'mongoose';
import { InjectModel } from '@nestjs/mongoose';
import { Like } from 'src/common/utils/common.utils';

@Injectable()
export class CustomerTypeService {
  constructor(
    @InjectModel(CustomerTypeModel.name) private customerTypeModel: Model<CustomerTypeModel>,
    private readonly res: ResponseService
  ) { }

  async create(req: Request, params: any): Promise<any> {
    try {
      const exist = await this.customerTypeModel.findOne({ role_id: params.role_id, customer_type_name: params.customer_type_name }).exec();
      if (exist) return this.res.success('CUSTOMER_SUB_TYPE.EXIST')
      params.org_id = req['user']['org_id']
      const saveObj = {
        ...req['createObj'],
        ...params,
      };
      const document = new this.customerTypeModel(saveObj);
      await document.save();
      return this.res.success('SUCCESS.CREATE')
    } catch (error) {
      return this.res.error(HttpStatus.BAD_REQUEST, 'ERROR.BAD_REQ')
    }
  }

  async findAllIncluencer(filter: {influencer_login_type_id: number, org_id: number}): Promise<any> {
    try {
      const result = await this.customerTypeModel.find({login_type_id: filter.influencer_login_type_id, org_id: filter.org_id});
      return result
    } catch (error) {
      return this.res.error(HttpStatus.BAD_REQUEST, 'ERROR.BAD_REQ', error);
    }
  }

  async read(req: Request, params: any): Promise<any> {
    try {
      let match: any = { is_delete: 0, org_id: req['user']['org_id'] };

      const projection: Record<string, any> = {
        updated_at: 0,
        created_unix_time: 0,
        is_delete: 0,
        org_id: 0,
      }

      if (params?.filters?.customer_type_name) {
        const pattern = new RegExp(params.filters.customer_type_name, 'i');
        match.customer_type_name = { $regex: pattern };
      }

      const page = parseInt(params?.page) || global.PAGE;
      const limit = parseInt(params?.limit) || global.LIMIT;
      const skip = (page - 1) * limit;

      const total = await this.customerTypeModel.countDocuments(match);

      const result = await this.customerTypeModel.find(match, projection)
        .skip(skip)
        .limit(limit)
      return this.res.pagination(result, total, page, limit);
    } catch (error) {
      return this.res.error(HttpStatus.BAD_REQUEST, 'ERROR.BAD_REQ', error);
    }
  }

  async readDropdown(req: Request, params: any): Promise<any> {
    try {
      let match: Record<string, any> =
      {
        is_delete: 0,
        org_id: req['user']['org_id'],
      };

      if (req?.url.includes(global.MODULE_ROUTES[2]) || req?.url.includes(global.MODULE_ROUTES[3])) match.is_order = true;
      if (req?.url.includes(global.MODULE_ROUTES[1])) match.is_checkin = true;
      if (params?.login_type_id) match.login_type_id = params.login_type_id

      if (params?.login_type_ids?.length) {
        match.login_type_id = { $in: params.login_type_ids };
      }
      if (params?.customer_type_ids?.length) {
        match._id = { $in: params.customer_type_ids };
      }
      const projection: Record<string, any> = {
        customer_type_name: 1,
        login_type_name: 1,
        login_type_id: 1
      }
      if (params?.filters?.label) match.customer_type_name = Like(params?.filters?.label)
      let data: Record<string, any>[] = await this.customerTypeModel.find(match, projection).sort({ sequance: 1 }).lean()
      data = data.map((row: any) => {
        return {
          label: row.customer_type_name,
          value: row._id,
          module_id: global.MODULES['Customers'],
          module_name: Object.keys(global.MODULES).find(key => global.MODULES[key] === global.MODULES['Customers']),
          login_type_id: row.login_type_id,
          login_type_name: row.login_type_name,
        }
      })

      if (params?.internalCall) return data
      return this.res.success('SUCCESS.FETCH', data)
    } catch (error) {
      return this.res.error(HttpStatus.BAD_REQUEST, 'ERROR.BAD_REQ', error);
    }
  }
  async getCustomerTypesByIds(req: Request, params: any): Promise<any> {
    try {
      const match: Record<string, any> =
      {
        is_delete: 0,
        org_id: req['user']['org_id'],
        _id: { $in: params?.customer_type_ids || params?.customer_type_id }
      };
      return await this.customerTypeModel.find(match).lean();
    } catch (error) {
      throw error
    }
  }

  async getCustomerTypesByLoginTypeId(req: Request, checkType: any): Promise<any> {
  try {
    return await this.customerTypeModel.findOne(checkType).lean();
  } catch (error) {
    throw error;
  }
}
}
