import { Injectable, HttpStatus } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { ResponseService } from 'src/services/response.service';
import {
  commonFilters,
  nextSeq,
  toObjectId,
} from 'src/common/utils/common.utils';
import { BrandAuditModel } from '../models/brand-audit.model';
import { BrandRequestModel } from '../models/brand-request.model';
import { CustomerModel } from 'src/modules/master/customer/default/models/customer.model';
import { UserHierarchyModel } from 'src/modules/master/user/models/user-hierarchy.model';
import { BrandRequestDocsModel } from '../models/brand-request-docs.model';
import { S3Service } from 'src/shared/rpc/s3.service';
import { Model } from 'mongoose';
import { SharedUserService } from 'src/modules/master/user/shared-user.service';
interface BrandRequestLean {
  _id: any;
  created_id: any;
  customer_name: string;
  req_id: string;
  status: string;
  [key: string]: any;
}
@Injectable()
export class BrandAuditService {
  constructor(
    @InjectModel(BrandAuditModel.name)
    private brandAuditModel: Model<BrandAuditModel>,
    @InjectModel(BrandRequestModel.name)
    private brandRequestModel: Model<BrandRequestModel>,
    @InjectModel(BrandRequestDocsModel.name)
    private brandRequestDocsModel: Model<BrandRequestDocsModel>,
    @InjectModel(CustomerModel.name)
    private customerModel: Model<CustomerModel>,
    @InjectModel(UserHierarchyModel.name)
    private userHierarchyModel: Model<UserHierarchyModel>,
    private readonly res: ResponseService,
    private readonly s3Service: S3Service,
    private readonly sharedUserService: SharedUserService,
  ) {}

  async createBrandRequest(req: any, params: any): Promise<any> {
    try {
      const { customer_id, customer_type_id, product_id } = params;
      const match: Record<string, any> = {
        is_delete: 0,
        org_id: req['user']['org_id'],
        customer_type_id: toObjectId(customer_type_id),
        customer_id: toObjectId(customer_id),
        remark: params.remark,
        product_id: toObjectId(product_id),
      };
      const exist: Record<string, any>[] = await this.brandRequestModel
        .find(match)
        .exec();
      if (exist?.length > 0)
        return this.res.error(HttpStatus.BAD_REQUEST, 'WARNING.ALREADY_EXIST');

      const seq = {
        modelName: this.brandRequestModel,
        idKey: 'brand_req_id',
        prefix: 'BR',
      };

      const brand_req_id = await nextSeq(req, seq);

      const saveObj: Record<string, any> = {
        ...req['createObj'],
        ...params,
        customer_type_id: toObjectId(customer_type_id),
        customer_id: toObjectId(customer_id),
        product_id: toObjectId(product_id),
        brand_req_id,
      };
      const document = new this.brandRequestModel(saveObj);
      const insert = await document.save();
      return this.res.success('SUCCESS.CREATE', { inserted_id: insert._id });
    } catch (error) {
      return this.res.error(HttpStatus.BAD_REQUEST, 'ERROR.BAD_REQ', error);
    }
  }

