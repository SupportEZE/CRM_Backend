import { Injectable, HttpStatus } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { ResponseService } from 'src/services/response.service';
import {
  toObjectId,
  commonFilters,
  getLastNDateRangeArr,
  getAllDatesInMonthIST,
  convertToUtcRange,
} from 'src/common/utils/common.utils';
import { VisitActivityModel } from '../models/visit-activity.model';
import { Model } from 'mongoose';
import { UserModel } from 'src/modules/master/user/models/user.model';
import { SharedUserService } from 'src/modules/master/user/shared-user.service';
import { SharedCustomerService } from 'src/modules/master/customer/shared-customer.service';
import { SharedActivityService } from '../shared-activity.service';
import { CustomerTypeService } from 'src/modules/master/customer-type/web/customer-type.service';
import { DropdownService } from 'src/modules/master/dropdown/web/dropdown.service';

enum VisitType {
  VISITOR = 'visitor',
  CUSTOMER_TYPE = 'customer_type',
  STATE = 'state',
  BEAT_CODE = 'beat_code',
}

enum VisitKeys {
  is_planned_visit = 'is_planned_visit',
  AVG_MEETING_TIME = 'avarage_meeting_time',
  NEW_COUNTER_VISIT = 'is_new_counter_visit',
}

@Injectable()
export class ActivityService {
  constructor(
    @InjectModel(VisitActivityModel.name)
    private visitActivityModel: Model<VisitActivityModel>,
    @InjectModel(UserModel.name) private userModel: Model<UserModel>,
    private readonly res: ResponseService,
    private readonly sharedUserService: SharedUserService,
    private readonly sharedCustomerService: SharedCustomerService,
    private readonly dropdownService: DropdownService,
    private readonly sharedActivityService: SharedActivityService,
    private readonly customerTypeService: CustomerTypeService,
  ) { }

  private readonly checkInActivitesLookupConfigs = [
    { from: 'crm_primary_orders', as: 'primary_order_id' },
    { from: 'crm_secondary_order', as: 'secondary_order_id' },
    { from: 'crm_followup', as: 'follow_up_id' },
    { from: 'crm_pop_gift_transaction', as: 'pop_gift_id' },
    { from: 'crm_enquiry', as: 'enquiry_id' },
    { from: 'crm_tickets', as: 'ticket_id' },
    { from: 'crm_stock_audit', as: 'stock_audit_id' },
    { from: 'crm_payment', as: 'payment_id' },
    { from: 'crm_brand_audit', as: 'brand_audit_id' }
  ];

