import { HttpStatus, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { PaymentModel } from '../models/payment.model';
import mongoose, { Model, Types } from 'mongoose';
import { ResponseService } from 'src/services/response.service';
import {
  toObjectId,
  commonFilters,
  Like,
  nextSeq,
} from 'src/common/utils/common.utils';
import { S3Service } from 'src/shared/rpc/s3.service';
import { CustomerModel } from 'src/modules/master/customer/default/models/customer.model';
import { PaymentDocsModel } from '../models/payment-docs.model';

@Injectable()
export class PaymentService {
  constructor(
    @InjectModel(PaymentModel.name) private paymentModel: Model<PaymentModel>,
    @InjectModel(CustomerModel.name)
    private customerModel: Model<CustomerModel>,
    @InjectModel(PaymentDocsModel.name)
    private paymentDocsModel: Model<PaymentDocsModel>,
    private readonly res: ResponseService,
    private readonly s3Service: S3Service,
  ) {}

  async create(req: any, params: any): Promise<any> {
    try {
      const {
        collected_from_id,
        payment_to_id,
        transaction_id,
        payment_mode,
        payment_date,
        customer_type_id,
        collected_from_login_type_id,
      } = params;
      let match: Record<string, any> = {
        is_delete: 0,
        org_id: req['user']['org_id'],
        payment_mode: payment_mode,
        transaction_id: transaction_id,
        payment_date: payment_date,
        collected_from_id: toObjectId(collected_from_id),
      };
      const exist: Record<string, any>[] = await this.paymentModel
        .find(match)
        .exec();
      if (exist.length > 0)
        return this.res.error(HttpStatus.BAD_REQUEST, 'WARNING.ALREADY_EXIST');

      const seq = {
        modelName: this.paymentModel,
        idKey: 'payment_no',
        prefix: 'PAY',
      };

      const payment_no = await nextSeq(req, seq);

      const saveObj: Record<string, any> = {
        ...req['createObj'],
        ...params,
        collected_from_id: toObjectId(collected_from_id),
        customer_type_id: toObjectId(customer_type_id),
        payment_no,
      };

      if (collected_from_login_type_id === 5) {
        saveObj.payment_to_id = req['user']['_id'];
        saveObj.payment_to_name = req['user']['name'];
        saveObj.payment_to_login_type_id = req['user']['login_type_id'];
      } else if (collected_from_login_type_id === 7) {
        saveObj.payment_to_id = toObjectId(payment_to_id);
        saveObj.payment_to_name = params.payment_to_name;
        saveObj.payment_to_login_type_id = params.payment_to_login_type_id;
      }

      const document = new this.paymentModel(saveObj);
      const insert = await document.save();

      return this.res.success('SUCCESS.CREATE', { inserted_id: insert._id });
    } catch (error) {
      return this.res.error(HttpStatus.BAD_REQUEST, 'ERROR.BAD_REQ', error);
    }
  }

  async read(req: Request, params: any): Promise<any> {
    try {
      let match: any = { is_delete: 0, org_id: req['user']['org_id'] };
      let sorting: Record<string, 1 | -1> = { _id: -1 };

      if (params?.sorting && Object.keys(params.sorting).length !== 0)
        sorting = params.sorting;

      const filters: Record<string, any> = commonFilters(params?.filters);
      match = { ...match, ...filters };

      if (params?.activeTab && params.activeTab !== 'All') {
        match['status'] = params.activeTab;
      }

      const page: number = params?.page || global.PAGE;
      const limit: number = params?.limit || global.LIMIT;
      const skip: number = (page - 1) * limit;

      const pipeline = [
        { $match: match },
        { $sort: sorting },
        { $project: { created_unix_time: 0 } },
      ];

      const totalCountData: Record<string, any>[] =
        await this.paymentModel.aggregate([
          ...pipeline,
          { $count: 'totalCount' },
        ]);

      const total: number =
        totalCountData.length > 0 ? totalCountData[0].totalCount : 0;

      let result = await this.paymentModel
        .find(match)
        .skip(skip)
        .limit(limit)
        .sort(sorting)
        .lean();

      const allStatuses = ['Pending', 'Verified', 'Reject', 'All'];

      const tabWiseCounts = await this.paymentModel.aggregate([
        {
          $match: {
            is_delete: 0,
            org_id: req['user']['org_id'],
          },
        },
        {
          $group: {
            _id: '$status',
            count: { $sum: 1 },
          },
        },
      ]);

      const rawStatusCounts = tabWiseCounts.reduce(
        (acc, cur) => {
          acc[cur._id] = cur.count;
          return acc;
        },
        {} as Record<string, number>,
      );

      const status_counts = allStatuses.reduce(
        (acc, status) => {
          acc[status] = rawStatusCounts[status] || 0;
          return acc;
        },
        {} as Record<string, number>,
      );

      status_counts['All'] = Object.values(status_counts).reduce(
        (a, b) => a + b,
        0,
      );

      const customerIds = result
        .map((r) => r.collected_from_id)
        .filter(Boolean);
      const customerData = await this.customerModel
        .find({ _id: { $in: customerIds } })
        .lean();

      const customerMap = new Map<string, string>(
        customerData.map((c) => [String(c._id), c.mobile]),
      );

      result = result.map((item) => {
        const customerMobile =
          customerMap.get(String(item.collected_from_id)) || '';

        return {
          ...item,
          mobile_number: customerMobile,
        };
      });
      const data: any = { result, status_counts };

      return this.res.pagination(data, total, page, limit);
    } catch (error) {
      return this.res.error(HttpStatus.BAD_REQUEST, 'ERROR.BAD_REQ', error);
    }
  }

  async detail(req: Request, params: any): Promise<any> {
    try {
      const match: Record<string, any> = {
        org_id: req['user']['org_id'],
        _id: toObjectId(params._id),
        is_delete: 0,
      };

      const resultArray = await this.paymentModel
        .aggregate([
          { $match: match },
          {
            $lookup: {
              from: 'crm_customers',
              localField: 'payment_to_id',
              foreignField: '_id',
              as: 'payment_to_customer',
            },
          },
          {
            $unwind: {
              path: '$payment_to_customer',
              preserveNullAndEmptyArrays: true,
            },
          },
          {
            $lookup: {
              from: 'crm_customers',
              localField: 'collected_from_id',
              foreignField: '_id',
              as: 'collected_from_customer',
            },
          },
          {
            $unwind: {
              path: '$collected_from_customer',
              preserveNullAndEmptyArrays: true,
            },
          },
          {
            $addFields: {
              payment_to_mobile: '$payment_to_customer.mobile',
              collected_from_mobile: '$collected_from_customer.mobile',
            },
          },
          {
            $project: {
              payment_to_customer: 0,
              collected_from_customer: 0,
            },
          },
        ])
        .exec();

      const result = resultArray[0] || {};

      if (result._id) {
        result.files = await this.getDocument(
          result._id,
          global.THUMBNAIL_IMAGE,
        );
      }

      return this.res.success('SUCCESS.FETCH', result);
    } catch (error) {
      return this.res.error(HttpStatus.BAD_REQUEST, 'ERROR.BAD_REQ', error);
    }
  }

  async updateStatus(req: Request, params: any): Promise<any> {
    try {
      const { status, reason, customers = [] } = params;

      const ids = customers
        .map((c: any) => c._id)
        .filter((id: string) => id?.length === 24);

      if (!ids.length) {
        return this.res.error(HttpStatus.BAD_REQUEST, 'WARNING.NOT_EXIST');
      }

      const match = {
        _id: { $in: ids.map(toObjectId) },
        org_id: req['user']['org_id'],
        is_delete: 0,
      };

      const existingPayments = await this.paymentModel.find(match).lean();

      if (!existingPayments.length) {
        return this.res.error(HttpStatus.BAD_REQUEST, 'WARNING.NOT_EXIST');
      }

      const updateObj: Record<string, any> = {
        ...req['updateObj'],
      };

      if (status) updateObj.status = status;
      if (reason) updateObj.reason = reason;

      await this.paymentModel.updateMany(match, { $set: updateObj });

      return this.res.success('SUCCESS.STATUS_UPDATE', {
        updated_count: existingPayments.length,
      });
    } catch (error) {
      return this.res.error(HttpStatus.BAD_REQUEST, 'ERROR.BAD_REQ', error);
    }
  }

  async upload(files: Express.Multer.File[], req: any): Promise<any> {
    try {
      req.body.module_name = Object.keys(global.MODULES).find(
        (key) => global.MODULES[key] === global.MODULES['Payment Collection'],
      );
      let response = await this.s3Service.uploadMultiple(
        files,
        req,
        this.paymentDocsModel,
      );
      return this.res.success('SUCCESS.CREATE', response);
    } catch (error) {
      return this.res.error(
        HttpStatus.BAD_REQUEST,
        'Error uploading files to S3',
        error?.message || error,
      );
    }
  }

  async getDocument(
    id: any,
    type:
      | typeof global.FULL_IMAGE
      | typeof global.THUMBNAIL_IMAGE
      | typeof global.BIG_THUMBNAIL_IMAGE = global.FULL_IMAGE,
  ): Promise<any> {
    return this.s3Service.getDocumentsByRowId(this.paymentDocsModel, id, type);
  }

  async getDocumentByDocsId(req: any, params: any): Promise<any> {
    const doc = await this.s3Service.getDocumentsById(
      this.paymentDocsModel,
      params._id,
    );
    return this.res.success('SUCCESS.FETCH', doc);
  }
}
