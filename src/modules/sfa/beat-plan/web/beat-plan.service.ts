import { forwardRef, HttpStatus, Inject, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { BeatPlanModel } from '../models/beat-plan.model';
import { ResponseService } from 'src/services/response.service';
import {
  calculatePercentage,
  convertToUtcRange,
  toObjectId,
} from 'src/common/utils/common.utils';
import { UserModel } from 'src/modules/master/user/models/user.model';
import { BeatRouteModel } from 'src/modules/master/location-master/beat-route/models/beat-route.model';
import { CustomerModel } from 'src/modules/master/customer/default/models/customer.model';
import { CustomerOtherDetailModel } from 'src/modules/master/customer/default/models/customer-other-detail.model';
import { DateTimeService } from 'src/services/date-time.service';
import { commonFilters } from 'src/common/utils/common.utils';
import { VisitActivityModel } from '../../activity/models/visit-activity.model';
import { SharedUserService } from 'src/modules/master/user/shared-user.service';
import { SharedCustomerService } from 'src/modules/master/customer/shared-customer.service';
import { BeatPlanTargetModel } from '../models/beat-plan-target.model';
@Injectable()
export class BeatPlanService {
  constructor(
    @InjectModel(BeatPlanModel.name)
    private beatPlanModel: Model<BeatPlanModel>,
    @InjectModel(UserModel.name) private userModel: Model<UserModel>,
    @InjectModel(BeatRouteModel.name)
    private beatRouteModel: Model<BeatRouteModel>,
    @InjectModel(CustomerModel.name)
    private customerModel: Model<CustomerModel>,
    @InjectModel(CustomerOtherDetailModel.name)
    private customerOtherDetailModel: Model<CustomerOtherDetailModel>,
    @InjectModel(BeatPlanTargetModel.name)
    private beatPlanTargetModel: Model<BeatPlanTargetModel>,
    @InjectModel(VisitActivityModel.name)
    private visitActivityModel: Model<VisitActivityModel>,
    private readonly dateTimeService: DateTimeService,
    private readonly res: ResponseService,
    private readonly sharedUserService: SharedUserService,
    @Inject(forwardRef(() => SharedCustomerService))
    private readonly sharedCustomerService: SharedCustomerService,
  ) {}

  async create(req: Request, params: any): Promise<any> {
    try {
      params.user_id = toObjectId(params.user_id);
      const { dayName } = this.dateTimeService.getDateParts(
        new Date(params.date),
      );
      params.day = dayName;

      const match: Record<string, any> = {
        org_id: req['user']['org_id'],
        date: params.date,
        beat_code: params.beat_code,
        is_delete: 0,
        user_id: params.user_id,
      };
      const exist: Record<string, any> = await this.beatPlanModel
        .findOne(match)
        .exec();
      if (exist)
        return this.res.error(HttpStatus.BAD_REQUEST, 'WARNING.ALREADY_EXIST');

      const saveObj: Record<string, any> = {
        ...req['createObj'],
        ...params,
      };
      const document = new this.beatPlanModel(saveObj);
      await document.save();
      return this.res.success('SUCCESS.CREATE');
    } catch (error) {
      return this.res.error(HttpStatus.BAD_REQUEST, 'ERROR.BAD_REQ', error);
    }
  }

  async read(req: Request, params: any): Promise<any> {
    try {
      let match: Record<string, any> = {
        is_delete: 0,
        org_id: req['user']['org_id'],
      };

      const { start, end } = convertToUtcRange(
        params?.filters?.date || new Date(),
      );

      const filters: Record<string, any> = commonFilters(params?.filters);
      match = { ...match, ...filters };
      match.date = { $gte: start, $lte: end };

      if (
        global.LOGIN_TYPE_ID_PERMISSION?.includes(req['user']['login_type_id'])
      ) {
        const userIds = await this.sharedUserService.getUsersIds(req, params);
        match.$or = [
          { user_id: { $in: userIds } },
          { created_id: { $in: userIds } },
        ];
      }
      const page: number = params?.page || global.PAGE;
      const limit: number = params?.limit || global.LIMIT;
      const skip: number = (page - 1) * limit;

      const pipeline = [
        { $match: match },
        {
          $lookup: {
            from: 'crm_user_hierarchy',
            localField: 'user_id',
            foreignField: 'child_user_id',
            as: 'rm_data',
          },
        },
        { $unwind: { path: '$rm_data', preserveNullAndEmptyArrays: true } },
        {
          $project: {
            description: 1,
            created_at: 1,
            created_id: 1,
            created_name: 1,
            updated_at: 1,
            beat_code: 1,
            user_id: 1,
            date: 1,
            day: 1,
            user_name: 1,
            user_mobile: 1,
            reporting_manager_name: '$rm_data.parent_user_name',
          },
        },
        { $skip: skip },
        { $limit: limit },
      ];

      const totalCountResult = await this.beatPlanModel
        .aggregate([{ $match: match }, { $count: 'total' }])
        .exec();
      const total = totalCountResult[0]?.total || 0;
      const data = await this.beatPlanModel.aggregate(pipeline).exec();

      const enhancedData = await Promise.all(
        data.map(async (item) => {
          const {
            primaryVisitCount,
            secondaryVisitCount,
            primaryAchieveCount,
            secondaryAchieveCount,
          } = await this.fetchVisitTarget(item);
          const calculateAchievePercentage = (
            achieved: number,
            target: number,
          ) => calculatePercentage(achieved, target);
          item.primary_visit_target = primaryVisitCount;
          item.primary_achieve_target = primaryAchieveCount;
          item.primary_achieve_percentage = calculateAchievePercentage(
            primaryAchieveCount,
            primaryVisitCount,
          );
          item.secondary_visit_target = secondaryVisitCount;
          item.secondary_achieve_target = secondaryAchieveCount;
          item.secondary_achieve_percentage = calculateAchievePercentage(
            secondaryAchieveCount,
            secondaryVisitCount,
          );
          return item;
        }),
      );

      return this.res.pagination(enhancedData, total, page, limit);
    } catch (error) {
      return this.res.error(
        HttpStatus.BAD_REQUEST,
        'ERROR.BAD_REQ',
        error.message,
      );
    }
  }

  async fetchVisitTarget(params: any): Promise<any> {
    try {
      const beatRoute: Record<string, any> = await this.beatRouteModel
        .findOne({ is_delete: 0, beat_route_code: params.beat_code })
        .select('_id')
        .exec();
      if (!beatRoute) return { primaryVisitCount: 0, secondaryVisitCount: 0 };

      const customerIds = (
        await this.customerOtherDetailModel
          .find({ beat_code_id: beatRoute._id, is_delete: 0 })
          .select('customer_id')
          .exec()
      ).map((item) => item.customer_id);

      const query = {
        _id: { $in: customerIds },
        created_at: { $lte: params.created_at },
      };

      const [primaryVisitCount, secondaryVisitCount, primaryIds, secondaryIds] =
        await Promise.all([
          this.customerModel
            .countDocuments({ ...query, login_type_name: 'Primary' })
            .exec(),
          this.customerModel
            .countDocuments({ ...query, login_type_name: 'Secondary' })
            .exec(),
          this.customerModel
            .find({ ...query, login_type_name: 'Primary' })
            .select('_id')
            .exec(),
          this.customerModel
            .find({ ...query, login_type_name: 'Secondary' })
            .select('_id')
            .exec(),
        ]);
      const [primaryAchieveCount, secondaryAchieveCount] = await Promise.all([
        this.visitActivityModel
          .countDocuments({
            customer_id: { $in: primaryIds.map((item) => item._id) },
            created_at: params.created_at,
          })
          .exec(),
        this.visitActivityModel
          .countDocuments({
            customer_id: { $in: secondaryIds.map((item) => item._id) },
            created_at: params.created_at,
          })
          .exec(),
      ]);
      return {
        primaryVisitCount,
        secondaryVisitCount,
        primaryAchieveCount,
        secondaryAchieveCount,
      };
    } catch (error) {
      throw error;
    }
  }

  async unAssignBeatPlan(req: Request, params: any): Promise<any> {
    try {
      const { start, end } = convertToUtcRange(params.date);
      let match: Record<string, any> = {
        beat_code: params.beat_code,
        user_id: toObjectId(params.user_id),
        date: { $gte: start, $lte: end },
        is_delete: 0,
      };
      const exist: Record<string, any> = await this.beatPlanModel
        .findOne(match)
        .exec();
      if (!exist)
        return this.res.error(HttpStatus.BAD_REQUEST, 'WARNING.NOT_EXIST');

      if (params?.is_delete && exist['is_delete'] === params?.is_delete)
        return this.res.error(
          HttpStatus.BAD_REQUEST,
          'BEAT_PLAN.ALREADY_DELETE',
        );
      const updateObj: Record<string, any> = {
        ...req['updateObj'],
        is_delete: 1,
      };
      await this.beatPlanModel.updateOne(match, updateObj);
      return this.res.success('SUCCESS.DELETE');
    } catch (error) {
      return this.res.error(HttpStatus.BAD_REQUEST, 'ERROR.BAD_REQ', error);
    }
  }

  async delete(req: Request, params: any): Promise<any> {
    try {
      params._id = toObjectId(params._id);
      const exist: Record<string, any> = await this.beatPlanModel
        .findOne({ _id: params._id, is_delete: 0 })
        .exec();

      if (!exist)
        return this.res.error(HttpStatus.BAD_REQUEST, 'WARNING.NOT_EXIST');

      if (params?.is_delete && exist['is_delete'] === params?.is_delete)
        return this.res.error(
          HttpStatus.BAD_REQUEST,
          'BEAT_PLAN.ALREADY_DELETE',
        );
      const updateObj: Record<string, any> = {
        ...req['updateObj'],
        is_delete: 1,
      };
      await this.beatPlanModel.updateOne({ _id: params._id }, updateObj);
      return this.res.success('SUCCESS.DELETE');
    } catch (error) {
      return this.res.error(HttpStatus.BAD_REQUEST, 'ERROR.BAD_REQ', error);
    }
  }

  async readBeat(req: Request, params: any): Promise<any> {
    try {
      const orgId: number = req['user']['org_id'];
      const userId = toObjectId(params.user_id);

      const user = await this.userModel
        .findOne({ _id: userId, is_delete: 0 })
        .lean();
      if (!user)
        return this.res.error(HttpStatus.NOT_FOUND, 'BEAT.USER_NOT_FOUND');

      const beatRouteCodes = user.beat_route_code;
      if (!beatRouteCodes)
        return this.res.error(HttpStatus.NOT_FOUND, 'ERROR.BEAT_NOT_ASSIGNED');

      const assignedCustomers = await this.sharedUserService.getAssignCustomers(
        req,
        params,
      );
      const assignedCustomerIds = assignedCustomers.map((c) =>
        c.customer_id?.toString(),
      );

      const data: Record<string, any>[] = await this.beatRouteModel
        .find({
          beat_route_code: {
            $in: Array.isArray(beatRouteCodes)
              ? beatRouteCodes
              : [beatRouteCodes],
          },
          is_delete: 0,
          org_id: orgId,
        })
        .lean();

      const customerCounts = await this.customerOtherDetailModel.aggregate([
        {
          $match: {
            beat_code: { $in: beatRouteCodes },
            is_delete: 0,
            customer_id: {
              $in: assignedCustomerIds.map((id) => toObjectId(id)),
            },
          },
        },
        {
          $group: {
            _id: '$beat_code',
            customer_count: { $sum: 1 },
          },
        },
      ]);
      const countMap = Object.fromEntries(
        customerCounts.map((c) => [c._id, c.customer_count]),
      );
      const result = data.map((beat) => ({
        ...beat,
        count: countMap[beat.beat_route_code] || 0,
      }));
      return this.res.success('SUCCESS.FETCH', result);
    } catch (error) {
      return this.res.error(HttpStatus.BAD_REQUEST, 'ERROR.BAD_REQ', error);
    }
  }

  async readCounts(req: Request, params: any): Promise<any> {
    try {
      const { start, end } = convertToUtcRange(params?.date || new Date());
      let match: Record<string, any> = {
        is_delete: 0,
        org_id: req['user']['org_id'],
      };

      const total_beat_count: number =
        await this.beatPlanModel.countDocuments(match);

      match.date = { $gte: start, $lte: end };
      const active_beat_count: number =
        await this.beatPlanModel.countDocuments(match);

      const commonMatch: Record<string, any> = {
        is_delete: 0,
        org_id: req['user']['org_id'],
      };

      const userActiveAggregation = await this.beatPlanModel.aggregate([
        {
          $match: {
            ...commonMatch,
            date: { $gte: start, $lte: end },
          },
        },
        {
          $group: {
            _id: '$user_id',
          },
        },
        {
          $count: 'user_active_count',
        },
      ]);

      const user_active_count: number =
        userActiveAggregation[0]?.user_active_count || 0;

      const data: Record<string, any> = {
        total_beat_count,
        active_beat_count,
        user_active_count,
      };
      return this.res.success('SUCCESS.FETCH', data);
    } catch (error) {
      return this.res.error(HttpStatus.BAD_REQUEST, 'ERROR.BAD_REQ', error);
    }
  }

  async readPartyInfo(req: Request, params: any): Promise<any> {
    try {
      let match: Record<string, any> = {
        is_delete: 0,
        org_id: req['user']['org_id'],
        beat_route_code: params.beat_code,
      };
      let exist: Record<string, any> = await this.beatRouteModel
        .findOne(match)
        .select('_id')
        .exec();
      if (!exist)
        return this.res.error(HttpStatus.BAD_REQUEST, 'WARNING.NOT_EXIST');

      const assigneBeat: Record<string, any>[] =
        await this.customerOtherDetailModel
          .find({ beat_code_id: toObjectId(exist._id) })
          .select('customer_id')
          .exec();
      if (!assigneBeat)
        return this.res.error(HttpStatus.BAD_REQUEST, 'ERROR.NOT_FOUND');

      const customerIds = assigneBeat.map((row: any) => row.customer_id);

      const assignedCustomes =
        await this.sharedUserService.getAssinedCustomersId(
          req,
          params,
          customerIds,
        );
      const assignedCustomerIds = assignedCustomes.map(
        (row: any) => row.customer_id,
      );
      const data: Record<string, any>[] = await this.customerModel
        .find({ _id: { $in: assignedCustomerIds } })
        .exec();

      return this.res.success('SUCCESS.FETCH', data);
    } catch (error) {
      return this.res.error(HttpStatus.BAD_REQUEST, 'ERROR.BAD_REQ', error);
    }
  }

  async readGraph(req: Request, params: any): Promise<any> {
    try {
      let today = new Date();
      const tenDaysAgo = new Date();
      tenDaysAgo.setDate(tenDaysAgo.getDate() - 10);
      const result: Record<string, any>[] = [];
      for (let i = 0; i < 10; i++) {
        const dateToCheck = new Date(today);
        dateToCheck.setDate(today.getDate() - i);
        const startOfDay = new Date(dateToCheck);
        startOfDay.setUTCHours(0, 0, 0, 0);
        const endOfDay = new Date(dateToCheck);
        endOfDay.setUTCHours(23, 59, 59, 999);
        const beatRoutes = await this.beatPlanModel
          .find({
            org_id: req['user']['org_id'],
            is_delete: 0,
            created_at: {
              $gte: startOfDay.toISOString(),
              $lte: endOfDay.toISOString(),
            },
          })
          .distinct('beat_code');
        const beatCount = beatRoutes.length;
        result.push({
          date: startOfDay.toISOString().split('T')[0],
          beat_count: beatCount,
        });
      }
      return this.res.success('SUCCESS.FETCH', result);
    } catch (error) {
      return this.res.error(HttpStatus.BAD_REQUEST, 'ERROR.BAD_REQ', error);
    }
  }

  async readLastTenDaysBeat(req: Request, params: any): Promise<any> {
    try {
      const today = new Date();
      const dayNames: Record<string, any> = [
        'Sunday',
        'Monday',
        'Tuesday',
        'Wednesday',
        'Thursday',
        'Friday',
        'Saturday',
      ];
      const result: Record<string, any>[] = [];
      for (let i = 0; i < 10; i++) {
        const dateToCheck = new Date(today.setDate(today.getDate() - 1));
        const startOfDay = new Date(dateToCheck.setUTCHours(0, 0, 0, 0));
        const endOfDay = new Date(dateToCheck.setUTCHours(23, 59, 59, 999));
        const dayOfWeek = dayNames[startOfDay.getUTCDay()];

        const beatRoutes = await this.beatPlanModel
          .find({
            org_id: req['user']['org_id'],
            user_id: toObjectId(params.user_id),
            is_delete: 0,
            date: { $gte: startOfDay, $lte: endOfDay },
          })
          .select('beat_code description');
        result.push({
          date: startOfDay,
          day: dayOfWeek,
          beats: beatRoutes.length
            ? beatRoutes.map((beat) => ({
                beat_code: beat.beat_code,
                description: beat.description,
              }))
            : [],
        });
      }
      return this.res.success('SUCCESS.FETCH', result);
    } catch (error) {
      return this.res.error(HttpStatus.BAD_REQUEST, 'ERROR.BAD_REQ', error);
    }
  }

  async assignBeatCodes(req: Request, params: any): Promise<any> {
    try {
      const match: Record<string, any> = {
        is_delete: 0,
        org_id: req['user']['org_id'],
        user_id: req['user']['_id'],
      };
      const { start, end } = convertToUtcRange(params.date || new Date());
      if (params?.date) {
        match.date = {
          $gte: start,
          $lte: end,
        };
      } else {
        match.date = {
          $gte: start,
          $lte: end,
        };
      }
      const pipeline: any[] = [
        { $match: match },
        {
          $group: {
            _id: '$user_id',
            user_id: { $first: '$user_id' },
            beat_codes: {
              $addToSet: {
                beat_code: '$beat_code',
                description: '$description',
              },
            },
          },
        },
      ];

      const data = await this.beatPlanModel.aggregate(pipeline);
      return data;
    } catch (error) {
      throw error;
    }
  }

  async addBeatTarget(req: Request, params: Record<string, any>): Promise<any> {
    try {
      const orgId = req['user']['org_id'];

      if (!orgId) {
        return this.res.error(HttpStatus.BAD_REQUEST, 'ERROR.MISSING_ORG_ID');
      }

      const existingRecord = await this.beatPlanTargetModel
        .findOne({ org_id: orgId })
        .exec();

      if (!existingRecord) {
        const saveObj: Record<string, any> = {
          ...req['createObj'],
          ...params,
        };
        const document = new this.beatPlanModel(saveObj);
        await document.save();
        return this.res.success('SUCCESS.CREATED');
      } else {
        const updateObj: Record<string, any> = {
          ...req['updateObj'],
          ...params,
        };
        await this.beatPlanTargetModel.updateOne({ org_id: orgId }, updateObj);
        return this.res.success('SUCCESS.UPDATED');
      }
    } catch (error) {
      console.error('Error in addBeatTarget:', error);
      return this.res.error(HttpStatus.BAD_REQUEST, 'ERROR.BAD_REQ', error);
    }
  }
}
