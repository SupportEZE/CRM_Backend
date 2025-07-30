import { HttpStatus, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { ResponseService } from 'src/services/response.service';
import { ComplaintModel } from '../models/complaint.model';
import { ComplaintDocsModel } from '../models/complaint-docs.model';
import { Model,Types } from 'mongoose';
import {
  toObjectId,
  commonFilters,
  nextSeq,
  tat,
  
} from 'src/common/utils/common.utils';
import { S3Service } from 'src/shared/rpc/s3.service';
import { SharedCustomerService } from 'src/modules/master/customer/shared-customer.service';
import { CustomerService } from 'src/modules/master/customer/default/web/customer.service';
import { CustomerTypeService } from 'src/modules/master/customer-type/web/customer-type.service';
import { COLLECTION_CONST } from 'src/config/collection.constant';
import { ComplaintStatus } from './dto/complaint.dto';
import { ComplaintInvoiceModel } from '../../complaint-invoice/models/complaint-invoice.model';
import { ComplaintInvoiceItemModel } from '../../complaint-invoice/models/complaint-invoice-item.model';
import { CustomerModel } from '../../../master/customer/default/models/customer.model';

import { ComplaintInspectionModel } from '../models/complaint-inspection.model';
import { ComplaintVisitModel } from '../models/complaint-visit.model';
import { ComplaintSparePartModel } from '../models/complaint-spare-part.model';
import { log } from 'util';
@Injectable()
export class ComplaintService {
  constructor(
    @InjectModel(ComplaintModel.name)
    private complaintModel: Model<ComplaintModel>,
    @InjectModel(ComplaintDocsModel.name)
    private complaintDocsModel: Model<ComplaintDocsModel>,
    @InjectModel(ComplaintInvoiceModel.name)
    private complaintInvoiceModel: Model<ComplaintInvoiceModel>,
    @InjectModel(ComplaintInvoiceItemModel.name)
    private complaintInvoiceItemModel: Model<ComplaintInvoiceItemModel>,
    @InjectModel(ComplaintInspectionModel.name)
    private complaintInspectionModel: Model<ComplaintInspectionModel>,
    @InjectModel(ComplaintVisitModel.name)
    private complaintVisitModel: Model<ComplaintVisitModel>,
    @InjectModel(ComplaintSparePartModel.name)
    private complaintSparePartModel: Model<ComplaintSparePartModel>,
    @InjectModel(CustomerModel.name)
    private CustomerModel: Model<CustomerModel>,

    private readonly res: ResponseService,
    private readonly s3Service: S3Service,
    private readonly sharedCustomerService: SharedCustomerService,
    private readonly customerService: CustomerService,
    private readonly customerTypeService: CustomerTypeService,
  ) {}
  async complaintCreate(req: any, params: any): Promise<any> {
    try {
      const orgId: number = req['user']['org_id'];
      const { customer_mobile, service_engineer_id, visit_date } = params;

      const match: Record<string, any> = {
        is_delete: 0,
        org_id: orgId,
        customer_mobile,
        visit_date,
      };

      const seq = {
        modelName: this.complaintModel,
        idKey: 'complaint_no',
        prefix: 'COMP',
      };
      const complaint_no = await nextSeq(req, seq);
      const customerList =
        await this.sharedCustomerService.getCustomersByMobileNo(
          req,
          customer_mobile,
        );

      let customer_id: any;
      if (!customerList[0] || customerList.length === 0) {
        const checkType = {
          is_delete: 0,
          org_id: orgId,
          login_type_id: global.LOGIN_TYPE_ID['END_CONSUMER'],
        };
        const customerTypes =
          await this.customerTypeService.getCustomerTypesByLoginTypeId(
            req,
            checkType,
          );

        if (!customerTypes) {
          return this.res.error(HttpStatus.BAD_REQUEST, 'WARNING.NOT_EXIST');
        }

        const customer_type_id = customerTypes._id;
        const newCustomer = await this.saveNewCustomer(
          req,
          params,
          customer_type_id,
        );

        customer_id = newCustomer.data.inserted_id;
      } else {
        customer_id = customerList[0]._id;
      }
      const saveObj: Record<string, any> = {
        ...req['createObj'],
        ...params,
        complaint_no,
        service_engineer_id: toObjectId(service_engineer_id),
        customer_id: customer_id,
      };
      const document = new this.complaintModel(saveObj);
      const insert = await document.save();
      if (!insert || !insert._id) {
        return this.res.error(HttpStatus.BAD_REQUEST, 'ERROR.BAD_REQ');
      }
      return this.res.success('SUCCESS.CREATE', { inserted_id: insert._id });
    } catch (error) {
      return this.res.error(HttpStatus.BAD_REQUEST, 'ERROR.BAD_REQ', error);
    }
  }

  async saveNewCustomer(
    req: Request,
    params: any,
    customer_type_id: any,
  ): Promise<any> {
    try {
      const saveObj: Record<string, any> = {
        org_id: req['user']['org_id'],
        customer_type_id: customer_type_id,
        customer_type_name: 'End Consumer',
        customer_name: params.customer_name,
        mobile: params.customer_mobile,
        alt_mobile_no: params.alternate_mobile_no,
        country: 'India',
        state: params.state,
        district: params.district,
        city: params.city,
        pincode: params.pincode,
        address: params.address,
        source: 'complaint',
        status: 'Pending',
      };
      const newCustomer = await this.customerService.create(req, saveObj);
      return newCustomer;
    } catch (error) {
      throw error;
    }
  }

  async complaintRead(req: any, params: any): Promise<any> {
    try {
      let match: Record<string, any> = {
        is_delete: 0,
        org_id: req['user']['org_id'],
      };

      let sorting: Record<string, 1 | -1> = { _id: -1 };
      if (params?.sorting && Object.keys(params.sorting).length !== 0)
        sorting = params.sorting;

      const filters: Record<string, any> = commonFilters(params?.filters);
      Object.assign(match, filters);

      if (params?.activeTab && params.activeTab !== 'All') {
        match['status'] = params.activeTab;
      }

      if (params?.filters?.priority) {
        match['priority'] = params.filters.priority;
      }

      const page: number = parseInt(params?.page) || global.PAGE;
      const limit: number = parseInt(params?.limit) || global.LIMIT;
      const skip: number = (page - 1) * limit;

      const pipeline = [
        { $match: match },
        { $sort: sorting },
        { $project: { created_unix_time: 0 } },
      ];

      const totalCountData: Record<string, any>[] =
        await this.complaintModel.aggregate([
          ...pipeline,
          { $count: 'totalCount' },
        ]);

      const total: number =
        totalCountData.length > 0 ? totalCountData[0].totalCount : 0;

      const userViceCounts = await this.getUserCounts(match);

      let result: Record<string, any>[] = await this.complaintModel.aggregate([
        ...pipeline,
        { $skip: skip },
        { $limit: limit },
      ]);

      const allStatuses = [
        ComplaintStatus.Pending,
        ComplaintStatus.Close,
        ComplaintStatus.Cancel,
        ComplaintStatus.All,
      ];
      const tabWiseCounts = await this.complaintModel.aggregate([
        {
          $match: match,
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

      const tabWiseCategoryAndPriority = await this.complaintModel.aggregate([
        {
          $match: match,
        },
        {
          $facet: {
            priority_counts: [
              { $group: { _id: '$priority', count: { $sum: 1 } } },
            ],
          },
        },
      ]);

      const formatCounts = (array: any[]) =>
        array.reduce((acc, item) => {
          acc[item._id] = item.count;
          return acc;
        }, {});

      const priority_counts = formatCounts(
        tabWiseCategoryAndPriority[0].priority_counts,
      );

      result = await Promise.all(
        result.map(async (item: any) => {
          const start = item.visit_date;
          const end = item.closing_date ?? new Date();

          item.tat = tat(start, end, 'd');
          item.files = await this.getDocument(item._id, global.THUMBNAIL_IMAGE);
          return item;
        }),
      );

      const data: any = {
        result,
        status_counts,
        userViceCounts,
        priority_counts,
      };

      return this.res.pagination(data, total, page, limit);
    } catch (error) {
      return this.res.error(HttpStatus.BAD_REQUEST, 'ERROR.BAD_REQ', error);
    }
  }

  async getUserCounts(match: any) {
    const data = await this.complaintModel.aggregate([
      { $match: match },
      {
        $group: {
          _id: {
            service_engineer_id: '$service_engineer_id',
            service_engineer_name: '$service_engineer_name',
          },
          count: { $sum: 1 },
        },
      },
    ]);

    return data.map((item) => ({
      service_engineer_id: item._id.service_engineer_id,
      service_engineer_name: item._id.service_engineer_name,
      assigned_count: item.count,
    }));
  }

  async complaintDetail(req: Request, params: any): Promise<any> {
    try {
      const orgId = req['user']['org_id'];
      const match = {
        org_id: orgId,
        _id: params._id,
      };
      const result: Record<string, any> = await this.complaintModel
        .findOne(match)
        .lean();
      if (!result)
        return this.res.error(HttpStatus.NOT_FOUND, 'ERROR.NOT_FOUND');

      const [
        complainInvoiceDetail,
        complaintInspection,
        complaintVisit,
        complaintSpare,
      ] = await Promise.all([
        this.getComplaintInvoiceDetail(req, params),
        this.getInspectionDetail(req, params),
        this.getVisitDetail(req, params),
        this.getComplaintSpareDetail(req, params),
      ]);

      result.invoice_details = complainInvoiceDetail;
      result.inspection_details = complaintInspection;
      result.visit_details = complaintVisit;
      result.spares = complaintSpare;
      const files = await this.getDocument(result._id, global.THUMBNAIL_IMAGE);
      result.complaint_images = files.filter(
        (f) => f.label === 'Complaint Images',
      );
      result.inspection_images = files.filter(
        (f) => f.label === 'Inspection Images',
      );
      result.closing_images = files.filter(
        (f) => f.label === 'Close Compalint Images',
      );

      return this.res.success('SUCCESS.FETCH', result);
    } catch (error) {
      return this.res.error(HttpStatus.BAD_REQUEST, 'ERROR.BAD_REQ', error);
    }
  }

  async getComplaintInvoiceDetail(req: Request, params: any): Promise<any> {
    try {
      const match: Record<string, any> = {
        org_id: req['user']['org_id'],
        complaint_id: toObjectId(params._id),
        is_delete: 0,
      };
      const data: Record<string, any> = await this.complaintInvoiceModel
        .findOne(match)
        .lean();

      if (data) {
        const invoiceItems = await this.complaintInvoiceItemModel
          .find({
            invoice_id: data._id,
            is_delete: 0,
          })
          .lean();

        data.items = invoiceItems || [];
      }
      return data;
    } catch (error) {
      return this.res.error(HttpStatus.BAD_REQUEST, 'ERROR.BAD_REQ', error);
    }
  }

  async getInspectionDetail(req: Request, params: any): Promise<any> {
    try {
      const match: Record<string, any> = {
        org_id: req['user']['org_id'],
        complaint_id: toObjectId(params._id),
        is_delete: 0,
      };
      const data: Record<string, any> = await this.complaintInspectionModel
        .findOne(match)
        .lean();
      return data;
    } catch (error) {
      return this.res.error(HttpStatus.BAD_REQUEST, 'ERROR.BAD_REQ', error);
    }
  }

  async getVisitDetail(req: Request, params: any): Promise<any> {
    try {
      const match: Record<string, any> = {
        org_id: req['user']['org_id'],
        complaint_id: toObjectId(params._id),
        is_delete: 0,
      };
      const data: Record<string, any> = await this.complaintVisitModel
        .find(match)
        .lean();
      return data;
    } catch (error) {
      return this.res.error(HttpStatus.BAD_REQUEST, 'ERROR.BAD_REQ', error);
    }
  }

  async getComplaintSpareDetail(req: Request, params: any): Promise<any> {
    try {
      const match: Record<string, any> = {
        org_id: req['user']['org_id'],
        complaint_id: toObjectId(params._id),
        is_delete: 0,
      };

      const data = await this.complaintSparePartModel.aggregate([
        { $match: match },
        {
          $lookup: {
            from: 'crm_spare_part',
            localField: 'product_id',
            foreignField: '_id',
            as: 'product_details',
          },
        },
        {
          $unwind: {
            path: '$product_details',
            preserveNullAndEmptyArrays: true,
          },
        },
        {
          $addFields: {
            product_code: '$product_details.product_code',
            mrp: '$product_details.mrp',
          },
        },
        {
          $project: {
            product_details: 0,
          },
        },
      ]);
      return data;
    } catch (error) {
      return this.res.error(HttpStatus.BAD_REQUEST, 'ERROR.BAD_REQ', error);
    }
  }

  async assignEngineer(req: Request, params: any): Promise<any> {
    try {
      const exist: Record<string, any> = await this.complaintModel
        .findOne({
          _id: toObjectId(params._id),
          is_delete: 0,
          org_id: req['user']['org_id'],
        })
        .exec();
      if (!exist) return this.res.success('WARNING.NOT_EXIST');
      const updateObj: Record<string, any> = {
        ...req['updateObj'],
        ...params,
        service_engineer_id: toObjectId(params.service_engineer_id),
      };
      if (params.service_engineer_mobile) {
        updateObj.service_engineer_mobile = params.service_engineer_mobile;
      }
      await this.complaintModel.updateOne(
        { _id: params._id },
        { $set: updateObj },
      );
      return this.res.success('SUCCESS.UPDATE');
    } catch (error) {
      return this.res.error(
        HttpStatus.BAD_REQUEST,
        'ERROR.BAD_REQ',
        error.message,
      );
    }
  }

  async updateComplaint(req: any, params: any): Promise<any> {
    try {
      const { _id, service_engineer_id, ...restFields } = params;

      const match: Record<string, any> = {
        _id: _id,
        org_id: req['user']['org_id'],
        is_delete: 0,
      };

      const result = await this.complaintModel.findOne(match).exec();
      if (!result)
        return this.res.error(HttpStatus.NOT_FOUND, 'WARNING.NOT_EXIST');

      const updateObj: Record<string, any> = {
        ...req['updateObj'],
        ...restFields,
        service_engineer_id: toObjectId(service_engineer_id),
      };

      await this.complaintModel.updateOne({ _id: _id }, { $set: updateObj });

      return this.res.success('SUCCESS.UPDATE');
    } catch (error) {
      return this.res.error(HttpStatus.BAD_REQUEST, 'ERROR.BAD_REQ', error);
    }
  }

  async statusUpdate(req: Request, params: any): Promise<any> {
    try {
      const { status, reason } = params;
      const exist = await this.complaintModel
        .findOne({ _id: params._id, is_delete: 0 })
        .lean()
        .exec();
      if (!exist)
        return this.res.error(HttpStatus.BAD_REQUEST, 'ERROR.NOT_FOUND');

      const updateObj: Record<string, any> = {
        status,
        status_updated_date: new Date(),
      };
      if (reason !== undefined) {
        updateObj.reason = reason;
      }

      await this.complaintModel
        .findOneAndUpdate(
          { _id: params._id, is_delete: 0 },
          { $set: updateObj },
          { new: true },
        )
        .exec();
      return this.res.success('SUCCESS.STATUS_UPDATE');
    } catch (error) {
      return this.res.error(HttpStatus.BAD_REQUEST, 'ERROR.BAD_REQ', error);
    }
  }

  async saveLocation(req: Request, params: any): Promise<any> {
    try {
      const exist: Record<string, any> = await this.complaintModel
        .findOne({ _id: toObjectId(params._id) })
        .exec();
      if (!exist)
        return this.res.error(HttpStatus.NOT_FOUND, 'ERROR.NOT_FOUND');

      const updateObj: Record<string, any> = {
        ...req['updateObj'],
        ...params,
      };
      const updatedDocument = await this.complaintModel.updateOne(
        { _id: toObjectId(params._id) },
        updateObj,
      );
      if (!updatedDocument)
        return this.res.error(HttpStatus.BAD_REQUEST, 'ERROR.UPDATE_FAILED');
      return this.res.success('SUCCESS.UPDATE');
    } catch (error) {
      return this.res.error(HttpStatus.BAD_REQUEST, 'ERROR.BAD_REQ', error);
    }
  }

  async upload(files: Express.Multer.File[], req: any): Promise<any> {
    try {
      req.body.module_name = Object.keys(global.MODULES).find(
        (key) => global.MODULES[key] === global.MODULES['Complaint'],
      );
      let response = await this.s3Service.uploadMultiple(
        files,
        req,
        this.complaintDocsModel,
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
      this.complaintDocsModel,
      id,
      type,
    );
  }

  async getDocumentByDocsId(req: any, params: any): Promise<any> {
    const doc = await this.s3Service.getDocumentsById(
      this.complaintDocsModel,
      params._id,
    );
    return this.res.success('SUCCESS.FETCH', doc);
  }
  async checkExistMobile(req: any, mobileNumber: string): Promise<any> {
    try {
      const orgId = req.user.org_id;
      const match = {
        is_delete: 0,
        org_id: orgId,
        mobile: mobileNumber,
      };
      const customer = await this.CustomerModel.findOne(match)
        .lean()
        .select(
          'alternate_mobile_no customer_name state district city pincode address',
        )
        .exec();

      if (!customer) {
        return this.res.success('SUCCESS.NO_CUSTOMER_FOUND', null);
      }
      return this.res.success('SUCCESS.DATA_FOUND', customer);
    } catch (error) {
      return this.res.error(
        HttpStatus.INTERNAL_SERVER_ERROR,
        'ERROR.SERVER_ERROR',
        error,
      );
    }
  }

  async rescheduleVisitDate(req: Request, params: any): Promise<any> {
    try {
      params._id = toObjectId(params._id);
      const exist = await this.complaintModel
        .findOne({ _id: params._id, is_delete: 0 })
        .lean();

      if (!exist) return this.res.success('WARNING.NOT_EXIST');

      const updateObj = {
        ...req['updateObj'],
        visit_date: params.visit_date,
        reschedule_reason: params.reschedule_reason,
      };

      await this.complaintModel.updateOne({ _id: params._id }, updateObj);

      return this.res.success('SUCCESS.STATUS_UPDATE');
    } catch (error) {
      return this.res.error(HttpStatus.BAD_REQUEST, 'ERROR.BAD_REQ', error);
    }
  }

  async inspectionCreate(req: any, params: any): Promise<any> {
    try {
      const { service_engineer_id, complaint_id } = params;
      const complaint = await this.complaintModel
        .findOne({ is_delete: 0, _id: toObjectId(complaint_id) })
        .exec();

      if (!complaint) {
        return this.res.error(
          HttpStatus.BAD_REQUEST,
          'COMPLAINT.COMPLAINT_NOT_FOUND',
        );
      }
      const inspectionExist = await this.complaintInspectionModel
        .findOne({ is_delete: 0, complaint_id: toObjectId(complaint_id) })
        .exec();

      if (inspectionExist) {
        return this.res.error(
          HttpStatus.BAD_REQUEST,
          'COMPLAINT.INSPECTION_EXISTS',
        );
      }
      const saveObj = {
        ...req['createObj'],
        ...params,
        complaint_id: toObjectId(complaint_id),
        service_engineer_id: toObjectId(service_engineer_id),
      };

      const document = new this.complaintInspectionModel(saveObj);
      const insert = await document.save();
      await this.complaintModel
        .updateOne(
          { _id: toObjectId(complaint_id) },
          {
            $set: {
              inspection_status: 'Done',
              inspection_date: new Date(),
              product_id: toObjectId(params.product_id),
              product_name: params.product_name,
              product_code: params.product_code,
            },
          },
        )
        .exec();

      return this.res.success('COMPLAINT.INSPECTION_CREATE', {
        inserted_id: insert._id,
      });
    } catch (error) {
      return this.res.error(HttpStatus.BAD_REQUEST, 'ERROR.BAD_REQ', error);
    }
  }

  async getCustomerComplaintSummary(req: any, params: any): Promise<any> {
    const orgId = req.user.org_id;
    return await this.complaintModel.aggregate([
      {
        $match: {
          is_delete: 0,
          org_id: orgId,
        },
      },
      {
        $sort: { created_at: -1 },
      },
      {
        $group: {
          _id: '$customer_id',
          customer_name: { $first: '$customer_name' },
          customer_mobile: { $first: '$customer_mobile' },
          address: { $first: '$address' },
          complaint_count: { $sum: 1 },

          latest_complaint_status: { $first: '$status' },
          complaints: {
            $push: {
              complaint_no: '$complaint_no',
              status: '$status',
              created_at: '$created_at',
              nature_of_problem: '$nature_of_problem',
              product_name: '$product_name',
              product_code: '$product_code',
            },
          },
        },
      },
      {
        $sort: { complaint_count: -1 },
      },
    ]);
  }

  async getCustomerDetailsFromComplaint(req: any, params: any): Promise<any> {
    const orgId = req.user.org_id;

    const result = await this.complaintModel.aggregate([
      {
        $match: {
          is_delete: 0,
          org_id: orgId,
          customer_id: toObjectId(params._id),
        },
      },
      {
        $sort: { created_at: -1 }, // latest complaint first
      },
      {
        $limit: 1,
      },
      {
        $project: {
          _id: 0,
          customer_name: 1,
          customer_mobile: 1,
          alternate_mobile_no: 1,
          state: 1,
          district: 1,
          city: 1,
          pincode: 1,
          address: 1,
        },
      },
    ]);
    if (!result.length) {
      return this.res.error(HttpStatus.NOT_FOUND, 'Customer not found');
    }
    return this.res.success('Customer details fetched', result[0]);
  }
}
