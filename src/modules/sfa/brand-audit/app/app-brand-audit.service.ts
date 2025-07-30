import { Injectable, HttpStatus } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { ResponseService } from 'src/services/response.service';
import { BrandAuditModel } from '../models/brand-audit.model';
import { BrandRequestModel } from '../models/brand-request.model';
import { CustomerModel } from 'src/modules/master/customer/default/models/customer.model';
import { BrandRequestDocsModel } from '../models/brand-request-docs.model';
import { S3Service } from 'src/shared/rpc/s3.service';
import { VisitActivityModel } from '../../activity/models/visit-activity.model';
import {
  appCommonFilters,
  nextSeq,
  toObjectId,
} from 'src/common/utils/common.utils';
import { BrandAuditService } from '../web/brand-audit.service';
import { SharedCustomerService } from 'src/modules/master/customer/shared-customer.service';
interface BrandRequestLean {
  _id: any;
  created_id: any;
  customer_id: any;
  customer_name: string;
  req_id: string;
}
@Injectable()
export class AppBrandAuditService {
  constructor(
    @InjectModel(BrandAuditModel.name)
    private brandAuditModel: Model<BrandAuditModel>,
    @InjectModel(BrandRequestModel.name)
    private brandRequestModel: Model<BrandRequestModel>,
    @InjectModel(BrandRequestDocsModel.name)
    private brandRequestDocsModel: Model<BrandRequestDocsModel>,
    @InjectModel(CustomerModel.name)
    private customerModel: Model<CustomerModel>,
    @InjectModel(VisitActivityModel.name)
    private visitActivityModel: Model<VisitActivityModel>,
    private readonly res: ResponseService,
    private readonly brandAuditService: BrandAuditService,
    private readonly s3Service: S3Service,
    private readonly sharedCustomerService: SharedCustomerService,
  ) {}

