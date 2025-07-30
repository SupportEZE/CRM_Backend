import { Injectable, HttpStatus, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { ResponseService } from 'src/services/response.service';
import { SparePartTransactionModel } from '../models/spare-part-transaction.model';
import { SparePartModel } from '../models/spare-part.model';
import { SpareStockManageModel } from '../models/spare-stock-manage.model';
import { commonFilters, toObjectId } from 'src/common/utils/common.utils';
import { COLLECTION_CONST } from 'src/config/collection.constant';
import { RedisService } from 'src/services/redis.service';
import { ActiveTab } from './dto/app-spare-part.dto';
import { SharedCustomerService } from 'src/modules/master/customer/shared-customer.service';
import { AppSparePartRoutes } from './app-spare-part.controller';

const enum transactionType {
  ASSIGN = 'Assign'
}
const enum assignToType {
  CUSTOMER = 'Customer'
}

@Injectable()
export class AppSparePartService {

  constructor(
    @InjectModel(SparePartTransactionModel.name) private sparePartTransactionModel: Model<SparePartTransactionModel>,
    @InjectModel(SparePartModel.name) private sparePartModel: Model<SparePartModel>,
    @InjectModel(SpareStockManageModel.name) private spareStockManageModel: Model<SpareStockManageModel>,
    private readonly res: ResponseService,
    private readonly sharedCustomerService: SharedCustomerService,
    private readonly redisService: RedisService,
  ) { }

  async read(req: Request, params: any): Promise<any> {
    try {
      let match: Record<string, any> = {
        is_delete: 0,
        org_id: req['user']['org_id'],
        assigned_to_id: req['user']['_id'],
      };

      const filters: Record<string, any> = commonFilters(params?.filters);
      match = { ...match, ...filters };

      const sorting: Record<string, 1 | -1> = { _id: -1 };

      const page: number = params?.page || global.PAGE;
      let limit: number = params?.limit || global.LIMIT;
      const skip: number = (page - 1) * limit;

      if (req?.url.includes(AppSparePartRoutes.READ_DROPDOWN)) limit = global.OPTIONS_LIMIT;


      let pipeline: any[] = [
        { $match: match },
        {
          $lookup: {
            from: COLLECTION_CONST().CRM_SPARE_PART,
            localField: 'product_id',
            foreignField: '_id',
            as: 'product',
          }
        },
        { $unwind: '$product' },
        {
          $lookup: {
            from: COLLECTION_CONST().CRM_SPARE_PART_TRANSACTION,
            let: { pid: '$product_id' },
            pipeline: [
              { $match: { $expr: { $eq: ['$product_id', '$$pid'] } } },
              { $sort: { created_at: -1 } },
              { $limit: 1 },
              { $project: { created_at: 1, product_id: 1 } }
            ],
            as: 'last_txn'
          }
        },
        {
          $addFields: {
            qty: '$stock_qty',
            last_transaction_date: { $ifNull: [{ $arrayElemAt: ['$last_txn.created_at', 0] }, null] }
          }
        },
        {
          $project: {
            qty: 1,
            last_transaction_date: 1,
            'product._id': 1,
            'product.product_code': 1,
            'product.product_name': 1,
            'product.description': 1,
            'product.mrp': 1,
          }
        },
        { $sort: sorting }
      ];

      const countPipeline = [...pipeline, { $count: 'total' }];
      const countResult = await this.spareStockManageModel.aggregate(countPipeline);
      const total = countResult[0]?.total || 0;

      if (req?.url.includes(AppSparePartRoutes.READ)) {
        pipeline.push({ $skip: skip }, { $limit: limit });
      } else if (req?.url.includes(AppSparePartRoutes.READ_DROPDOWN)) {
        pipeline.push({ $limit: limit });
      }

      const data = await this.spareStockManageModel.aggregate(pipeline);

      if (req?.url.includes(AppSparePartRoutes.READ_DROPDOWN)) {
        const dropdown = data.map((row: any) => ({
          value: row.product._id,
          product_code: row.product.product_code,
          label: row.product.product_name,
          description: row.product.description,
          qty: row.qty,
        }));
        return this.res.success('SUCCESS.FETCH', dropdown);
      }

      const formattedData = data.map((row: any) => ({
        _id: row.product._id,
        product_code: row.product.product_code,
        product_name: row.product.product_name,
        description: row.product.description,
        qty: row.qty,
        last_transaction_date: row.last_transaction_date
      }));

      return this.res.pagination(formattedData, total, page, limit);

    } catch (error) {
      return this.res.error(HttpStatus.BAD_REQUEST, 'ERROR.BAD_REQ', error);
    }
  }
  async detail(req: Request, params: any): Promise<any> {
    try {
      let match: Record<string, any> = {
        is_delete: 0,
        org_id: req['user']['org_id'],
        product_id: toObjectId(params.product_id),
        assigned_to_id: req['user']['_id']
      };

      const projection: Record<string, any> = {
        product_name: 1,
        product_code: 1,
        description: 1,
        product_id: 1,
      };

      let data: Record<string, any> = await this.spareStockManageModel
        .findOne(match, projection)
        .lean();

      if (!data) return this.res.success('SUCCESS.FETCH', null);

      delete match.assigned_to_id
      match._id = match.product_id
      delete match.product_id
      const sparePart: Record<string, any> = await this.sparePartModel
        .findOne(match, projection)
        .lean();

      data.description = sparePart.description
      data.mrp = sparePart.mrp

      let output: Record<string, any> = {};
      let counts: Record<string, any> = {};
      output.result = data;
      output.count = counts;
      if (params?.active_tab === ActiveTab.OUTGOING) {
        output.outgoing_stock = await this.outgoingStock(req, params)
      }
      if (params?.active_tab === ActiveTab.INCOMING) {
        output.incoming_stock = await this.incomingStock(req, params)
      }

      params.count = true;
      output.count.incoming_stock = await this.incomingStock(req, params) || 0
      output.count.outgoing_stock = await this.outgoingStock(req, params) || 0

      return this.res.success('SUCCESS.FETCH', output);

    } catch (error) {
      return this.res.error(HttpStatus.BAD_REQUEST, 'ERROR.BAD_REQ', error);
    }
  }
  async incomingStock(req: Request, params: any): Promise<any> {
    try {

      let match: Record<string, any> = {
        is_delete: 0,
        org_id: req['user']['org_id'],
        product_id: toObjectId(params.product_id),
        assigned_to_id: req['user']['_id']
      };

      if (params?.count) {
        return await this.sparePartTransactionModel.countDocuments(match);
      }
      const page: number = params?.page || global.PAGE;
      const limit: number = params?.limit || global.LIMIT;
      const skip: number = (page - 1) * limit;


      const projection: Record<string, any> = {
        created_at: 1,
        transaction_qty: 1,
        delivery_note: 1,
      };

      let data: Record<string, any> = await this.sparePartTransactionModel
        .find(match, projection)
        .limit(limit)
        .skip(skip)
        .lean();

      return data
    } catch (error) {
      throw error
    }
  }
  async outgoingStock(req: Request, params: any): Promise<any> {
    try {

      let match: Record<string, any> = {
        is_delete: 0,
        org_id: req['user']['org_id'],
        product_id: toObjectId(params.product_id),
        created_id: req['user']['_id']
      };

      if (params?.count) {
        return await this.sparePartTransactionModel.countDocuments(match);
      }

      const page: number = params?.page || global.PAGE;
      const limit: number = params?.limit || global.LIMIT;
      const skip: number = (page - 1) * limit;


      const projection: Record<string, any> = {
        created_at: 1,
        transaction_qty: 1,
        delivery_note: 1,
        assigned_to_id: 1
      };

      let data: Record<string, any> = await this.sparePartTransactionModel
        .find(match, projection)
        .limit(limit)
        .skip(skip)
        .lean();

      let assingIds = data?.map((row: any) => row.assigned_to_id)

      const customers = await this.sharedCustomerService.getCustomersByIds(req, { customer_ids: assingIds })

      const customerMap = new Map(
        customers.map((cust: any) => [String(cust._id), {
          name: cust.customer_name,
          mobile: cust.mobile,
          customer_type_name: cust.customer_type_name
        }])
      );

      data = data.map((row: any) => ({
        ...row,
        customer_info: customerMap.get(String(row.assigned_to_id)) || null
      }));

      return data
    } catch (error) {
      throw error
    }
  }
  async transferStock(req: any, params: any): Promise<any> {
    try {

      if (!params?.otp) return this.res.error(HttpStatus.BAD_REQUEST, 'ERROR.OTP_REQUIRED');
      const { otp, redisKey } = await this.happyCode(req, params);
      if (params.otp !== otp) return this.res.error(HttpStatus.BAD_REQUEST, 'ERROR.INVALID_OTP');
      await this.redisService.delete(redisKey);

      const { status, message } = await this.validateStockAndSendOtp(req, params);
      if (!status) return this.res.error(HttpStatus.BAD_REQUEST, message);
      let gifts = params.pop_gifts;
      delete params.pop_gifts
      params.assign_to_type = assignToType.CUSTOMER
      params.assigned_to_id = toObjectId(params.assigned_to_id)
      gifts = gifts.map((row: any) => {
        return {
          ...req['createObj'],
          ...row,
          product_id: toObjectId(row.product_id),
          ...params,
          transaction_type: transactionType.ASSIGN,
          created_login_id: req['user']['login_type_id'],
          assigned_to_login_id: params.login_type_id
        }
      })

      const insert: Record<string, any> = await this.sparePartTransactionModel.insertMany(gifts)
      if (insert) {
        await this.spareStockManageModel.bulkWrite(
          gifts.map((gift: any) => ({
            updateOne: {
              filter: {
                product_id: gift.product_id,
                assigned_to_id: req['user']['_id'],
              },
              update: {
                $inc: { stock_qty: -gift.transaction_qty },
              },
              upsert: false,
            },
          }))
        );
      }
      return this.res.success('SUCCESS.CREATE');
    } catch (error) {
      return this.res.error(HttpStatus.BAD_REQUEST, 'ERROR.BAD_REQ', error);
    }
  }
  async validateStockAndSendOtp(req: any, params: any): Promise<any> {
    try {
      const errors: string[] = [];

      for (let row of params.pop_gifts) {
        const stock = await this.spareStockManageModel.findOne({
          product_id: toObjectId(row.product_id),
          assigned_to_id: req['user']['_id'],
        });

        const availableQty = stock?.stock_qty || 0;

        if (row.transaction_qty > availableQty) {
          errors.push(
            `Quantity for (${row.product_name}) (${row.transaction_qty}) cannot be greater than available stock (${availableQty})`
          );
        }
      }

      if (req?.url.includes(AppSparePartRoutes.SEND_OTP)) {
        if (errors?.length > 0) {
          return this.res.error(HttpStatus.BAD_REQUEST, errors.join(', '));
        }
        params.set = true;
        const otp = await this.happyCode(req, params)
        return this.res.success('SUCCESS.FETCH', { otp });
      } else {
        if (errors.length) {
          return {
            status: false,
            message: errors.join(', '),
          };
        } else {
          return {
            status: true,
          };
        }
      }
    } catch (error) {
      if (req?.url.includes(AppSparePartRoutes.SEND_OTP)) {
        return this.res.error(HttpStatus.BAD_REQUEST, 'ERROR.BAD_REQ', error);
      } else {
        throw error
      }
    }
  }
  async happyCode(req: any, params: any): Promise<any> {
    try {

      let otp = 1234;

      const redisKey = this.redisService.buildKey([
        'org', req['user']['org_id'],
        'mobile', params.mobile,
        '_id', req['user']['_id'],
      ]);

      if (params?.set) {
        await this.redisService.delete(redisKey);
        await this.redisService.set(redisKey, otp);
        return otp;
      } else {
        otp = await this.redisService.get(redisKey);
        return { otp, redisKey }
      }
    } catch (error) {
      throw error
    }
  }
  async resendOtp(req: any, params: any): Promise<any> {
    try {
      if (!params) {
        params.otp = 1234;
      }

      const redisKey = this.redisService.buildKey([
        'org', req['user']['org_id'],
        'mobile', params.mobile,
        '_id', req['user']['_id'],
      ]);

      await this.redisService.delete(redisKey);
      params.set = true;
      const otp = await this.happyCode(req, params)
      return this.res.success('SUCCESS.FETCH', { otp });
    } catch (error) {
      throw error
    }
  }

}
