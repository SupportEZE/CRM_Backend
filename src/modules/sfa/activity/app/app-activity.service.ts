import { Injectable, HttpStatus, Inject, forwardRef } from '@nestjs/common';
import { Model } from 'mongoose';
import { InjectModel } from '@nestjs/mongoose';
import { ResponseService } from 'src/services/response.service';
import {
  toObjectId,
  tat,
  convertToUtcRange,
  mapValuesToObjectId,
  calculatePercentage,
  toIST,
} from 'src/common/utils/common.utils';
import {
  siteEnquiryModule,
  todayProgressKeys,
  VisitActivityModel,
} from '../models/visit-activity.model';
import {
  CustomerSource,
  PrimaryProfileStatus,
} from '../../../master/customer/default/models/customer.model';
import { LocationService } from 'src/services/location.service';
import { BeatPlanService } from '../../beat-plan/web/beat-plan.service';
import { CustomerService } from 'src/modules/master/customer/default/web/customer.service';
import { ActivityDocsModel } from '../models/activity-docs.model';
import { S3Service } from 'src/shared/rpc/s3.service';
import { SharedCustomerService } from 'src/modules/master/customer/shared-customer.service';
import { DropdownService } from 'src/modules/master/dropdown/web/dropdown.service';
import { SharedActivityService } from '../shared-activity.service';
import { SharedUserService } from 'src/modules/master/user/shared-user.service';
import { AppAttendanceService } from '../../attendance/app/app-attendance.service';
import { TimelineEventType } from '../../attendance/web/attendance.service';
import { activityRoutes } from './app-activity.controller';
import { WorkingActivityType } from 'src/modules/master/user/models/user-working-activity.model';
import { GlobalService } from 'src/shared/global/global.service';

@Injectable()
export class AppActivityService {
  constructor(
    @InjectModel(ActivityDocsModel.name)
    private activityDocsModel: Model<ActivityDocsModel>,
    @InjectModel(VisitActivityModel.name)
    private visitActivityModel: Model<VisitActivityModel>,
    private readonly res: ResponseService,
    private readonly s3Service: S3Service,
    private readonly locationService: LocationService,
    private readonly beatPlanService: BeatPlanService,
    private readonly customerService: CustomerService,
    @Inject(forwardRef(() => SharedCustomerService))
    private readonly sharedCustomerService: SharedCustomerService,
    private readonly dropdownService: DropdownService,
    private readonly sharedActivityService: SharedActivityService,
    private readonly sharedUserService: SharedUserService,
    private readonly appAttendanceService: AppAttendanceService,
    private readonly globalService: GlobalService,
  ) {}

