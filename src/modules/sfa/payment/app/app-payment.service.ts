import { HttpStatus, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { PaymentModel } from '../models/payment.model';
import { Model } from 'mongoose';
import { ResponseService } from 'src/services/response.service';
import {
  toObjectId,
  appCommonFilters,
  nextSeq,
} from 'src/common/utils/common.utils';
import { S3Service } from 'src/shared/rpc/s3.service';
import { CustomerModel } from 'src/modules/master/customer/default/models/customer.model';
import { PaymentDocsModel } from '../models/payment-docs.model';
import { PaymentService } from '../web/payment.service';
import { COLLECTION_CONST } from 'src/config/collection.constant';

@Injectable()
export class AppPaymentService {
  constructor(
    @InjectModel(PaymentModel.name) private paymentModel: Model<PaymentModel>,
    @InjectModel(CustomerModel.name)
    private customerModel: Model<CustomerModel>,
    @InjectModel(PaymentDocsModel.name)
    private paymentDocsModel: Model<PaymentDocsModel>,

    private readonly res: ResponseService,
    private readonly paymentService: PaymentService,
    private readonly s3Service: S3Service,
  ) {}

  async create(req: any, params: any): Promise<any> {
    try {
      const {
        collected_from_id,
        payment_mode,
        transaction_id,
        payment_date,
        customer_type_id,
      } = params;
      let match: Record<string, any> = {
        is_delete: 0,
        org_id: req['user']['org_id'],
        payment_to_id: req['user']['_id'],
        payment_to_name: req['user']['name'],
        payment_mode: payment_mode,
        transaction_id: transaction_id,
        collected_from_id: toObjectId(collected_from_id),
        payment_date: payment_date,
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

      if (params?.visit_activity_id)
        params.visit_activity_id = toObjectId(params.visit_activity_id);

      const saveObj: Record<string, any> = {
        ...req['createObj'],
        ...params,
        customer_type_id: toObjectId(customer_type_id),
        collected_from_id: toObjectId(collected_from_id),
        payment_to_login_type_id: req['user']['login_type_id'],
        payment_to_id: req['user']['_id'],
        payment_to_name: req['user']['name'],
        payment_no,
      };

      const document = new this.paymentModel(saveObj);
      const insert = await document.save();

      return this.res.success('SUCCESS.CREATE', { inserted_id: insert._id });
    } catch (error) {
      return this.res.error(HttpStatus.BAD_REQUEST, 'ERROR.BAD_REQ', error);
    }
  }

  async read(req: Request, params: any): Promise<any> {
    try {
      let match: Record<string, any> = {
        is_delete: 0,
        org_id: req['user']['org_id'],
        payment_to_id: req['user']['_id'],
        payment_to_name: req['user']['name'],
      };
      let sorting: Record<string, 1 | -1> = { _id: -1 };
      if (params?.filters?.search) {
        const fieldsToSearch = ['collected_from_name', 'req_id'];
        const searchQuery = appCommonFilters(params.filters, fieldsToSearch);
        match = { ...match, ...searchQuery };
      }

      if (params?.activeTab && params.activeTab !== 'All') {
        match['status'] = params.activeTab;
      }

      const page: number = Math.max(
        1,
        parseInt(params?.page, 10) || global.PAGE,
      );
      const limit: number = Math.max(
        1,
        parseInt(params?.limit, 10) || global.LIMIT,
      );
      const skip: number = (page - 1) * limit;

      const total = await this.paymentModel.countDocuments(match);
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
            payment_to_id: req['user']['_id'],
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
      params._id = toObjectId(params._id);

      const match: Record<string, any> = {
        org_id: req['user']['org_id'],
        _id: params._id,
        is_delete: 0,
      };
      const resultArray = await this.paymentModel
        .aggregate([
          { $match: match },
          {
            $lookup: {
              from: COLLECTION_CONST().CRM_CUSTOMERS,
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
              from: COLLECTION_CONST().CRM_CUSTOMERS,
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

      result.files = await this.paymentService.getDocument(
        result._id,
        global.THUMBNAIL_IMAGE,
      );

      return this.res.success('SUCCESS.FETCH', result);
    } catch (error) {
      return this.res.error(HttpStatus.BAD_REQUEST, 'ERROR.BAD_REQ', error);
    }
  }

  async update(req: any, params: any): Promise<any> {
    try {
      params._id = toObjectId(params._id);
      const { collected_from_id, customer_type_id } = params;

      let match: Record<string, any> = {
        _id: params._id,
        org_id: req['user']['org_id'],
        is_delete: 0,
      };
      const exist: Record<string, any> = await this.paymentModel
        .findOne(match)
        .exec();
      if (!exist)
        return this.res.error(HttpStatus.NOT_FOUND, 'WARNING.NOT_EXIST');
      const updateObj = {
        ...req['updateObj'],
        ...params,
        customer_type_id: toObjectId(customer_type_id),
        collected_from_id: toObjectId(collected_from_id),
        payment_to_login_type_id: req['user']['login_type_id'],
        payment_to_id: req['user']['_id'],
        payment_to_name: req['user']['name'],
      };
      await this.paymentModel.updateOne(
        { _id: params._id },
        { $set: updateObj },
      );
      return this.res.success('SUCCESS.UPDATE');
    } catch (error) {
      return this.res.error(HttpStatus.BAD_REQUEST, 'ERROR.BAD_REQ', error);
    }
  }

  async delete(req: any, params: any): Promise<any> {
    try {
      params._id = toObjectId(params._id);

      let match: any = { _id: params._id, is_delete: 0 };
      const exist = await this.paymentModel.findOne(match).exec();
      if (!exist)
        return this.res.error(HttpStatus.NOT_FOUND, 'WARNING.NOT_EXIST');
      const updateObj = {
        ...req['updateObj'],
        is_delete: 1,
      };
      await this.paymentModel.updateOne({ _id: params._id }, updateObj);
      return this.res.success('SUCCESS.DELETE');
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