  async readBrandRequest(req: Request, params: any): Promise<any> {
    try {
      let match: any = { is_delete: 0, org_id: req['user']['org_id'] };
      let sorting: Record<string, 1 | -1> = { _id: -1 };

      if (params?.sorting && Object.keys(params.sorting).length !== 0) {
        sorting = params.sorting;
      }

      if (
        global.LOGIN_TYPE_ID_PERMISSION?.includes(req['user']['login_type_id'])
      ) {
        const userIds = await this.sharedUserService.getUsersIds(req, params);
        match.$or = [{ created_id: { $in: userIds } }];
      }

      const filters: Record<string, any> = commonFilters(params?.filters);
      match = { ...match, ...filters };

      if (params?.activeTab && params.activeTab !== 'All') {
        match['status'] = params.activeTab;
      }

      const page: number = params?.page || global.PAGE;
      const limit: number = params?.limit || global.LIMIT;
      const skip: number = (page - 1) * limit;

      const totalCountData: Record<string, any>[] =
        await this.brandRequestModel.aggregate([
          { $match: match },
          { $sort: sorting },
          { $project: { created_unix_time: 0 } },
          { $count: 'totalCount' },
        ]);
      const total: number =
        totalCountData.length > 0 ? totalCountData[0].totalCount : 0;

      const resultRaw = await this.brandRequestModel
        .find(match)
        .skip(skip)
        .limit(limit)
        .sort(sorting)
        .lean<BrandRequestLean[]>();

      const allStatuses = ['Pending', 'Approved', 'Reject', 'Complete', 'All'];
      const tabWiseCounts = await this.brandRequestModel.aggregate([
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

      // Use created_id instead of customer_id
      const createdIds = resultRaw.map((r) => r.created_id).filter(Boolean);

      const [customerData, hierarchyData] = await Promise.all([
        this.customerModel.find({ _id: { $in: createdIds } }).lean(),
        this.userHierarchyModel
          .find({ child_user_id: { $in: createdIds } })
          .lean(),
      ]);

      const customerMap = new Map<string, string>(
        customerData.map((c) => [String(c._id), c.mobile]),
      );

      const managerMap = new Map<string, string>(
        hierarchyData.map((h) => [String(h.child_user_id), h.parent_user_name]),
      );

      const result = resultRaw.map((item) => {
        const customerMobile = customerMap.get(String(item.created_id)) || '';
        const reportingManager = managerMap.get(String(item.created_id)) || '';

        return {
          ...item,
          mobile_number: customerMobile,
          reporting_manager: reportingManager,
        };
      });

      const data: any = { result, status_counts };
      return this.res.pagination(data, total, page, limit);
    } catch (error) {
      return this.res.error(HttpStatus.BAD_REQUEST, 'ERROR.BAD_REQ', error);
    }
  }

  async detailBrandRequest(req: Request, params: any): Promise<any> {
    try {
      const match: Record<string, any> = {
        org_id: req['user']['org_id'],
        _id: toObjectId(params._id),
        is_delete: 0,
      };
      const result: Record<string, any> = await this.brandRequestModel
        .findOne(match)
        .lean();
      if (!result)
        return this.res.error(HttpStatus.NOT_FOUND, 'ERROR.NOT_FOUND');
      if (result.customer_id) {
        const customer = await this.customerModel
          .findOne({ _id: result.customer_id })
          .lean();
        if (customer?.mobile) {
          result.customer_mobile = customer.mobile;
        } else {
          result.customer_mobile = '';
        }
      }

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

  async createBrandAudit(req: any, params: any): Promise<any> {
    try {
      const { customer_id, customer_type_id, competitors } = params;
      const match: Record<string, any> = {
        is_delete: 0,
        org_id: req['user']['org_id'],
        customer_type_id: toObjectId(customer_type_id),
        customer_id: toObjectId(customer_id),
        competitors: competitors,
        remark: params.remark,
      };
      const exist: Record<string, any>[] = await this.brandAuditModel
        .find(match)
        .exec();
      if (exist?.length > 0)
        return this.res.error(HttpStatus.BAD_REQUEST, 'WARNING.ALREADY_EXIST');

      const seq = {
        modelName: this.brandAuditModel,
        idKey: 'brand_audit_id',
        prefix: 'BA',
      };

      const brand_audit_id = await nextSeq(req, seq);

      const saveObj: Record<string, any> = {
        ...req['createObj'],
        ...params,
        customer_type_id: toObjectId(customer_type_id),
        customer_id: toObjectId(customer_id),
        brand_audit_id,
      };
      const document = new this.brandAuditModel(saveObj);
      const insert = await document.save();
      return this.res.success('SUCCESS.CREATE', { inserted_id: insert._id });
    } catch (error) {
      return this.res.error(HttpStatus.BAD_REQUEST, 'ERROR.BAD_REQ', error);
    }
  }

  async readBrandAudit(req: Request, params: any): Promise<any> {
    try {
      let match: Record<string, any> = {
        is_delete: 0,
        org_id: req['user']['org_id'],
      };
      let sorting: Record<string, 1 | -1> = { _id: -1 };

      if (params?.sorting && Object.keys(params.sorting).length !== 0)
        sorting = params.sorting;
      const filters = params?.filters || {};
      Object.assign(match, commonFilters(filters));

      if (
        global.LOGIN_TYPE_ID_PERMISSION?.includes(req['user']['login_type_id'])
      ) {
        const userIds = await this.sharedUserService.getUsersIds(req, params);
        params.match.$or = [{ created_id: { $in: userIds } }];
      }

      const page: number = params?.page || global.PAGE;
      const limit: number = params?.limit || global.LIMIT;
      const skip: number = (page - 1) * limit;

      const pipeline = [
        {
          $match: match,
        },
        {
          $sort: sorting,
        },
      ];

      const totalCountData = await this.brandAuditModel.aggregate([
        ...pipeline,
        { $count: 'totalCount' },
      ]);

      const total =
        totalCountData.length > 0 ? totalCountData[0].totalCount : 0;

      let result: any = await this.brandAuditModel.aggregate([
        ...pipeline,
        { $skip: skip },
        { $limit: limit },
      ]);

      return this.res.pagination(result, total, page, limit);
    } catch (error) {
      return this.res.error(HttpStatus.BAD_REQUEST, 'ERROR.BAD_REQ', error);
    }
  }

  async detailBrandAudit(req: Request, params: any): Promise<any> {
    try {
      const match: Record<string, any> = {
        org_id: req['user']['org_id'],
        _id: toObjectId(params._id),
        is_delete: 0,
      };
      const result: Record<string, any> = await this.brandAuditModel
        .findOne(match)
        .lean();

      if (!result) {
        return this.res.error(HttpStatus.NOT_FOUND, 'ERROR.NOT_FOUND');
      }

      // Fetch customer mobile if customer_id exists
      if (result.customer_id) {
        const customer = await this.customerModel
          .findOne({ _id: result.customer_id })
          .lean();
        if (customer?.mobile) {
          result.customer_mobile = customer.mobile;
        } else {
          result.customer_mobile = '';
        }
      }

      if (result._id) {
        const files = await this.getDocument(
          result._id,
          global.THUMBNAIL_IMAGE,
        );

        result.images = files.filter((f) => f.label === 'Audit');
        result.competitor_images = files.filter(
          (f) => f.label === 'Competitor Images',
        );
      }

      return this.res.success('SUCCESS.FETCH', result);
    } catch (error) {
      return this.res.error(HttpStatus.BAD_REQUEST, 'ERROR.BAD_REQ', error);
    }
  }

  async status(req: Request, params: any): Promise<any> {
    try {
      const exist: Record<string, any> = await this.brandRequestModel
        .findOne({ _id: toObjectId(params._id), is_delete: 0 })
        .exec();
      if (!exist)
        return this.res.error(HttpStatus.NOT_FOUND, 'ERROR.NOT_FOUND');

      const updateObj: Record<string, any> = {
        ...req['updateObj'],
        status: params.status,
        reason: params.reason,
      };
      await this.brandRequestModel.updateOne({ _id: params._id }, updateObj);
      return this.res.success('SUCCESS.STATUS_UPDATE');
    } catch (error) {
      return this.res.error(HttpStatus.BAD_REQUEST, 'ERROR.BAD_REQ', error);
    }
  }

  async upload(files: Express.Multer.File[], req: any): Promise<any> {
    try {
      req.body.module_name = Object.keys(global.MODULES).find(
        (key) => global.MODULES[key] === global.MODULES['Branding'],
      );
      let response = await this.s3Service.uploadMultiple(
        files,
        req,
        this.brandRequestDocsModel,
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
    return this.s3Service.getDocumentsByRowId(
      this.brandRequestDocsModel,
      id,
      type,
    );
  }

  async getDocumentByDocsId(req: any, params: any): Promise<any> {
    const doc = await this.s3Service.getDocumentsById(
      this.brandRequestDocsModel,
      params._id,
    );
    return this.res.success('SUCCESS.FETCH', doc);
  }

  async deleteFile(req: Request, params: any): Promise<any> {
    try {
      params._id = toObjectId(params._id);
      const exist: Record<string, any> = await this.brandRequestDocsModel
        .findOne({ _id: params._id, is_delete: 0 })
        .exec();

      if (!exist)
        return this.res.error(HttpStatus.NOT_FOUND, 'ERROR.NOT_FOUND');

      const updateObj = {
        ...req['updateObj'],
        is_delete: 1,
      };
      await this.brandRequestDocsModel.updateOne(
        { _id: params._id },
        updateObj,
      );

      return this.res.success('SUCCESS.FILE_DELETE');
    } catch (error) {
      return this.res.error(HttpStatus.BAD_REQUEST, 'ERROR.BAD_REQ', error);
    }
  }
}