  private generateCheckInActivitesLookupBlock(config: { from: string; as: string }): any[] {
    const isStockAudit = config.as === 'stock_audit_id';

    return [
      {
        $lookup: {
          from: config.from,
          let: { visitId: '$_id' },
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [
                    { $eq: ['$visit_activity_id', '$$visitId'] },
                    { $eq: ['$is_delete', 0] },
                  ],
                },
              },
            },
            isStockAudit
              ? {
                $project: {
                  _id: 1,
                  audit_report: 1,
                }
              }
              : { $project: { _id: 1 } },
          ],
          as: config.as,
        },
      },
      {
        $unwind: {
          path: `$${config.as}`,
          preserveNullAndEmptyArrays: true,
        },
      },
    ];
  }

  private getCheckInActivitiesPipeline(): any[] {
    const addFieldsStage = {
      $addFields: {
        check_in_activities: {
          $mergeObjects: [
            { $ifNull: ['$check_in_activities', {}] },
            ...this.checkInActivitesLookupConfigs.map(({ as }) => ({
              [as]: { $ifNull: [`$${as}._id`, null] },
            })),
          ],
        },
      },
    };

    return [
      ...this.checkInActivitesLookupConfigs.flatMap((cfg) =>
        this.generateCheckInActivitesLookupBlock(cfg),
      ),
      addFieldsStage,
    ];
  }

  async read(req: Request, params: any): Promise<any> {
    try {
      let start: any;
      let end: any;

      if (params?.filters?.start_date && params?.filters?.end_date) {
        const startDate = new Date(params.filters.start_date);
        const endDate = new Date(params.filters.end_date);
        ({ start, end } = convertToUtcRange(startDate, endDate));
      } else if (params?.filters?.start_date) {
        const startDate = new Date(params.filters.start_date);
        ({ start, end } = convertToUtcRange(startDate));
      } else {
        const activityDateRaw =
          params?.filters?.activity_date ??
          new Date().toISOString().slice(0, 10);
        const activityDate = new Date(activityDateRaw);
        ({ start, end } = convertToUtcRange(activityDate));
      }

      let match: Record<string, any> = {
        is_delete: 0,
        org_id: req['user']['org_id'],
      };
      let sorting: Record<string, 1 | -1> = { _id: -1 };

      if (params?.sorting && Object.keys(params.sorting).length !== 0)
        sorting = params.sorting;

      if (
        !params?.filters?.name &&
        !params?.filters?.reporting_manager_name &&
        !params?.filters?.customer_type_name &&
        !params?.filters?.customer_name
      ) {
        const filters: Record<string, any> = commonFilters(params.filters);
        delete filters['start_date'];
        delete filters['end_date'];
        match = { ...match, ...filters };
      }

      if (params?.customer_id)
        match.customer_id = toObjectId(params.customer_id);

      if (
        global.LOGIN_TYPE_ID_PERMISSION?.includes(req['user']['login_type_id'])
      ) {
        const userIds = await this.sharedUserService.getUsersIds(req, params);
        match.$or = [
          { user_id: { $in: userIds } },
          { created_id: { $in: userIds } },
        ];
      }

      match.activity_date = {
        $gte: start,
        $lte: end,
      };

      if (params?.filters?.user_id?.length) {
        match.user_id = { $in: params.filters.user_id.map(toObjectId) };
      }

      const groupKeys = ['beat_code', 'state', 'customer_type_name', 'user_id'];
      let groupKey: string | null = null;

      for (const key of groupKeys) {
        if (params?.[key]?.length) {
          groupKey = key;
          if (groupKey === 'user_id') {
            match[key] = { $in: params[key].map(toObjectId) };
            match[key] = { $ne: null };
          } else {
            match[`customer_details.${key}`] = { $in: params[key] };
            match[`customer_details.${key}`] = { $ne: null };
          }
          break;
        }
      }

      const page: number = params?.page || global.PAGE;
      const limit: number = params?.limit || global.LIMIT;
      const skip: number = (page - 1) * limit;

      const userLookup: any[] = this.sharedUserService.userLookup(req, params);
      const contactPersonInfo: any[] =
        this.sharedCustomerService.contactPersonLookup(req, params);

      const additionalFilters: Record<string, any> = {
        $or: [
          ...(params?.filters?.name
            ? [
              {
                'user_info.name': {
                  $regex: new RegExp(params.filters.name, 'i'),
                },
              },
              {
                'user_info.user_code': {
                  $regex: new RegExp(params.filters.name, 'i'),
                },
              },
            ]
            : []),
          ...(params?.filters?.reporting_manager_name
            ? [
              {
                'user_info.reporting_manager_name': {
                  $regex: new RegExp(
                    params.filters.reporting_manager_name,
                    'i',
                  ),
                },
              },
            ]
            : []),
          ...(params?.filters?.customer_type_name
            ? [
              {
                'customer_details.customer_type_name': {
                  $regex: new RegExp(params.filters.customer_type_name, 'i'),
                },
              },
            ]
            : []),
          ...(params?.filters?.customer_name
            ? [
              {
                'customer_details.customer_name': {
                  $regex: new RegExp(params.filters.customer_name, 'i'),
                },
              },
              {
                'customer_details.mobile': {
                  $regex: new RegExp(params.filters.customer_name, 'i'),
                },
              },
            ]
            : []),
          ...(params?.filters?.designation
            ? [
              {
                'user_info.designation': {
                  $regex: new RegExp(params.filters.designation, 'i'),
                },
              },
            ]
            : []),
        ],
      };

      const pipeline = [
        { $project: { created_unix_time: 0 } },
        { $match: match },
        ...userLookup,
        ...contactPersonInfo,
        ...this.getCheckInActivitiesPipeline(),
        ...(additionalFilters.$or.length > 0
          ? [{ $match: additionalFilters }]
          : []),
        { $sort: sorting },
      ];

      const totalCountData = await this.visitActivityModel.aggregate([
        ...pipeline,
        { $count: 'totalCount' },
      ]);

      const total =
        totalCountData.length > 0 ? totalCountData[0].totalCount : 0;

      params.login_type_ids = [5, 6, 7];
      params.internalCall = true;

      const customerTypes: Record<string, any>[] =
        await this.customerTypeService.readDropdown(req, params);

      let result: any = await this.visitActivityModel.aggregate([
        ...pipeline,
        { $skip: skip },
        { $limit: limit },
      ]);

      const checkinIds = result.map((c) => c._id);

      const documents = await this.sharedActivityService.getDocument(
        checkinIds,
        global.THUMBNAIL_IMAGE,
      );
      const docsByRowId = documents.reduce((acc, doc) => {
        const rowId = doc.row_id.toString();
        if (!acc[rowId]) acc[rowId] = [];
        acc[rowId].push(doc);
        return acc;
      }, {});

      const customerIds = result.map((item) => item.customer_id?.toString());

      const freshCustomers = await this.sharedCustomerService.getCustomersByIds(req, {
        customer_ids: customerIds,
      });

      const customersById = freshCustomers.reduce((acc, customer) => {
        acc[customer._id.toString()] = customer;
        return acc;
      }, {});

      result = await Promise.all(result.map(async (item) => {
        const start = item.visit_start
          ? new Date(item.visit_start).getTime()
          : null;
        const end = item.visit_end ? new Date(item.visit_end).getTime() : null;

        let totalTimeSpent = null;
        if (start && end && end > start) {
          const diffMs = end - start;
          const totalMinutes = Math.floor(diffMs / 60000);
          const hours = Math.floor(totalMinutes / 60);
          const minutes = totalMinutes % 60;

          totalTimeSpent = `${hours} h : ${minutes} min`;
        }
        const freshCustomer = customersById[item.customer_id?.toString()] || null;

        const dropdownDetails = await Promise.all(
          (item.dropdown_options_id || []).map((id) =>
            this.dropdownService.readOption(req, { dropdown_id: id, activity: true })
          )
        );

        const dropdown_details = dropdownDetails
          .filter(d => d && d.statusCode === 200 && d.data)
          .map(d => d.data);

        return {
          ...item,
          discussion_topics: dropdown_details,
          customer_details: {
            beat_code: freshCustomer?.beat_code,
            beat_code_id: freshCustomer?.beat_code_id,
            customer_id: freshCustomer?.customer_id,
            customer_type_id: freshCustomer?.customer_type_id,
            customer_type_name: freshCustomer?.customer_type_name,
            district: freshCustomer?.district,
            mobile: freshCustomer?.mobile,
            state: freshCustomer?.state,
            login_type_id: freshCustomer?.login_type_id
          },
          total_time_spend: totalTimeSpent,
          check_in_activities: {
            ...item.check_in_activities,
            documents: docsByRowId[item._id.toString()] || [],
          },
        };
      }));

      const typeCountMap: Record<
        string,
        { label: string; login_type_id: number; count: number }
      > = {};

      for (const type of customerTypes) {
        typeCountMap[type.label] = {
          label: type.label,
          login_type_id: type.login_type_id,
          count: 0,
        };
      }

      for (const item of result) {
        const typeName = item?.customer_details?.customer_type_name;
        if (typeName && typeCountMap[typeName]) {
          typeCountMap[typeName].count += 1;
        }
      }
      const countSummary = Object.values(typeCountMap);

      const data: any = {
        result,
        count_summary: countSummary,
      };
      return this.res.pagination(data, total, page, limit);
    } catch (error) {
      return this.res.error(HttpStatus.BAD_REQUEST, 'ERROR.BAD_REQ', error);
    }
  }

  async todayVisitData(req: Request, params: any): Promise<any> {
    try {
      const [
        today_visitors,
        today_visit_customer_types,
        todays_visit_states,
        today_visit_beats,
      ] = await Promise.all([
        this.getTodayData(req, params, VisitType.VISITOR),
        this.getTodayData(req, params, VisitType.CUSTOMER_TYPE),
        this.getTodayData(req, params, VisitType.STATE),
        this.getTodayData(req, params, VisitType.BEAT_CODE),
      ]);

      const data = {
        today_visitors,
        today_visit_customer_types,
        todays_visit_states,
        today_visit_beats,
      };
      return this.res.success('SUCCESS.FETCH', data);
    } catch (error) {
      return this.res.error(HttpStatus.BAD_REQUEST, 'ERROR.BAD_REQ', error);
    }
  }
  async getTodayData(req: Request, params: any, type: string): Promise<any> {
    try {
      const { start, end } = convertToUtcRange(
        params?.activity_date || new Date(),
      );

      let match: Record<string, any> = {
        is_delete: 0,
        org_id: req['user']['org_id'],
        created_at: { $gte: start, $lte: end },
      };

      if (
        global.LOGIN_TYPE_ID_PERMISSION?.includes(req['user']['login_type_id'])
      ) {
        const userIds = await this.sharedUserService.getUsersIds(req, params);
        match.$or = [{ user_id: { $in: userIds } }];
      }

      const todayVisitedUsers = await this.visitActivityModel.aggregate([
        { $match: match },
        {
          $group: {
            _id: {
              user_id: '$user_id',
              customer_id: '$customer_id',
            },
          },
        },
        {
          $project: {
            _id: 0,
            user_id: '$_id.user_id',
            customer_id: '$_id.customer_id',
          },
        },
      ]);

      const users = [
        ...new Set(todayVisitedUsers.map((entry) => String(entry.user_id))),
      ].map((id) => toObjectId(id));

      const customers = [
        ...new Set(todayVisitedUsers.map((entry) => String(entry.customer_id))),
      ].map((id) => toObjectId(id));

      if (!users.length || !customers.length) return [];

      const pipeline = await this.sharedActivityService.getAggregationPipeline(
        req,
        type,
        users,
        customers,
        start,
        end,
      );

      const data: Record<string, any>[] =
        await this.visitActivityModel.aggregate(pipeline);
      return data;
    } catch (error) {
      throw error;
    }
  }
  async getAnyalyticsData(req: Request, params: any): Promise<any> {
    try {
      const { start, end } = convertToUtcRange(
        params?.activity_date || new Date(),
      );

      const match: Record<string, any> = {
        is_delete: 0,
        org_id: req['user']['org_id'],
        created_at: {
          $gte: start,
          $lte: end,
        },
      };

      if (
        global.LOGIN_TYPE_ID_PERMISSION?.includes(req['user']['login_type_id'])
      ) {
        const userIds = await this.sharedUserService.getUsersIds(req, params);
        match.$or = [
          { user_id: { $in: userIds } },
          { created_id: { $in: userIds } },
        ];
      }

      const groupKeys = ['beat_code', 'state', 'customer_type_name', 'user_id'];
      let groupKey: string | null = null;

      for (const key of groupKeys) {
        if (params?.[key]?.length) {
          groupKey = key;
          if (groupKey === 'user_id') {
            match[key] = { $in: params[key].map(toObjectId) };
            match[key] = { $ne: null };
          } else {
            match[`customer_details.${key}`] = { $in: params[key] };
            match[`customer_details.${key}`] = { $ne: null };
          }
          break;
        }
      }

      const [totalVisit, productiveVisit] = await Promise.all([
        this.aggregateData({ ...match }, '_id'),
        this.aggregateData({ ...match, order_id: { exist: true } }, '_id'),
      ]);

      const plannedVisit = await this.aggregateData(
        { ...match, is_planned_visit: true },
        VisitKeys.is_planned_visit,
      );
      const unplannedVisit = await this.aggregateData(
        { ...match, is_planned_visit: false },
        VisitKeys.is_planned_visit,
      );
      const averageMeetingTime = await this.aggregateData(
        { ...match },
        '_id',
        VisitKeys.AVG_MEETING_TIME,
      );
      const newCounterVisit = await this.aggregateData(
        { ...match, is_new_counter_visit: true },
        VisitKeys.NEW_COUNTER_VISIT,
      );
      const data: Record<string, any> = {
        total_visit: totalVisit || 0,
        productive_visit: productiveVisit || 0,
        planned_visit: plannedVisit || 0,
        unplanned_visit: unplannedVisit || 0,
        average_meeting_time: averageMeetingTime || 0,
        new_counter_visit: newCounterVisit || 0,
      };

      return this.res.success('SUCCESS.FETCH', data);
    } catch (error) {
      return this.res.error(HttpStatus.BAD_REQUEST, 'ERROR.BAD_REQ', error);
    }
  }
  async getLastNDaysData(req: Request, params: any): Promise<any> {
    try {
      let dateRange: Record<string, any>[] = [];

      if (params?.n_day) {
        dateRange = getLastNDateRangeArr(params.n_day);
      } else {
        dateRange = getLastNDateRangeArr(30);
      }

      let match: Record<string, any> = {
        is_delete: 0,
        org_id: req['user']['org_id'],
      };

      if (
        global.LOGIN_TYPE_ID_PERMISSION?.includes(req['user']['login_type_id'])
      ) {
        const userIds = await this.sharedUserService.getUsersIds(req, params);
        match.$or = [
          { user_id: { $in: userIds } },
          { created_id: { $in: userIds } },
        ];
      }

      const groupKeys = ['beat_code', 'state', 'customer_type_name', 'user_id'];
      let groupKey: string | null = null;
      let groupField: string | null = null;

      for (const key of groupKeys) {
        if (params?.[key]?.length) {
          groupKey = key;
          if (groupKey === 'user_id') {
            match[key] = { $in: params[key].map(toObjectId) };
            match[key] = { $ne: null };
            groupField = `$${groupKey}`;
          } else {
            match[`customer_details.${key}`] = { $in: params[key] };
            match[`customer_details.${key}`] = { $ne: null };
            groupField = `$customer_details.${key}`;
          }
          break;
        }
      }

      for (let row of dateRange) {
        const { start, end } = convertToUtcRange(
          params?.activity_date || new Date(),
        );

        const dateMatch = {
          ...match,
          created_at: { $gte: start, $lte: end },
        };
        let count: number = 0;
        if (groupField) {
          count = await this.aggregateData(dateMatch, groupField);
        } else {
          count = await this.aggregateData(dateMatch, '_id');
        }
        row.count = count;
      }
      return this.res.success('SUCCESS.FETCH', dateRange);
    } catch (error) {
      return this.res.error(HttpStatus.BAD_REQUEST, 'ERROR.BAD_REQ', error);
    }
  }
  async aggregateData(
    match: Record<string, any>,
    groupBy: string,
    sumField: string | number = 1,
  ): Promise<number> {
    try {
      const pipeline = [
        { $match: match },
        {
          $group: {
            _id: `${groupBy}`,
            count:
              typeof sumField === 'number'
                ? { $sum: sumField }
                : { $sum: `${sumField}` },
          },
        },
      ];

      const result = await this.visitActivityModel.aggregate(pipeline);

      if (!result || result.length === 0) {
        return 0;
      }

      return result.reduce((acc, curr) => acc + (curr.count || 0), 0);
    } catch (error) {
      throw error;
    }
  }

  async monthRead(req: Request, params: any): Promise<any> {
    try {
      const orgId = req['user']['org_id'];
      const loginTypeId = global.LOGIN_TYPE_ID['FIELD_USER'];

      const userMatch: Record<string, any> = {
        is_delete: 0,
        org_id: orgId,
        login_type_id: loginTypeId,
      };

      if (params.filters?.user_code) {
        const userCode = params.filters.user_code.trim();
        userMatch.user_code = { $regex: userCode, $options: 'i' };
      }

      if (params.filters?.name) {
        const username = params.filters.name.trim();
        userMatch.name = { $regex: username, $options: 'i' };
      }

      if (params.filters?.designation) {
        const designation = params.filters.designation.trim();
        userMatch.designation = { $regex: designation, $options: 'i' }
      }

      if (
        global.LOGIN_TYPE_ID_PERMISSION?.includes(req['user']['login_type_id'])
      ) {
        const permittedIds = await this.sharedUserService.getUsersIds(
          req,
          params,
        );
        userMatch.$or = [
          { user_id: { $in: permittedIds } },
          { created_id: { $in: permittedIds } },
        ];
      }

      const page = parseInt(params.page) || global.PAGE;
      const limit = parseInt(params.limit) || global.LIMIT;
      const skip = (page - 1) * limit;

      const projection: Record<string, any> = {
        name: 1,
        user_code: 1,
        reporting_manger_name: 1,
        designation: 1
      };

      const [totalUsers, users] = await Promise.all([
        this.userModel.countDocuments(userMatch),
        this.userModel
          .find(userMatch, projection)
          .skip(skip)
          .limit(limit)
          .lean(),
      ]);

      const monthDays = getAllDatesInMonthIST(params);
      const monthStart = new Date(monthDays[0].startDate);
      const monthEnd = new Date(monthDays[monthDays.length - 1].endDate);

      const userIds = users.map((u) => u._id);

      const visits = await this.visitActivityModel.aggregate([
        {
          $match: {
            org_id: orgId,
            is_delete: 0,
            user_id: { $in: userIds },
            created_at: { $gte: monthStart, $lte: monthEnd },
          },
        },
        {
          $addFields: {
            visitDay: {
              $dateToString: {
                date: '$created_at',
                format: '%Y-%m-%d',
                timezone: 'Asia/Kolkata',
              },
            },
            isProductive: { $gt: ['$check_out_activities.order_id', null] },
            isNewCounter: '$is_new_counter_visit',
          },
        },
        {
          $group: {
            _id: {
              user: '$user_id',
              day: '$visitDay',
            },
            count: { $sum: 1 },
            productive: { $sum: { $cond: ['$isProductive', 1, 0] } },
            newCounter: { $sum: { $cond: ['$isNewCounter', 1, 0] } },
          },
        },
      ]);

      const statsByUser: Record<string, any> = {};
      for (const v of visits) {
        const uid = String(v._id.user);
        if (!statsByUser[uid]) {
          statsByUser[uid] = {
            total_checkin: 0,
            productive: 0,
            new_counter: 0,
            days: {},
          };
        }
        statsByUser[uid].days[v._id.day] = v;
        statsByUser[uid].total_checkin += v.count;
        statsByUser[uid].productive += v.productive;
        statsByUser[uid].new_counter += v.newCounter;
      }

      for (const user of users) {
        const uid = String(user._id);
        const stat = statsByUser[uid] || {
          total_checkin: 0,
          productive: 0,
          new_counter: 0,
          days: {},
        };

        (user as any).total_checkin = stat.total_checkin;
        (user as any).productive = stat.productive;
        (user as any).new_counter = stat.new_counter;

        let total_checkin_month = 0;
        let productive_month = 0;
        let new_counter_month = 0;

        (user as any).month = monthDays.map((day) => {
          const dayKey = day.startDate.split('T')[0];
          const d = stat.days[dayKey];
          total_checkin_month += d ? d.count : 0;
          productive_month += d ? d.productive : 0;
          new_counter_month += d ? d.newCounter : 0;

          return {
            ...day,
            count: d ? d.count : 0,
            productive: d ? d.productive : 0,
            new_counter: d ? d.newCounter : 0,
          };
        });

        (user as any).total_checkin_month = total_checkin_month;
        (user as any).productive_month = productive_month;
        (user as any).new_counter_month = new_counter_month;
      }

      return this.res.pagination(users, totalUsers, page, limit);
    } catch (err) {
      return this.res.error(HttpStatus.BAD_REQUEST, 'ERROR.BAD_REQ', err);
    }
  }
}
