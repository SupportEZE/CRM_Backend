import { forwardRef, HttpStatus, Inject, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { ResponseService } from 'src/services/response.service';
import { AttendanceService } from 'src/modules/sfa/attendance/web/attendance.service';
import { LocationService } from 'src/services/location.service';
import {
  CustomerModel,
  CustomerSource,
  PrimaryProfileStatus,
} from './default/models/customer.model';
import { CustomerOtherDetailModel } from './default/models/customer-other-detail.model';
import { UserToCustomerMappingModel } from './default/models/user-to-customer-mapping.model';
import { CryptoService } from 'src/services/crypto.service';
import { CustomerTypeService } from '../customer-type/web/customer-type.service';
import { COLLECTION_CONST } from 'src/config/collection.constant';
import {
  commonSearchFilter,
  convertToUtcRange,
  Like,
  toObjectId,
} from 'src/common/utils/common.utils';
import { CustomerToCustomerMappingModel } from './default/models/customer-to-customer-mapping.dto';
import { BeatPlanService } from 'src/modules/sfa/beat-plan/web/beat-plan.service';
import { CustomerService } from './default/web/customer.service';
import { S3Service } from 'src/shared/rpc/s3.service';
import { CustomerDocsModel } from './default/models/customer-docs.model';
import { CustomerContactPersonModel } from './default/models/customer-contact-person.model';
import { CustomerMarkaModel } from './default/models/customer-marka.model';
import { CustomerShippingAddressModel } from './default/models/customer-shipping-address.model';
import { SharedActivityService } from 'src/modules/sfa/activity/shared-activity.service';
import { LoginTypeModel } from '../rbac/models/login-type.model';
import { RbacService } from '../rbac/web/rbac.service';
import { GlobalService } from 'src/shared/global/global.service';
import { CustomerToStateAssigningModel } from './default/models/customer-state-assigning.model';
import { IsObject } from 'class-validator';
import {
  EnquiryAssignedType,
  EnquiryTypeTemp,
} from 'src/modules/sfa/enquiry/ozone/models/ozone-enquiry.model';

const enum activeTab {
  COMPLETED = 'completed',
  PLANNED = 'planned',
}
@Injectable()
export class SharedCustomerService {
  constructor(
    @InjectModel(CustomerModel.name)
    private customerModel: Model<CustomerModel>,
    @InjectModel(CustomerOtherDetailModel.name)
    private customerOtherDetailModel: Model<CustomerOtherDetailModel>,
    @InjectModel(UserToCustomerMappingModel.name)
    private userToCustomerMappingModel: Model<UserToCustomerMappingModel>,
    @InjectModel(CustomerToCustomerMappingModel.name)
    private customerToCustomerMappingModel: Model<CustomerToCustomerMappingModel>,
    @InjectModel(CustomerDocsModel.name)
    private customerDocsModel: Model<CustomerDocsModel>,
    @InjectModel(CustomerContactPersonModel.name)
    private customerContactPersonModel: Model<CustomerContactPersonModel>,
    @InjectModel(CustomerShippingAddressModel.name)
    private customerShippingAddressModel: Model<CustomerShippingAddressModel>,
    @InjectModel(CustomerMarkaModel.name)
    private customerMarkaModel: Model<CustomerMarkaModel>,
    @InjectModel(LoginTypeModel.name)
    private loginTypeModel: Model<LoginTypeModel>,
    @InjectModel(CustomerToStateAssigningModel.name)
    private customerToStateAssigningModel: Model<CustomerToStateAssigningModel>,
    private readonly res: ResponseService,
    private readonly cryptoService: CryptoService,
    private readonly customerTypeService: CustomerTypeService,
    private readonly attendanceService: AttendanceService,
    private readonly locationService: LocationService,
    private readonly sharedActivityService: SharedActivityService,
    private readonly beatPlanService: BeatPlanService,
    @Inject(forwardRef(() => CustomerService))
    private readonly customerService: CustomerService,
    private readonly s3Service: S3Service,
    private readonly rbacService: RbacService,
    private readonly globalService: GlobalService,
  ) {}

  customerLookup(req: Request, params: any) {
    let localField = 'customer_id';
    if (params?.localField) localField = params.localField;

    const isExcludeLead = !(
      req.url.includes('app-activity/beat-customers') ||
      req.url.includes('app-order')
    );

    const moduleId = global.MODULES['Customers'];
    const moduleName = Object.keys(global.MODULES).find(
      (key) => global.MODULES[key] === global.MODULES['Customers'],
    );
    const customerLookup = [
      {
        $lookup: {
          from: COLLECTION_CONST().CRM_CUSTOMERS,
          localField: localField,
          foreignField: '_id',
          as: 'customer_info',
          pipeline: [
            {
              $match: {
                ...(isExcludeLead && {
                  profile_status: { $ne: PrimaryProfileStatus.LEAD },
                }),
                is_delete: 0,
                org_id: req['user']['org_id'],
              },
            },
            {
              $addFields: {
                module_id: moduleId,
                module_name: moduleName,
              },
            },
            {
              $project: {
                _id: 1,
                customer_name: 1,
                company_name: 1,
                login_type_id: 1,
                customer_type_name: 1,
                customer_type_id: 1,
                customer_code: 1,
                country: 1,
                state: 1,
                district: 1,
                city: 1,
                pincode: 1,
                address: 1,
                status: 1,
                mobile: 1,
                email: 1,
                profile_status: 1,
                full_address: {
                  $concat: [
                    { $ifNull: ['$country', ''] },
                    ', ',
                    { $ifNull: ['$state', ''] },
                    ', ',
                    { $ifNull: ['$district', ''] },
                    ', ',
                    { $ifNull: ['$city', ''] },
                    ', ',
                    { $ifNull: [{ $toString: '$pincode' }, ''] },
                    ', ',
                    { $ifNull: ['$address', ''] },
                  ],
                },
                module_id: 1,
                module_name: 1,
              },
            },
          ],
        },
      },
      {
        $unwind: {
          path: '$customer_info',
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $match: {
          'customer_info._id': { $exists: true },
        },
      },
    ];

    return customerLookup;
  }
  contactPersonLookup(req: Request, params: any) {
    let localField: string = 'customer_id';
    if (params?.localField) localField = params.localField;
    const contactPersonLookup: any[] = [
      {
        $lookup: {
          from: COLLECTION_CONST().CRM_CUSTOMER_CONTACT_PERSON,
          let: { customerId: `$${localField}` },
          pipeline: [
            {
              $match: {
                $expr: { $eq: ['$customer_id', '$$customerId'] },
              },
            },
            {
              $project: {
                contact_person_name: 1,
                contact_person_mobile: 1,
                designation: 1,
              },
            },
            {
              $sort: {
                _id: -1,
              },
            },
          ],
          as: 'contact_person_info',
        },
      },
    ];

    return contactPersonLookup;
  }
  async getDocument(
    id: any,
    type:
      | typeof global.FULL_IMAGE
      | typeof global.THUMBNAIL_IMAGE
      | typeof global.BIG_THUMBNAIL_IMAGE = global.FULL_IMAGE,
    doc_type?: any,
  ): Promise<any> {
    return this.s3Service.getDocumentsByRowId(
      this.customerDocsModel,
      id,
      type,
      doc_type,
    );
  }
  async getDocumentByDocsId(req: any, params: any): Promise<any> {
    const doc = await this.s3Service.getDocumentsById(
      this.customerDocsModel,
      params._id,
    );
    return this.res.success('SUCCESS.FETCH', doc);
  }
  async deleteFile(req: Request, params: any): Promise<any> {
    try {
      params._id = toObjectId(params._id);
      const exist: Record<string, any> = await this.customerDocsModel
        .findOne({ _id: params._id, is_delete: 0 })
        .exec();
      if (!exist)
        return this.res.error(HttpStatus.NOT_FOUND, 'ERROR.NOT_FOUND');
      const updateObj = {
        ...req['updateObj'],
        is_delete: 1,
      };
      await this.customerDocsModel.updateOne({ _id: params._id }, updateObj);
      return this.res.success('SUCCESS.FILE_DELETE');
    } catch (error) {
      return this.res.error(HttpStatus.BAD_REQUEST, 'ERROR.BAD_REQ', error);
    }
  }
  async decryptContactPersonValues(req: Request, params: any) {
    let data = await Promise.all(
      params?.contact_person_info?.map(async (row: any) => {
        return {
          ...row,
          contact_person_mobile: await this.cryptoService.decrypt(
            row.contact_person_mobile,
          ),
        };
      }),
    );
    return data;
  }
  async assignCustomerByVisit(req: Request, params: any): Promise<any> {
    try {
      const match: Record<string, any> = {
        customer_id: params.customer_id,
        user_id: req['user']['_id'],
        customer_type_id: params.customer_type_id,
        customer_type_name: params.customer_type_name,
      };
      const exist: Record<string, any> =
        await this.userToCustomerMappingModel.findOne(match);
      if (!exist) {
        const saveObj: Record<string, any> = {
          ...req['createObj'],
          ...match,
          source: CustomerSource.VISIT,
          user_data: {
            label: req['user']['name'],
            user_code: req['user']?.['user_code'] || null,
            login_type_id: req['user']['login_type_id'],
          },
        };
        const document = new this.userToCustomerMappingModel(saveObj);
        await document.save();
      }
      return;
    } catch (error) {
      throw error;
    }
  }
  async getCustomersByIds(req: Request, params: any): Promise<any> {
    try {
      let customerIds = [];
      if (params.customer_id) {
        customerIds = [toObjectId(params.customer_id)];
      } else if (Array.isArray(params.customer_ids)) {
        customerIds = params.customer_ids;
      }

      const match: Record<string, any> = {
        _id: { $in: customerIds },
        is_delete: 0,
        org_id: req['user']['org_id'],
      };
      const data = await this.customerModel.find(match);
      return data;
    } catch (error) {
      throw error;
    }
  }

  async getCustomersByMobileNo(
    req: Request,
    participantMobiles: string[],
  ): Promise<any> {
    try {
      const match: Record<string, any> = {
        mobile: { $in: participantMobiles },
        is_delete: 0,
        org_id: req['user']['org_id'],
        profile_status: { $ne: PrimaryProfileStatus.LEAD },
      };
      const data = await this.customerModel.find(match);
      return data;
    } catch (error) {
      throw error;
    }
  }

  async assignCustomers(req: Request, params: any): Promise<any> {
    try {
      const orgId = req['user']['org_id'];
      const userId = req['user']['_id'];
      const customerTypeId = params.customer_type_id;

      const page: number = params?.page || global.PAGE;
      const limit: number = params?.limit || global.LIMIT;
      const skip: number = (page - 1) * limit;

      const baseMatch = {
        is_delete: 0,
        org_id: orgId,
        user_id: userId,
      };

      const customerLookup = this.customerLookup(req, params);
      const contactPersonLookup = this.contactPersonLookup(req, params);
      const isContactPerson = req?.url?.includes(global.MODULE_ROUTES[18])
        ? true
        : false;

      let customerMacth: Record<string, any> = {
        'customer_info.customer_type_id': toObjectId(customerTypeId),
      };
      if (params?.profile_status)
        customerMacth['customer_info.profile_status'] = params.profile_status;

      const basePipeline: any[] = [
        { $match: baseMatch },
        ...customerLookup,
        ...(isContactPerson ? contactPersonLookup : []),
        { $project: { customer_info: 1, contact_person_info: 1 } },
      ];
      let dataForCount = await this.userToCustomerMappingModel.aggregate([
        ...basePipeline,
      ]);

      basePipeline.push({ $match: customerMacth });
      let data = await this.userToCustomerMappingModel.aggregate([
        ...basePipeline,
      ]);

      const customer_ids =
        dataForCount?.map((row: any) => row?.customer_info?._id) || [];

      const total = data.length;

      if (req?.url?.includes(global.MODULE_ROUTES[1])) {
        params.data = data;
        params.skip = skip;
        params.limit = limit;
        data = await this.requiredCustomerData(req, params);
      }

      let countCondition: Record<string, any> = {
        is_delete: 0,
      };

      if (params?.login_type_id) {
        countCondition.login_type_id = params.login_type_id;
      }

      const profileStatus: any = await this.loginTypeModel
        .findOne(countCondition, {
          login_type_id: 1,
          login_type_name: 1,
          customer_type_name: 1,
          profile_status: 1,
        })
        .lean();

      countCondition.customer_type_id = toObjectId(params.customer_type_id);
      countCondition._id = { $in: customer_ids };
      let groupField =
        params.login_type_id == global.LOGIN_TYPE_ID['INFLUENCER']
          ? '$profile_status'
          : '$status';

      let statusCounts: Record<string, any>[] = [];

      statusCounts = await this.customerModel.aggregate([
        { $match: countCondition },
        {
          $group: {
            _id: groupField,
            count: { $sum: 1 },
          },
        },
      ]);

      const statusCountMap = new Map(
        statusCounts.map((item) => [item._id, item.count]),
      );

      const profileStatusTabs = Array.isArray(profileStatus?.profile_status)
        ? profileStatus.profile_status.map((item: any) => ({
            name: item,
            value: statusCountMap.get(item) || 0,
          }))
        : [];

      const moduleAssignedDetails =
        await this.globalService.getModuleAssignedDetails(
          params.tab,
          userId,
          orgId,
          page,
          limit,
        );

      const isModuleData = moduleAssignedDetails.total > 0;

      const wrappedResult: any[] = (
        isModuleData ? moduleAssignedDetails.result : data
      ).map((item: any) => {
        const customerInfo = isModuleData ? item : item?.customer_info || {};

        const updatedCustomerInfo: any = {
          ...customerInfo,
          login_type_id: profileStatus?.login_type_id || null,
        };

        if (params?.tab === 'Enquiry') {
          updatedCustomerInfo.module_id = 11;
          updatedCustomerInfo.module_name = 'Enquiry';
        } else if (params?.tab === 'Site') {
          updatedCustomerInfo.module_id = 24;
          updatedCustomerInfo.module_name = 'Site-Project';
        }

        return {
          customer_info: updatedCustomerInfo,
        };
      });

      const finalData: any = {
        tabs: profileStatusTabs,
        result: wrappedResult,
        // module_assigned_details: moduleAssignedDetails.result
      };

      return this.res.pagination(
        finalData,
        total || moduleAssignedDetails.total,
        page,
        limit,
      );
    } catch (error) {
      return this.res.error(HttpStatus.BAD_REQUEST, 'ERROR.BAD_REQ', error);
    }
  }
  async countCustomerTypesAssignedToUser(
    req: Request,
    params: any,
  ): Promise<any> {
    try {
      params.internalCall = true;

      const userId = req['user']['_id'];
      const orgId = req['user']['org_id'];

      const customerTypes = await this.customerTypeService.readDropdown(
        req,
        params,
      );
      const customerTypeIds = customerTypes.map((row: any) => row.value);

      const customerCounts = await this.userToCustomerMappingModel.aggregate([
        ...this.customerLookup(req, params),
        {
          $match: {
            user_id: userId,
            customer_type_id: { $in: customerTypeIds },
            org_id: orgId,
            is_delete: 0,
          },
        },
        {
          $group: {
            _id: '$customer_type_id',
            count: { $sum: 1 },
          },
        },
      ]);

      const customerCountMap = customerCounts.reduce(
        (acc, curr) => {
          acc[curr._id.toString()] = curr.count;
          return acc;
        },
        {} as Record<string, number>,
      );

      const filteredCustomerTypes = customerTypes
        .filter((item: any) =>
          customerCountMap.hasOwnProperty(item.value.toString()),
        )
        .map((item: any) => ({
          ...item,
          count: customerCountMap[item.value.toString()] || 0,
        }));

      const assignedModule: any = await this.rbacService.fetchEnquiryPermission(
        req,
        params,
      );

      if (assignedModule && assignedModule.length > 0) {
        for (const module of assignedModule) {
          const count = await this.globalService.getModuleAssignedCount(
            module.module_name,
            userId,
            orgId,
          );

          filteredCustomerTypes.push({
            label: module.module_name,
            value: module._id,
            module_id: module.module_id,
            module_name: module.module_name,
            login_type_id: null,
            login_type_name: null,
            count: count,
          });
        }
      }
      return this.res.success('SUCCESS.FETCH', filteredCustomerTypes);
    } catch (error) {
      return this.res.error(HttpStatus.BAD_REQUEST, 'ERROR.BAD_REQ', error);
    }
  }

  async getCustomerAssigning(req: Request, params: any): Promise<any> {
    try {
      let data: Record<string, any>[] = [];

      let match: Record<string, any> = {
        is_delete: 0,
        org_id: req['user']['org_id'],
        parent_customer_id: toObjectId(params.customer_id),
      };

      params.localField = 'child_customer_id';
      const customerLookup: any[] = this.customerLookup(req, params);

      const pipeline: any[] = [
        { $match: match },
        ...customerLookup,
        {
          $project: {
            _id: 0,
            label: '$customer_info.customer_name',
            value: '$customer_info._id',
            mobile: '$customer_info.mobile',
            login_type_id: '$customer_info.login_type_id',
          },
        },
      ];

      data = await this.customerToCustomerMappingModel.aggregate(pipeline);
      return data;
    } catch (error) {
      return this.res.error(HttpStatus.BAD_REQUEST, 'ERROR.BAD_REQ', error);
    }
  }
  async fetchRowCustomerData(req: Request, params: any): Promise<any> {
    try {
      const orgId = req['user']['org_id'];
      let match: Record<string, any> = {
        is_delete: 0,
        org_id: orgId,
        _id: params.customer_id,
      };
      return await this.getCustomerData(params.module_id, match);
    } catch (error) {
      throw new Error(`Error fetching customer data: ${error.message}`);
    }
  }
  async getCustomerData(moduleId: string, match: Record<string, any>) {
    let result: Record<string, any>;
    switch (moduleId) {
      case global.MODULES['Enquiry']:
        break;
      default:
        result = await this.customerModel.findOne(match).lean();
        if (result) {
          let customerOtherDetail: Record<string, any> =
            await this.customerOtherDetailModel.findOne({
              customer_id: result._id,
            });
          result.beat_code_id = customerOtherDetail.beat_code_id;
          result.beat_code = customerOtherDetail.beat_code;
          result.bear_code_desc = customerOtherDetail.bear_code_desc;
          result.lat = customerOtherDetail.lat;
          result.long = customerOtherDetail.long;
          result.lead_source = customerOtherDetail?.lead_source || null;
          result.lead_category = customerOtherDetail?.lead_category || null;
        }
        break;
    }
    return result;
  }
  buildCustomerDetails(customer: any): Record<string, any> {
    return {
      customer_id: customer?._id,
      customer_name: customer?.customer_name || customer?.name || undefined,
      mobile: customer?.mobile || undefined,
      state: customer?.state || undefined,
      district: customer?.district || undefined,
      ...(customer?.customer_type_id && {
        customer_type_name: customer.customer_type_name || undefined,
        customer_type_id: customer.customer_type_id,
        beat_code: customer.beat_code || undefined,
        beat_code_id: customer.beat_code_id || undefined,
        bear_code_desc: customer.bear_code_desc || undefined,
      }),
    };
  }
  async getCustomerById(req: Request, params: any): Promise<any> {
    const customer = await this.customerOtherDetailModel.findOne({
      customer_id: toObjectId(params.customer_id),
    });
    return customer;
  }
  async beatCustomers(req: Request, params: any): Promise<any> {
    try {
      const codes = await this.beatPlanService.assignBeatCodes(req, params);
      const beatCodes =
        codes?.[0]?.beat_codes?.map((row: any) => row.beat_code) || [];
      const { start, end } = convertToUtcRange(params.date || new Date());
      params.start = start;
      params.end = end;
      const orgId = req['user']['org_id'];
      const userId = req['user']['_id'];
      const page: number = params?.page || global.PAGE;
      const limit: number = params?.limit || global.LIMIT;
      const skip: number = (page - 1) * limit;
      params.user_ids = [req['user']['_id']];

      const assignCustomerIds: string[] = await this.getCustomersIdsByUserId(
        req,
        params,
      );

      const match: Record<string, any> = {
        is_delete: 0,
        org_id: orgId,
        beat_code: { $in: beatCodes },
        customer_id: { $in: assignCustomerIds },
      };

      if (req.url.includes(global.MODULE_ROUTES[18])) {
        return await this.customerOtherDetailModel.aggregate([
          { $match: match },
          {
            $group: {
              _id: null,
              total: { $sum: 1 },
              uniqueCustomerIds: { $addToSet: '$customer_id' },
            },
          },
          {
            $project: {
              _id: 0,
              total: 1,
              uniqueCustomerIds: 1,
            },
          },
        ]);
      }

      const filters = commonSearchFilter(params.filters, [
        'customer_info.customer_name',
        'contact_person_info.contact_person_name',
        'customer_info.customer_type_name',
      ]);

      const basePipeline = [
        { $match: match },
        ...this.customerLookup(req, params),
        ...this.contactPersonLookup(req, params),
        this.sharedActivityService.visitLookupForCustomer(req, params),
        {
          $addFields: {
            visit_log: { $arrayElemAt: ['$visit_logs', 0] },
            is_completed: { $gt: [{ $size: '$visit_logs' }, 0] },
          },
        },
        {
          $addFields: {
            activity_id: '$visit_log._id',
            activity_date: '$visit_log.activity_date',
            visit_end: '$visit_log.visit_end',
          },
        },
        { $match: filters },
      ];

      const [completedCountAgg, plannedCountAgg] = await Promise.all([
        this.customerOtherDetailModel.aggregate([
          ...basePipeline,
          {
            $match: {
              is_completed: true,
              visit_end: { $exists: true, $ne: null },
            },
          },
          { $count: 'count' },
        ]),
        this.customerOtherDetailModel.aggregate([
          ...basePipeline,
          {
            $match: {
              is_completed: false,
            },
          },
          { $count: 'count' },
        ]),
      ]);

      const completed_count = completedCountAgg?.[0]?.count || 0;
      const planned_count = plannedCountAgg?.[0]?.count || 0;
      const all = planned_count + completed_count;

      const counts = {
        all,
        completed_count,
        planned_count,
      };

      if (params.activeTab === activeTab.COMPLETED) {
        basePipeline.push({
          $match: {
            is_completed: true,
            visit_end: { $exists: true, $ne: null },
          },
        });
      } else if (params.activeTab === activeTab.PLANNED) {
        basePipeline.push({ $match: { is_completed: false } });
      }

      const totalData = await this.customerOtherDetailModel.aggregate([
        ...basePipeline,
        { $count: 'total' },
      ]);
      const total = totalData?.[0]?.total || 0;

      let data: Record<string, any>[] =
        await this.customerOtherDetailModel.aggregate([
          ...basePipeline,
          {
            $project: {
              customer_info: 1,
              lat: 1,
              long: 1,
              contact_person_info: 1,
              is_completed: 1,
              activity_id: 1,
              activity_date: 1,
              visit_end: 1,
            },
          },
          { $skip: skip },
          { $limit: limit },
        ]);

      params.customer_id = data.map((row: any) => row.customer_info._id);
      params.user_id = userId;
      const lastVisits: Record<string, any> =
        await this.sharedActivityService.customerLastVisit(req, params);

      data = data.map((row: any) => {
        const lastVisit: Record<string, any> = lastVisits.find(
          (v: any) =>
            v.customer_id.toString() === row?.customer_info?._id.toString(),
        );

        return {
          ...row,
          last_visit: lastVisit?.tat
            ? `${lastVisit?.tat} ${global.POST_FIX[1]}`
            : global.STATIC_VALUES[1],
        };
      });

      const output: any = {
        result: data,
        counts,
      };
      return this.res.pagination(output, total, page, limit);
    } catch (error) {
      return this.res.error(HttpStatus.BAD_REQUEST, 'ERROR.BAD_REQ', error);
    }
  }
  async profilePercentage(req: Request, params: any): Promise<any> {
    try {
      params._id = toObjectId(params?.customer_id) || req['user']['_id'];
      params.internalCall = true;
      let loginPerson: any = null;
      if (
        params.module_id === global.MODULES['Enquiry'] ||
        params.module_id === global.MODULES['Site-Project']
      ) {
        loginPerson = await this.globalService.getModuleCheckInDetails(
          params.module_id,
          params._id,
        );
      } else {
        loginPerson = await this.customerService.detail(req, params);
      }

      let completion = 0;

      if (loginPerson.basic_detail) {
        completion += 40;
      }

      if (
        loginPerson.doc_detail &&
        Array.isArray(loginPerson.doc_detail) &&
        loginPerson.doc_detail.length > 0
      ) {
        let totalRows = loginPerson.doc_detail.length;
        const docsFields: string[] = global.DOCS_PERCENATGE_INFO;
        let totalColumns = docsFields.length;

        let totalRowScore = 0;

        loginPerson.doc_detail.forEach((doc: any) => {
          let validColumns = docsFields.filter(
            (column) =>
              doc.hasOwnProperty(column) &&
              typeof doc[column] === 'string' &&
              doc[column].trim() !== '',
          ).length;

          if (validColumns > 0) {
            let rowScore = validColumns / totalColumns;
            totalRowScore += rowScore;
          }
        });

        completion += (totalRowScore / totalRows) * 30;
      }

      if (loginPerson.bank_detail) {
        const bankFields = global.BANK_PERCENATGE_INFO;
        let filledBankFields = bankFields.filter(
          (field: any) => loginPerson.bank_detail[field],
        ).length;
        completion += (filledBankFields / bankFields.length) * 30;
      }

      return Math.round(completion);
    } catch (error) {
      throw error;
    }
  }
  async getContactPerson(req: Request, params: any): Promise<any> {
    try {
      let customerIds: any[] = [];
      if (params?.customer_ids) {
        customerIds = params.customer_ids.map((id: any) => toObjectId(id));
      } else {
        customerIds = toObjectId(params?.customer_id) || req['user']['_id'];
        customerIds = [customerIds];
      }
      const match: Record<string, any> = {
        org_id: req['user']['org_id'],
        is_delete: 0,
        customer_id: { $in: customerIds },
      };

      const projection: Record<string, any> = {
        contact_person_name: 1,
        contact_person_mobile: 1,
        designation: 1,
        customer_id: 1,
      };
      return await this.customerContactPersonModel
        .find(match, projection)
        .lean();
    } catch (error) {
      throw error;
    }
  }
  async fetchCustomerInfo(req: Request, params: any): Promise<any> {
    try {
      const match = {
        _id: toObjectId(params.customer_id),
        org_id: req['user']['org_id'],
        is_delete: 0,
      };

      const pipeline = [
        { $match: match },
        ...this.customerLookup(req, { localField: '_id' }),
        {
          $project: {
            _id: 1,
            'customer_info._id': 1,
            'customer_info.customer_name': 1,
            'customer_info.mobile': 1,
            'customer_info.full_address': 1,
            'customer_info.customer_type_name': 1,
          },
        },
      ];

      const result = await this.customerModel.aggregate(pipeline);
      return result[0]?.customer_info || null;
    } catch (error) {
      throw error;
    }
  }
  async getShippingInfo(req: Request, params: any): Promise<any> {
    try {
      if (params?.customer_id) {
        params.customer_id = toObjectId(params.customer_id);
      } else {
        params.customer_id = toObjectId(req['user']['_id']);
      }
      const match: Record<string, any> = {
        org_id: req['user']['org_id'],
        is_delete: 0,
        customer_id: params.customer_id,
      };
      const projection: Record<string, any> = {
        shipping_state: 1,
        shipping_district: 1,
        shipping_city: 1,
        shipping_pincode: 1,
        shipping_address: 1,
        shipping_contact_name: 1,
        shipping_contact_number: 1,
      };

      const customerMatch: Record<string, any> = {
        org_id: req['user']['org_id'],
        is_delete: 0,
        _id: toObjectId(params.customer_id),
      };

      const customerAddressProjection: Record<string, any> = {
        country: 1,
        state: 1,
        district: 1,
        city: 1,
        pincode: 1,
        address: 1,
        mobile: 1,
        customer_name: 1,
      };
      const result = await this.customerShippingAddressModel
        .find(match, projection)
        .lean();
      let customerAddress = await this.customerModel
        .findOne(customerMatch, customerAddressProjection)
        .lean();
      const transformedCustomerAddress = {
        shipping_state: customerAddress.state || '',
        shipping_district: customerAddress.district || '',
        shipping_city: customerAddress.city || '',
        shipping_pincode: customerAddress.pincode || '',
        shipping_address: customerAddress.address || '',
        shipping_contact_number: customerAddress.mobile || '',
        shipping_contact_name: customerAddress.customer_name || '',
      };
      result.unshift(transformedCustomerAddress as any);
      if (req?.url.includes(global.MODULE_ROUTES[16])) {
        return this.res.success('SUCCESS.FETCH', result);
      }
      return result;
    } catch (error) {
      return this.res.error(HttpStatus.BAD_REQUEST, 'ERROR.BAD_REQ', error);
    }
  }
  async getOtherDetail(req: Request, params: any): Promise<any> {
    try {
      params.customer_id =
        toObjectId(params?.customer_id) || req['user']['_id'];
      const projection: Record<string, any> = {
        created_id: 0,
        created_name: 0,
        is_delete: 0,
        org_id: 0,
        created_at: 0,
        updated_at: 0,
      };

      let match: Record<string, any> = {
        org_id: req['user']['org_id'],
        customer_id: params.customer_id,
        is_delete: 0,
      };
      let data: Record<string, any> = await this.customerOtherDetailModel
        .findOne(match, projection)
        .sort({ _id: -1 })
        .lean();
      return data;
    } catch (error) {
      throw error;
    }
  }

  async getMarkaDetail(req: Request, params: any): Promise<any> {
    try {
      params.customer_id =
        toObjectId(params?.customer_id) || req['user']['_id'];
      let match: Record<string, any> = {
        org_id: req['user']['org_id'],
        customer_id: params.customer_id,
        is_delete: 0,
      };
      let data: Record<string, any> = await this.customerMarkaModel
        .find(match)
        .sort({ _id: -1 })
        .lean();
      return data;
    } catch (error) {
      throw error;
    }
  }
  async readDropdown(req: Request, params: any): Promise<any> {
    try {
      const match: Record<string, any> = {
        org_id: req['user']['org_id'],
        is_delete: 0,
        source: { $ne: CustomerSource.VISIT },
      };

      if (params.customer_type_id) {
        match.customer_type_id = Array.isArray(params.customer_type_id)
          ? { $in: params.customer_type_id.map(toObjectId) }
          : toObjectId(params.customer_type_id);
      }

      let assignedCustomerIds: any[] = [];

      if (params.user_id) {
        const mappings = await this.userToCustomerMappingModel
          .find({
            user_id: toObjectId(params.user_id),
            is_delete: 0,
            org_id: req['user']['org_id'],
            customer_type_id: toObjectId(params.customer_type_id),
          })
          .select('customer_id');
        assignedCustomerIds = mappings.map((m) => m.customer_id);
      }

      if (assignedCustomerIds.length > 0) {
        match._id = { $in: assignedCustomerIds };
      }

      if (params?.login_type_id) {
        match.login_type_id = params.login_type_id;
      }

      const projection: Record<string, any> = {
        _id: 1,
        customer_name: 1,
        mobile: 1,
        customer_type_id: 1,
        customer_type_name: 1,
        login_type_id: 1,
        form_data: 1,
      };

      params.localField = global.LOCAL_FIELDS[1];

      const pipeline: any[] = [
        { $match: match },
        { $project: projection },
        { $sort: { customer_name: 1 } },
        { $limit: global.DROPDOWN_LIMIT },
        ...this.contactPersonLookup(req, params),
        {
          $addFields: {
            primary_contact: { $arrayElemAt: ['$contact_person_info', 0] },
          },
        },
      ];

      if (params?.search) {
        const searchRegex = Like(params?.search);
        pipeline.push({
          $match: {
            $or: [
              { customer_name: searchRegex },
              { mobile: searchRegex },
              { 'primary_contact.contact_person_name': searchRegex },
            ],
          },
        });
      }

      let data: Record<string, any>[] =
        await this.customerModel.aggregate(pipeline);

      data = data.map((row: any) => {
        const primaryContact = row.primary_contact;
        let label = row.customer_name || '';
        if (row?.mobile) label += ' / ' + row.mobile;
        if (primaryContact?.contact_person_name)
          label += ' / ' + primaryContact.contact_person_name;

        return {
          label,
          value: row._id,
          customer_type_name: row.customer_type_name,
          customer_type_id: row.customer_type_id,
          module_id: global.MODULES['Customers'],
          module_name: Object.keys(global.MODULES).find(
            (key) => global.MODULES[key] === global.MODULES['Customers'],
          ),
          login_type_id: row.login_type_id,
          mobile: row.mobile,
          form_data: row.form_data,
          contact_person_name: primaryContact?.contact_person_name || null,
        };
      });

      return this.res.success('SUCCESS.FETCH', data);
    } catch (error) {
      return this.res.error(HttpStatus.BAD_REQUEST, 'ERROR.BAD_REQ');
    }
  }
  async getAssignCustomerMapping(req: Request, params: any): Promise<any> {
    try {
      let customerIds: any[] = [];
      if (params?.customer_ids) {
        customerIds = params.customer_ids.map((id: any) => toObjectId(id));
      } else {
        customerIds = toObjectId(params?.customer_id) || req['user']['_id'];
        customerIds = [customerIds];
      }

      const match: Record<string, any> = {
        org_id: req['user']['org_id'],
        child_customer_id: { $in: customerIds },
        is_delete: 0,
      };
      let projection: Record<string, any> = {
        parent_customer_id: 1,
        parent_customer_name: 1,
      };
      let data: Record<string, any> = await this.customerToCustomerMappingModel
        .find(match, projection)
        .sort({ _id: -1 })
        .lean();
      if (req?.url.includes(global.MODULE_ROUTES[15])) {
        return this.res.success('SUCCESS.FETCH', data);
      }
      return data;
    } catch (error) {
      throw error;
    }
  }
  async getUserToCustomerMapping(req: Request, params: any): Promise<any> {
    try {
      let customerIds: any[] = [];
      if (params?.customer_ids) {
        customerIds = params.customer_ids.map((id: any) => toObjectId(id));
      } else {
        customerIds = toObjectId(params?.customer_id) || req['user']['_id'];
        customerIds = [customerIds];
      }

      const match: Record<string, any> = {
        org_id: req['user']['org_id'],
        customer_id: { $in: customerIds },
        is_delete: 0,
      };

      const pipeline: any[] = [
        { $match: match },
        {
          $lookup: {
            from: COLLECTION_CONST().CRM_USERS, // replace with actual collection name if needed
            localField: 'user_id',
            foreignField: '_id',
            as: 'user_info',
          },
        },
        {
          $unwind: {
            path: '$user_info',
            preserveNullAndEmptyArrays: true, // in case user info is missing
          },
        },
        {
          $project: {
            user_id: 1,
            user_data: 1,
            form_data: '$user_info.form_data',
          },
        },
        { $sort: { _id: -1 } },
      ];

      let data: Record<string, any>[] = await this.userToCustomerMappingModel
        .aggregate(pipeline)
        .exec();

      if (data.length > 0) {
        data = data.map((row: any) => {
          return {
            ...row,
            user_name: row?.user_data?.label || null,
            user_code: row?.user_data?.user_code || null,
            business_segment: row?.form_data?.business_segment || null,
          };
        });
      }
      return data;
    } catch (error) {
      throw error;
    }
  }
  async getCustomerIdsByBeatCodes(req: Request, params: any): Promise<any> {
    try {
      if (!params?.beat_codes) throw new Error('beat codes required');
      let match: Record<string, any> = {
        org_id: req['user']['org_id'],
        beat_code: { $in: params.beat_codes },
        is_delete: 0,
      };

      let projection: Record<string, any> = {
        customer_id: 1,
        beat_code: 1,
      };

      let data: Record<string, any>[] = await this.customerOtherDetailModel
        .find(match, projection)
        .lean();
      return data;
    } catch (error) {
      throw error;
    }
  }
  async getCustomersIdsByUserId(req: Request, params: any): Promise<any> {
    try {
      const match: Record<string, any> = {
        org_id: req['user']['org_id'],
        user_id: req['user']['_id'],
        is_delete: 0,
      };
      if (params?.user_ids) match.user_id = { $in: params.user_ids };
      if (params?.customer_type_id)
        match.customer_type_id = toObjectId(params.customer_type_id);

      let projection: Record<string, any> = {
        customer_id: 1,
      };

      let data: Record<string, any>[] = await this.userToCustomerMappingModel
        .find(match, projection)
        .lean();
      data = data?.map((row: any) => row.customer_id) || [];
      return data;
    } catch (error) {
      throw error;
    }
  }
  async getUserAssignCustomerTypes(req: Request, params: any): Promise<any> {
    try {
      const match: Record<string, any> = {
        org_id: req['user']['org_id'],
        user_id: req['user']['_id'],
        is_delete: 0,
        customer_type_id: { $ne: null },
      };

      if (params?.user_ids) {
        match.user_id = { $in: params.user_ids };
      }
      let data = await this.userToCustomerMappingModel.aggregate([
        { $match: match },
        {
          $group: {
            _id: '$customer_type_id',
            label: { $first: '$customer_type_name' },
            count: { $sum: 1 },
          },
        },
        {
          $project: {
            _id: 0,
            value: '$_id',
            label: 1,
            count: 1,
          },
        },
      ]);

      const customerTypeIds = data?.map((row: any) => row.value) || [];
      if (customerTypeIds.length === 0)
        return this.res.success('SUCCESS.FETCH', data);
      params.customer_type_ids = customerTypeIds;
      const customerTypeData =
        await this.customerTypeService.getCustomerTypesByIds(req, params);

      const customerTypeMap = new Map(
        customerTypeData.map((customerType: any) => [
          customerType._id.toString(),
          customerType,
        ]),
      );

      data = data?.map((row: any) => {
        const matchedCustomerType: any = customerTypeMap.get(
          row?.value?.toString(),
        );
        if (matchedCustomerType) {
          return {
            ...row,
            login_type_id: matchedCustomerType?.login_type_id,
            login_type_name: matchedCustomerType?.login_type_name,
            label: matchedCustomerType?.customer_type_name,
          };
        }

        return row;
      });

      return this.res.success('SUCCESS.FETCH', data);
    } catch (error) {
      return this.res.error(HttpStatus.BAD_REQUEST, 'ERROR.BAD_REQ', error);
    }
  }
  async requiredCustomerData(req: Request, params: any): Promise<any> {
    try {
      let { data, skip, limit } = params;

      const userLocation = await this.attendanceService.userCurrentLocation(
        req,
        params,
      );
      if (!userLocation) return data;
      const customerIds = data.map((row: any) => row.customer_info._id);
      const customerDetails = await this.customerOtherDetailModel
        .find({
          customer_id: { $in: customerIds },
        })
        .lean();

      const customerDetailMap = customerDetails.reduce(
        (acc: Record<string, any>, curr: any) => {
          acc[curr.customer_id.toString()] = curr;
          return acc;
        },
        {},
      );

      params.customer_id = customerIds;
      const lastVisits: Record<string, any> =
        await this.sharedActivityService.customerLastVisit(req, params);

      const lastVisitMap = Array.isArray(lastVisits)
        ? lastVisits.reduce((acc: Record<string, any>, visit: any) => {
            acc[visit.customer_id.toString()] = visit;
            return acc;
          }, {})
        : {};

      data.forEach((row: any) => {
        const detail = customerDetailMap[row.customer_info._id.toString()];
        row.distance = 0;
        row.distance_unit = 'km';
        if (detail?.lat && detail?.long) {
          row.distance = this.locationService.getDistance(
            userLocation.latitude,
            userLocation.longitude,
            detail.lat,
            detail.long,
          );
        }

        const customerId = row.customer_info._id.toString();
        const lastVisit = lastVisitMap[customerId];
        row.last_visit_tat = '0 days';
        if (lastVisit) {
          row.last_visit_tat = lastVisit.tat;
        }
      });

      data = data
        .sort((a, b) => a.distance - b.distance)
        .slice(skip, skip + limit);
      return data;
    } catch (error) {
      throw error;
    }
  }

  async fetchShippingAddress(req: Request, params: any): Promise<any> {
    try {
      params.shipping_address_id = toObjectId(params.shipping_address_id);
      const match: Record<string, any> = {
        org_id: req['user']['org_id'],
        is_delete: 0,
        _id: toObjectId(params.shipping_address_id),
      };
      const projection: Record<string, any> = {
        shipping_state: 1,
        shipping_district: 1,
        shipping_city: 1,
        shipping_pincode: 1,
        shipping_address: 1,
        shipping_contact_name: 1,
        shipping_contact_number: 1,
      };
      const result = await this.customerShippingAddressModel
        .findOne(match, projection)
        .lean();
      return result;
    } catch (error) {
      return this.res.error(HttpStatus.BAD_REQUEST, 'ERROR.BAD_REQ', error);
    }
  }

  async assignedStateToCustomer(req: Request, params: any): Promise<any> {
    try {
      const customerId = toObjectId(params.customer_id);

      const match: Record<string, any> = {
        is_delete: 0,
        customer_id: customerId,
      };

      const existing: Record<string, any> =
        await this.customerToStateAssigningModel.findOne(match).lean();

      if (existing) {
        const updateFields: Record<string, any> = {};
        if (Array.isArray(params.state)) {
          updateFields.state = params.state;
        }
        if (Array.isArray(params.district)) {
          updateFields.district = params.district;
        }

        const update: Record<string, any> = {
          $set: {
            ...updateFields,
            ...req['createObj'],
          },
        };

        const result = await this.customerToStateAssigningModel.updateOne(
          match,
          update,
        );
        if (result.modifiedCount > 0) {
          return this.res.success('SUCCESS.STATE_UPDATED');
        } else {
          return this.res.error(
            HttpStatus.NOT_MODIFIED,
            'ERROR.NO_CHANGES_MADE',
          );
        }
      } else {
        const doc = new this.customerToStateAssigningModel({
          ...req['createObj'],
          ...params,
          customer_id: customerId,
          is_delete: 0,
        });
        await doc.save();
        return this.res.success('SUCCESS.STATE_ASSIGNED');
      }
    } catch (error) {
      return this.res.error(HttpStatus.BAD_REQUEST, 'ERROR.BAD_REQ', error);
    }
  }

  async fetchCustomerStateMapping(req: Request, params: any): Promise<any> {
    try {
      const match: Record<string, any> = {
        is_delete: 0,
        org_id: req['user']['org_id'],
      };

      if (params?.customer_id) {
        match.customer_id = toObjectId(params.customer_id);
      } else {
        match.district = { $in: [new RegExp(`^${params.district}$`, 'i')] };
      }

      const customerLookupMatch: Record<string, any> = {
        is_delete: 0,
        org_id: req['user']['org_id'],
      };

      // Add login_type_id only if request is for a Distributor
      if (
        params?.assigned_to_type === EnquiryAssignedType.Distributor ||
        params?.assigned_to_type === EnquiryTypeTemp.Distributor
      ) {
        customerLookupMatch.login_type_id = 5;
      }

      const result = await this.customerToStateAssigningModel
        .aggregate([
          {
            $match: match,
          },
          {
            $lookup: {
              from: COLLECTION_CONST().CRM_CUSTOMERS,
              localField: 'customer_id',
              foreignField: '_id',
              as: 'customer_info',
              pipeline: [
                {
                  $match: customerLookupMatch,
                },
                {
                  $project: {
                    _id: 1,
                    customer_name: 1,
                  },
                },
              ],
            },
          },
          {
            $unwind: {
              path: '$customer_info',
              preserveNullAndEmptyArrays: true,
            },
          },
          {
            $match: {
              'customer_info._id': { $exists: true },
            },
          },
          {
            $project: {
              customer_id: 1,
              // add more fields from customerToStateAssigning if needed
              customer_name: '$customer_info.customer_name',
              state: 1,
              district: 1,
            },
          },
        ])
        .exec();
      return result;
    } catch (error) {
      return this.res.error(HttpStatus.BAD_REQUEST, 'ERROR.BAD_REQ', error);
    }
  }

  async ReadCustomersByMobile(req: any, params: any): Promise<any> {
    try {
      const match: Record<string, any> = {
        mobile: params.mobile,
        is_delete: 0,
        org_id: req['user']['org_id'],
      };

      const projection: Record<string, any> = {
        _id: 1,
        login_type_id: 1,
        login_type_name: 1,
      };
      const data = await this.customerModel.findOne(match, projection);
      if (params?.internalCall) {
        return data;
      }
      return this.res.success('SUCCESS.FETCH', data);
    } catch (error) {
      throw error;
    }
  }

  async readCustomerProfileStatus(req: any, params: any): Promise<any> {
    try {
      const match: Record<string, any> = {
        login_type_id: params.login_type_id,
        is_delete: 0,
      };

      const projection: Record<string, any> = {
        _id: 1,
        profile_status: 1,
      };

      const data: any = await this.loginTypeModel
        .findOne(match, projection)
        .lean();

      if (data?.profile_status && Array.isArray(data.profile_status)) {
        data.profile_status = data.profile_status.map((status: string) => ({
          label: status,
          value: status,
        }));
      }
      if (params?.internalCall) {
        return data;
      }
      return this.res.success('SUCCESS.FETCH', data);
    } catch (error) {
      throw error;
    }
  }
}