  async visitStart(req: Request, params: any): Promise<any> {
    try {
      const attendance: Record<string, any> | null =
        await this.appAttendanceService.attendanceExist(req, params);
      if (!attendance)
        return this.res.error(HttpStatus.CONFLICT, 'VISIT.ATTENDANCE_ALERT');

      if (
        params.planned_date &&
        params?.planned_date != toIST(new Date(), false)
      )
        return this.res.error(HttpStatus.CONFLICT, 'VISIT.PLANNED_VISIT_ERROR');

      params.is_planned_visit = await this.isPlannedVist(req, params);
      params.internalCall = true;
      let lastVisit = await this.lastVisit(req, params);
      if (lastVisit)
        return this.res.error(HttpStatus.CONFLICT, 'VISIT.LAST_VISIT_NOT_END');
      params.user_id = req['user']['_id'];
      params.activity_date = new Date();
      params.visit_start = new Date();
      if (params?.customer_id) {
        params.customer_id = toObjectId(params.customer_id);
        const customer: Record<string, any> =
          await this.sharedCustomerService.fetchRowCustomerData(req, params);
        params.customer_details =
          this.sharedCustomerService.buildCustomerDetails(customer);
      } else {
        params.outlet_type_id = toObjectId(params.outlet_type_id);
        params.customer_details = {
          customer_name: params.outlet_name,
          customer_type_id: params.outlet_type_id,
          customer_type_name: params.outlet_type,
          mobile: params.mobile,
          lead_source: params.lead_source,
          lead_category: params.lead_category,
        };
      }
      params.accuracy_distance = await this.checkDistance(req, params);
      if (params.accuracy_distance >= req['user']['org']['visit_radius']) {
        let meter = req['user']['org']['visit_radius'];
        return this.res.error(HttpStatus.CONFLICT, ['RADIUS_ERROR', { meter }]);
      }
      const saveObj: Record<string, any> = {
        ...req['createObj'],
        ...params,
      };

      const document: Record<string, any> = new this.visitActivityModel(
        saveObj,
      );
      const insert = await document.save();
      if (!insert._id)
        return this.res.error(HttpStatus.BAD_REQUEST, 'VISIT.START_ERROR');

      setImmediate(async () => {
        const start_location = await this.locationService.open_street(
          params.start_lat,
          params.start_lng,
        );
        await this.visitActivityModel.updateOne(
          { _id: insert._id },
          { start_location },
        );
        const data = {
          working_activity_type: WorkingActivityType.CHECK_IN,
          working_activity_id: insert._id,
          display_name: params?.customer_details?.customer_name || 'N/A',
        };
        await this.sharedUserService.saveUserWorkingActivity(req, data);

        if (params?.module_id === global.MODULES['Customers']) {
          this.globalService.updateCustomerActivityData(req, {
            customer_id: params.customer_id,
            checkin_id: insert._id,
            checkin_date: insert.created_at,
          });
        }
      });

      if (params?.is_new_counter_visit) {
        const customer = await this.saveOtherCustomer(req, params);
        params.customer_id = customer.inserted_id;

        await this.visitActivityModel.updateOne(
          { _id: insert._id },
          {
            customer_id: customer.inserted_id,
          },
        );

        const saveContactPersonInfoReq: Record<string, any> = {
          customer_id: customer.inserted_id,
          contact_person_name: params.contact_person_name,
          contact_person_mobile: params.mobile,
        };
        this.customerService.saveContactPersonInfo(
          req,
          saveContactPersonInfoReq,
        );
      }

      const visitEntry = {
        ...req['createObj'],
        user_id: params.user_id,
        activity_date: new Date(),
        timestamp: new Date().getTime(),
        event: TimelineEventType.CHECK_IN,
        latitude: params.start_lat,
        longitude: params.start_lng,
        customer_details: params.customer_details,
      };
      this.appAttendanceService.createBackgroundLocally(req, visitEntry);
      return this.res.success('VISIT.START', { inserted_id: insert._id });
    } catch (error) {
      return this.res.error(HttpStatus.BAD_REQUEST, 'ERROR.BAD_REQ', error);
    }
  }
  async visitEnd(req: Request, params: any): Promise<any> {
    try {
      const existingVisit: Record<string, any> =
        await this.visitActivityModel.findOne({ _id: params._id });
      if (!existingVisit)
        return this.res.error(HttpStatus.NOT_FOUND, 'ERROR.NOT_FOUND');
      if (existingVisit?.end_lat)
        return this.res.error(HttpStatus.CONFLICT, 'VISIT.ALREDAY_END');

      params.visit_end = new Date();
      params.avarage_meeting_time = tat(existingVisit.visit_start, new Date());
      params.visit_distance = await this.checkDistance(req, params);

      if (
        params?.check_out_activities &&
        Object.keys(params.check_out_activities).length !== 0
      ) {
        const check_out_activities = mapValuesToObjectId(
          params.check_out_activities,
        );
        delete params.check_out_activities;
        params = { ...params, ...check_out_activities };
      }

      if (
        params.dropdown_options_id &&
        Array.isArray(params.dropdown_options_id)
      ) {
        params.dropdown_options_id = params.dropdown_options_id.map((id) =>
          toObjectId(id),
        );
      }

      const updateObj = { ...req['updateObj'], ...params };
      const update = await this.visitActivityModel.updateOne(
        { _id: params._id },
        { $set: updateObj },
      );
      if (!update)
        return this.res.error(HttpStatus.CONFLICT, 'VISIT.END_ERROR');

      setImmediate(async () => {
        const end_location = await this.locationService.open_street(
          params.end_lat,
          params.end_lng,
        );
        await this.visitActivityModel.updateOne(
          { _id: params._id },
          { $set: { end_location } },
        );
      });

      if (params?.is_new_counter_visit) this.saveOtherCustomer(req, params);

      const visitEntry = {
        ...req['createObj'],
        user_id: req['user']['_id'],
        activity_date: new Date(),
        timestamp: new Date().getTime(),
        event: TimelineEventType.CHECK_OUT,
        latitude: params.end_lat,
        longitude: params.end_lng,
        _id: params._id,
        working_activity_type: WorkingActivityType.CHECK_OUT,
      };
      this.appAttendanceService.createBackgroundLocally(req, visitEntry);

      return this.res.success('VISIT.END');
    } catch (error) {
      return this.res.error(HttpStatus.BAD_REQUEST, 'ERROR.BAD_REQ', error);
    }
  }
  async detail(req: Request, params: Record<string, any>): Promise<any> {
    try {
      const match: Record<string, any> = {
        _id: params._id,
        is_delete: 0,
        org_id: req['user']['org_id'],
      };
      const projection: Record<string, any> = {
        // module_name: 0,
        // org_id: 0,
        is_delete: 0,
      };

      params.projection = projection;

      const result: Record<string, any> = await this.visitActivityModel
        .findOne(match, projection)
        .lean();
      if (!result)
        return this.res.error(HttpStatus.NOT_FOUND, 'ERROR.NOT_FOUND');
      params.customer_id = result?.customer_id;

      if (result.module_id === global.MODULES['Customers']) {
        const data: Record<string, any> = await this.customerPersonal(
          req,
          params,
        );
        result.customer_details.profile_percentage = data.profilePercentage;
        result.customer_details.contact_person = data.contactPerson;
        result.customer_details.other_detail = data.otherDetail;
      }

      if (result.module_id === global.MODULES['Enquiry']) {
        const data: Record<string, any> = await this.customerPersonal(
          req,
          params,
        );
        result.customer_details = result.customer_details || {};
        result.customer_details.profile_percentage = data.profilePercentage;
        result.customer_details.contact_person = data.contactPerson;
        result.customer_details.other_detail = data.otherDetail;
        result.enquiry_details = data.moduleDetails.result;
      }

      if (result.module_id === global.MODULES['Site-Project']) {
        const data: Record<string, any> = await this.customerPersonal(
          req,
          params,
        );
        result.customer_details = result.customer_details || {};
        result.customer_details.profile_percentage = data.profilePercentage;
        result.customer_details.contact_person = data.contactPerson;
        result.customer_details.other_detail = data.otherDetail;
        result.site_project_details = data.moduleDetails.result;
      }

      params.visit_activity_id = result._id;
      const [
        lastVisitSummary,
        files,
        companyCheckList,
        followup,
        ticket,
        stock,
        enquiry,
        payment,
        brandAudit,
        popgitTnx,
        order,
        lastOrder,
        outStandingPayment,
      ] = await Promise.all([
        this.lastVisitSummary(req, params),
        this.sharedActivityService.getDocument(
          result._id,
          global.THUMBNAIL_IMAGE,
        ),
        this.dropdownService.readDropdown(req, {
          is_delete: 0,
          module_id: global.MODULES['Checkin'],
          org_id: req['user']['org_id'],
          dropdown_name: global.DROPDOWN_NAME[2],
          internalCall: true,
        }),
        this.globalService.visitActivityFollowup(req, params),
        this.globalService.visitActivityTicket(req, params),
        this.globalService.visitActivityStockAudit(req, params),
        this.globalService.visitActivityEnquiry(req, params),
        this.globalService.visitActivityPayment(req, params),
        this.globalService.visitActivityBrandAudit(req, params),
        this.globalService.visitActivityPopGiftTxn(req, params),
        this.globalService.visitActivityOrder(req, params),
        this.globalService.customerLastOrder(req, params),
        this.globalService.readCreditData(req, params),
      ]);

      result.last_visit_summary = lastVisitSummary;
      result.files = files;
      result.company_check_list = companyCheckList;
      result.lastOrder = lastOrder[0];
      result.outStandingPayment = outStandingPayment;
      // Set doc_flag
      const docFlag = files?.length > 0 ? true : false;

      if (
        result.module_id === global.MODULES['Site-Project'] ||
        result.module_id === global.MODULES['Enquiry']
      ) {
        result.check_out_activities = {
          followup_id: followup?._id || undefined,
          doc_flag: docFlag,
        };
      } else {
        result.check_out_activities = {
          order_id: order?._id || undefined,
          followup_id: followup?._id || undefined,
          support_ticket_id: ticket?._id || undefined,
          stock_audit_id: stock?._id || undefined,
          enquiry_id: enquiry?._id || undefined,
          payment_collection_id: payment?._id || undefined,
          brand_audit_id: brandAudit?._id || undefined,
          pop_gift_txn_id: popgitTnx?._id || undefined,
          doc_flag: docFlag,
        };
      }

      result.checkout_progress = await this.calculateCheckoutProgress(
        req,
        params,
        result.check_out_activities,
        params.module_id,
      );
      return this.res.success('SUCCESS.FETCH', result);
    } catch (error) {
      return this.res.error(HttpStatus.BAD_REQUEST, 'ERROR.BAD_REQ', error);
    }
  }
  async customerPersonal(req: Request, params: any): Promise<any> {
    try {
      const [profilePercentage, contactPerson, otherDetail, moduleDetails] =
        await Promise.all([
          this.sharedCustomerService.profilePercentage(req, params),
          this.sharedCustomerService.getContactPerson(req, params),
          this.sharedCustomerService.getOtherDetail(req, params),
          this.globalService.getModuleCheckInDetails(
            params.module_id,
            params._id,
          ),
        ]);

      return { profilePercentage, contactPerson, otherDetail, moduleDetails };
    } catch (error) {
      throw error;
    }
  }
  async lastVisitSummary(req: Request, params: any): Promise<any> {
    try {
      const data: Record<string, any> = await this.visitActivityModel
        .findOne(
          {
            user_id: req['user']['_id'],
            customer_id: params.customer_id,
            visit_end: { $exists: true },
          },
          params.projection,
        )
        .sort({ _id: -1 });

      if (data)
        data.files = await this.sharedActivityService.getDocument(
          data._id,
          global.THUMBNAIL_IMAGE,
        );
      return data;
    } catch (error) {
      throw error;
    }
  }
  async isPlannedVist(req: Request, params: any): Promise<boolean> {
    try {
      const data = await this.beatPlanService.assignBeatCodes(req, params);
      const customer = await this.sharedCustomerService.getCustomerById(
        req,
        params,
      );
      const beatCodes =
        data?.[0]?.beat_codes?.map((row: any) => row.beat_code) || [];
      const isPlannedVisit = !!(
        customer?.beat_code && beatCodes.includes(customer.beat_code)
      );
      return isPlannedVisit;
    } catch (error) {
      throw error;
    }
  }
  async visitBeatPerformance(req: Request, params: any): Promise<any> {
    try {
      const { start, end } = convertToUtcRange(params.date || new Date());

      const beatData: Record<string, any>[] =
        await this.beatPlanService.assignBeatCodes(req, params);
      const beatCodes: Record<string, any>[] = beatData?.[0]?.beat_codes || [];
      const beatCodeList: string[] = beatCodes.map((b: any) => b.beat_code);

      if (beatCodeList.length === 0) return [];

      params.beat_codes = beatCodeList;

      const customerData: Record<string, any>[] =
        await this.sharedCustomerService.getCustomerIdsByBeatCodes(req, params);
      const customerIds: any[] = customerData.map((c: any) => c.customer_id);

      const plannedVisits: Record<string, any>[] =
        await this.visitActivityModel.find({
          is_delete: 0,
          user_id: req['user']['_id'],
          customer_id: { $in: customerIds },
          activity_date: { $gte: start, $lte: end },
        });

      const unplannedVisits: number =
        await this.visitActivityModel.countDocuments({
          is_delete: 0,
          user_id: req['user']['_id'],
          customer_id: { $nin: customerIds },
          activity_date: { $gte: start, $lte: end },
        });

      const visitMap = new Map<string, number>();
      for (const visit of plannedVisits) {
        const beatCode = visit?.customer_details?.beat_code;
        if (beatCode) {
          visitMap.set(beatCode, (visitMap.get(beatCode) || 0) + 1);
        }
      }

      const customerMap = new Map<string, number>();
      for (const customer of customerData) {
        const beatCode = customer?.beat_code;
        if (beatCode) {
          customerMap.set(beatCode, (customerMap.get(beatCode) || 0) + 1);
        }
      }

      const beat_codes_data: Record<string, any>[] = beatCodes.map((b: any) => {
        const total = customerMap.get(b.beat_code) || 0;
        const visits = visitMap.get(b.beat_code) || 0;
        return {
          ...b,
          total,
          visits,
          pending: total - visits,
          unplanned: unplannedVisits,
          performance: calculatePercentage(visits, total),
        };
      });

      const customer_type_data: Record<string, any>[] =
        await this.customerTypesVisits(req, params);
      const checkin_stats: Record<string, any>[] = await this.checkInStats(
        req,
        params,
      );

      const data: Record<string, any> = {
        beat_codes_data,
        customer_type_data,
        checkin_stats,
      };

      return this.res.success('SUCCESS.FETCH', data);
    } catch (error) {
      return this.res.error(HttpStatus.BAD_REQUEST, 'BAD.REQ', error);
    }
  }
  async customerTypesVisits(req: Request, params: any): Promise<any> {
    try {
      const { start, end } = convertToUtcRange(params.date || new Date());

      let customerTypesData =
        await this.sharedUserService.getAssignCustomerTypes(req, params);
      const customerTypeIds = customerTypesData.map(
        (row: any) => row.customer_type_id,
      );

      if (customerTypeIds.length === 0) return [];

      const visits = await this.visitActivityModel.find({
        is_delete: 0,
        user_id: req['user']['_id'],
        'customer_details.customer_type_id': { $in: customerTypeIds },
        activity_date: { $gte: start, $lte: end },
      });

      const countMap = new Map<string, number>();
      for (const visit of visits) {
        const typeId = visit?.customer_details?.customer_type_id?.toString();
        if (typeId) {
          countMap.set(typeId, (countMap.get(typeId) || 0) + 1);
        }
      }

      let total = 0;
      customerTypesData = customerTypesData.map((row: any) => {
        const count = countMap.get(row.customer_type_id?.toString()) || 0;
        total += count;
        return { ...row, count };
      });

      const data: Record<string, any> = {
        total,
        customer_types: customerTypesData,
      };

      if (req?.url.includes(activityRoutes.INSIGHTS)) return data;
      return this.res.success('SUCCESS.FETCH', data);
    } catch (error) {
      if (req?.url.includes(activityRoutes.INSIGHTS)) throw error;
      return this.res.error(HttpStatus.BAD_REQUEST, 'BAD.REQ', error);
    }
  }
  async checkInStats(req: Request, params: any): Promise<any> {
    try {
      const { start, end } = convertToUtcRange(params.date || new Date());
      let data: Record<string, any> = {};
      let match: Record<string, any> = {
        is_delete: 0,
        user_id: req['user']['_id'],
        activity_date: { $gte: start, $lte: end },
      };
      const visits = await this.visitActivityModel.aggregate([
        { $match: match },
        {
          $facet: {
            first_visit: [
              { $sort: { activity_date: 1 } },
              { $limit: 1 },
              { $project: { visit_start: 1, _id: 0 } },
            ],

            last_visit: [
              { $sort: { activity_date: -1 } },
              { $limit: 1 },
              { $project: { visit_end: 1, _id: 0 } },
            ],

            total_visit: [{ $count: 'count' }],

            total_productive_visit: [
              { $match: { order_id: { $exists: true } } },
              { $count: 'count' },
            ],

            new_counter_visit: [
              { $match: { is_new_counter_visit: { $exists: true } } },
              { $count: 'count' },
            ],

            new_counter_productive_visit: [
              {
                $match: {
                  is_new_counter_visit: { $exists: true },
                  order_id: { $exists: true },
                },
              },
              { $count: 'count' },
            ],
          },
        },
        {
          $project: {
            first_visit: { $arrayElemAt: ['$first_visit', 0] },
            last_visit: { $arrayElemAt: ['$last_visit', 0] },
            total_visit: {
              $ifNull: [{ $arrayElemAt: ['$total_visit.count', 0] }, 0],
            },
            total_productive_visit: {
              $ifNull: [
                { $arrayElemAt: ['$total_productive_visit.count', 0] },
                0,
              ],
            },
            new_counter_visit: {
              $ifNull: [{ $arrayElemAt: ['$new_counter_visit.count', 0] }, 0],
            },
            new_counter_productive_visit: {
              $ifNull: [
                { $arrayElemAt: ['$new_counter_productive_visit.count', 0] },
                0,
              ],
            },
          },
        },
      ]);

      data.first_visit = visits[0]?.first_visit?.visit_start || null;
      data.last_visit = visits[0]?.last_visit?.visit_end || null;
      if (data?.first_visit && data?.last_visit) {
        data.tat = tat(data.first_visit, data.last_visit);
      }
      data.total_visit = visits[0]?.total_visit || 0;
      data.total_productive_visit = visits[0].total_productive_visit || 0;
      data.total_productive_visit_percentage =
        data.total_visit && data.total_productive_visit_percentage
          ? +(
              (data.total_visit / data.total_productive_visit_percentage) *
              100
            ).toFixed(2)
          : 0;
      data.new_counter_visit = visits[0].new_counter_visit || 0;
      data.new_counter_productive_visit =
        visits[0]?.new_counter_productive_visit || 0;
      data.new_counter_productive_visit_percentage =
        data.new_counter_visit && data.new_counter_productive_visit
          ? +(
              (data.new_counter_visit / data.new_counter_productive_visit) *
              100
            ).toFixed(2)
          : 0;

      data.timeline = await this.appAttendanceService.getCheckinRoute(
        req,
        params,
      );
      if (req?.url.includes(activityRoutes.INSIGHTS)) return data;
      return this.res.success('SUCCESS.FETCH', data);
    } catch (error) {
      if (req?.url.includes(activityRoutes.INSIGHTS)) throw error;
      return this.res.error(HttpStatus.BAD_REQUEST, 'BAD.REQ', error);
    }
  }
  async upload(files: Express.Multer.File[], req: any): Promise<any> {
    try {
      req.body.module_name = Object.keys(global.MODULES).find(
        (key) => global.MODULES[key] === global.MODULES['Checkin'],
      );
      let response = await this.s3Service.uploadMultiple(
        files,
        req,
        this.activityDocsModel,
      );
      return this.res.success('SUCCESS.DOC_UPLOAD', response);
    } catch (error) {
      return this.res.error(HttpStatus.BAD_REQUEST, 'BAD.REQ', error);
    }
  }
  async saveOtherCustomer(req: Request, params: any): Promise<any> {
    try {
      const saveObj: Record<string, any> = {
        customer_name: params.outlet_name,
        customer_type_id: params.outlet_type_id,
        customer_type_name: params.outlet_type,
        source: CustomerSource.VISIT,
        lat: params.start_lat,
        long: params.start_lng,
        profile_status: PrimaryProfileStatus.INACTIVE,
        mobile: params.mobile,
        lead_source: params.lead_source,
        lead_category: params.lead_category,
      };
      return await this.customerService.create(req, saveObj);
    } catch (error) {
      throw error;
    }
  }
  async lastVisit(req: Request, params: any): Promise<any> {
    try {
      const data: Record<string, any> = await this.visitActivityModel.findOne(
        {
          user_id: req['user']['_id'],
          visit_end: { $exists: false },
        },
        {
          _id: 1,
          module_id: 1,
        },
      );
      if (params?.internalCall) return data;
      return this.res.success('SUCCESS.FETCH', data);
    } catch (error) {
      throw error;
    }
  }
  async checkDistance(req: Request, params: any): Promise<any> {
    try {
      let lat: number = params.start_lat;
      let lng: number = params.start_lng;
      let customerLat: number = params?.customer_details?.lat || params.end_lat;
      let customerLng: number =
        params?.customer_details?.long || params.end_lng;
      if (params?.is_new_counter_visit) {
        customerLat = lat;
        customerLng = lng;
      }
      const distance: any = await this.locationService.getDistance(
        lat,
        lng,
        customerLat,
        customerLng,
      );
      if (isNaN(distance)) return 0;
      return distance;
    } catch (error) {
      throw error;
    }
  }
  async calculateCheckoutProgress(
    req: Request,
    params: any,
    data: any,
    module_id: any,
  ): Promise<any> {
    try {
      const keys =
        module_id === global.MODULES['Enquiry'] ||
        module_id === global.MODULES['Site-Project']
          ? siteEnquiryModule
          : todayProgressKeys;
      const total = keys.length;
      let complete = 0;
      for (const key in data) {
        if (
          keys.includes(key) &&
          data[key] !== undefined &&
          data[key] !== false
        ) {
          complete++;
        }
      }
      const percent = calculatePercentage(complete, total);
      return { total, complete, percent };
    } catch (error) {
      throw error;
    }
  }

  async fetchCheckinDataForCustomer(req: Request, params: any): Promise<any> {
    try {
      const match: Record<string, any> = {
        is_delete: 0,
        org_id: req['user']['org_id'],
        customer_id: toObjectId(params.customer_id),
      };

      const page: number = Math.max(
        1,
        parseInt(params?.page, 10) || global.PAGE,
      );
      const limit: number = Math.max(
        1,
        parseInt(params?.limit, 10) || global.LIMIT,
      );
      const skip: number = (page - 1) * limit;

      const visitActivities = await this.visitActivityModel.find(match).lean();

      const taggedVisitActivities = visitActivities.map((activity) => ({
        ...activity,
        type: 'visit',
      }));

      taggedVisitActivities.sort(
        (a, b) =>
          new Date(b.activity_date).getTime() -
          new Date(a.activity_date).getTime(),
      );

      const total = taggedVisitActivities.length;
      const result = taggedVisitActivities.slice(skip, skip + limit);
      return this.res.pagination(result, total, page, limit);
    } catch (error) {
      throw error;
    }
  }
}