  async createBrandRequest(req: Request, params: any): Promise<any> {
    try {
      const { customer_id, customer_type_id, product_id } = params;
      params.user_id = toObjectId(req['user']['_id']);
      if (!params.user_id) {
        return this.res.error(
          HttpStatus.BAD_REQUEST,
          'ERROR.NOT_FOUND',
          'Employee ID is missing from request',
        );
      }

      let match: Record<string, any> = {
        is_delete: 0,
        org_id: req['user']['org_id'],
        created_id: toObjectId(req['user']['_id']),
        customer_type_id: toObjectId(customer_type_id),
        customer_id: toObjectId(customer_id),
        remark: params.remark,
        product_id: toObjectId(product_id),
      };

      const exist: Record<string, any>[] = await this.brandRequestModel
        .find(match)
        .exec();
      if (exist.length > 0)
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
      let match: Record<string, any> = {
        is_delete: 0,
        org_id: req['user']['org_id'],
        created_id: toObjectId(req['user']['_id']),
      };
      let sorting: Record<string, 1 | -1> = { _id: -1 };
      if (params?.filters?.search) {
        const fieldsToSearch = ['customer_name', 'req_id'];
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

      const total = await this.brandRequestModel.countDocuments(match);

      let result = await this.brandRequestModel
        .find(match)
        .skip(skip)
        .limit(limit)
        .sort(sorting)
        .lean<BrandRequestLean[]>();

      const allStatuses = ['Pending', 'Approved', 'Reject', 'All'];
      const tabWiseCounts = await this.brandRequestModel.aggregate([
        {
          $match: {
            is_delete: 0,
            org_id: req['user']['org_id'],
            created_id: req['user']['_id'],
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

      const resultWithExtras = await Promise.all(
        result.map(async (item) => {
          let customer_mobile = '';
          let files: any[] = [];
          let contact_person_name: '';

          if (item.customer_id) {
            const customerInfo =
              await this.sharedCustomerService.fetchCustomerInfo(req, {
                customer_id: item.customer_id,
              });
            customer_mobile = customerInfo?.mobile || '';
            files = await this.sharedCustomerService.getDocument(
              item.customer_id,
              global.BIG_THUMBNAIL_IMAGE,
            );
            contact_person_name =
              await this.sharedCustomerService.getContactPerson(req, {
                customer_id: item.customer_id,
              });
          }
          return {
            ...item,
            customer_mobile,
            contact_person_name,
            files,
          };
        }),
      );
      const data: any = {
        result: resultWithExtras,
        status_counts,
      };
      return this.res.pagination(data, total, page, limit);
    } catch (error) {
      return this.res.error(HttpStatus.BAD_REQUEST, 'ERROR.BAD_REQ', error);
    }
  }

  async detailBrandRequest(req: Request, params: any): Promise<any> {
    try {
      params._id = toObjectId(params._id);
      const match: Record<string, any> = {
        org_id: req['user']['org_id'],
        _id: params._id,
        is_delete: 0,
      };
      const result: Record<string, any> = await this.brandRequestModel
        .findOne(match)
        .lean();

      result.customer_info = await this.sharedCustomerService.fetchCustomerInfo(
        req,
        { customer_id: result.customer_id },
      );
      result.contact_person_name =
        await this.sharedCustomerService.getContactPerson(req, {
          customer_id: result.customer_id,
        });
      result.profile = await this.sharedCustomerService.getDocument(
        result.customer_id,
        global.BIG_THUMBNAIL_IMAGE,
      );
      result.files = await this.brandAuditService.getDocument(
        result._id,
        global.THUMBNAIL_IMAGE,
      );

      return this.res.success('SUCCESS.FETCH', result);
    } catch (error) {
      return this.res.error(HttpStatus.BAD_REQUEST, 'ERROR.BAD_REQ', error);
    }
  }

  async createBrandAudit(req: Request, params: any): Promise<any> {
    try {
      const { customer_id, customer_type_id } = params;
      params.user_id = req['user']['_id'];
      if (!params.user_id) {
        return this.res.error(
          HttpStatus.BAD_REQUEST,
          'ERROR.NOT_FOUND',
          'Employee ID is missing from request',
        );
      }
      let match: Record<string, any> = {
        is_delete: 0,
        org_id: req['user']['org_id'],
        created_id: toObjectId(req['user']['_id']),
        customer_type_id: toObjectId(customer_type_id),
        customer_id: toObjectId(customer_id),
        remark: params.remark,
      };
      const exist: Record<string, any>[] = await this.brandAuditModel
        .find(match)
        .exec();
      if (exist.length > 0)
        return this.res.error(HttpStatus.BAD_REQUEST, 'WARNING.ALREADY_EXIST');

      if (params?.visit_activity_id)
        params.visit_activity_id = toObjectId(params.visit_activity_id);

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
      if (params.checkin_id) {
        const updateObj: Record<string, any> = {
          ...req['updateObj'],
          brand_audit_id: insert._id,
        };
        await this.visitActivityModel.updateOne(
          { _id: params.checkin_id },
          updateObj,
        );
      }
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
        created_id: toObjectId(req['user']['_id']),
      };
      let sorting: Record<string, 1 | -1> = { _id: -1 };

      if (params?.filters?.search) {
        const fieldsToSearch = ['customer_name', 'customer_mobile'];
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

      const total = await this.brandAuditModel.countDocuments(match);

      let result = await this.brandAuditModel
        .find(match)
        .skip(skip)
        .limit(limit)
        .sort(sorting)
        .lean<BrandRequestLean[]>();

      const allStatuses = ['Pending', 'Approved', 'Reject', 'All'];

      const tabWiseCounts = await this.brandAuditModel.aggregate([
        {
          $match: {
            is_delete: 0,
            org_id: req['user']['org_id'],
            created_id: req['user']['_id'],
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

      const resultWithExtras = await Promise.all(
        result.map(async (item) => {
          let customer_mobile = '';
          let files: any[] = [];

          if (item.customer_id) {
            const customerInfo =
              await this.sharedCustomerService.fetchCustomerInfo(req, {
                customer_id: item.customer_id,
              });
            customer_mobile = customerInfo?.mobile || '';
            files = await this.sharedCustomerService.getDocument(
              item.customer_id,
              global.BIG_THUMBNAIL_IMAGE,
            );
          }
          return {
            ...item,
            customer_mobile,
            files,
          };
        }),
      );
      const data: any = {
        result: resultWithExtras,
        status_counts,
      };
      return this.res.pagination(data, total, page, limit);
    } catch (error) {
      return this.res.error(HttpStatus.BAD_REQUEST, 'ERROR.BAD_REQ', error);
    }
  }

  async detailBrandAudit(req: Request, params: any): Promise<any> {
    try {
      params._id = toObjectId(params._id);

      const match: Record<string, any> = {
        org_id: req['user']['org_id'],
        _id: params._id,
        is_delete: 0,
      };
      const result: Record<string, any> = await this.brandAuditModel
        .findOne(match)
        .lean();

      result.customer_info = await this.sharedCustomerService.fetchCustomerInfo(
        req,
        { customer_id: result.customer_id },
      );
      result.contact_person_name =
        await this.sharedCustomerService.getContactPerson(req, {
          customer_id: result.customer_id,
        });
      result.profile = await this.sharedCustomerService.getDocument(
        result.customer_id,
        global.BIG_THUMBNAIL_IMAGE,
      );
      result.files = await this.brandAuditService.getDocument(
        result._id,
        global.THUMBNAIL_IMAGE,
      );

      return this.res.success('SUCCESS.FETCH', result);
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
}
