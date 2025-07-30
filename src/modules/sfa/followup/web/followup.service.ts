import { HttpStatus, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { FollowupModel } from '../models/followup.model';
import { ResponseService } from 'src/services/response.service';
import {
  toObjectId,
  commonFilters,
  convertToUtcRange,
  calculatePercentage,
  tat,
} from 'src/common/utils/common.utils';
import { SitesModel } from '../../sites/models/sites.model';
import { CustomerModel } from 'src/modules/master/customer/default/models/customer.model';
import { UserModel } from 'src/modules/master/user/models/user.model';
import { SharedUserService } from 'src/modules/master/user/shared-user.service';
import { EnquiryModel } from '../../enquiry/default/models/enquiry.model';

@Injectable()
export class FollowupService {
  constructor(
    @InjectModel(FollowupModel.name)
    private followupModel: Model<FollowupModel>,
    @InjectModel(SitesModel.name) private sitesModel: Model<SitesModel>,
    @InjectModel(EnquiryModel.name) private enquiryModel: Model<EnquiryModel>,
    @InjectModel(CustomerModel.name)
    private customerModel: Model<CustomerModel>,
    @InjectModel(UserModel.name) private userModel: Model<UserModel>,
    private readonly res: ResponseService,
    private readonly sharedUserService: SharedUserService,
  ) { }

  async create(req: Request, params: any): Promise<any> {
    try {
      params.org_id = req['user']['org_id'];
      let categoryDetail: any = null;
      if (params.category_type) {
        if (params.category_type === 'Enquiry') {
          categoryDetail = await this.enquiryModel
            .findById(params.category_id)
            .lean();
        } else if (params.category_type === 'Site') {
          categoryDetail = await this.sitesModel
            .findById(params.category_id)
            .lean();
        } else if (params.category_type === 'Customer') {
          categoryDetail = await this.customerModel
            .findById(params.category_id)
            .lean();
        }
      }

      const formattedCategoryDetail: Record<string, any> = {
        id: categoryDetail._id,
        name:
          categoryDetail.name ||
          categoryDetail.site_name ||
          categoryDetail.customer_name ||
          '',
        mobile:
          categoryDetail.mobile ||
          categoryDetail.mobile ||
          categoryDetail.mobile ||
          '',
      };

      let assignedUserDetail: any = await this.userModel
        .findById(params.assigned_to_user_id, { name: 1, mobile: 1 })
        .lean();

      if (!assignedUserDetail) {
        assignedUserDetail = { name: '', mobile: '' };
      }

      params.category_id = toObjectId(params.category_id);
      params.assigned_to_user_id = toObjectId(params.assigned_to_user_id);
      params.assigned_to_user_name = params.assigned_to_user_name;
      params.status = global.FOLLOWUP_TAB[1];

      const saveObj: Record<string, any> = {
        ...req['createObj'],
        ...params,
        category_detail: formattedCategoryDetail,
        customer_name: formattedCategoryDetail.name,
        assigned_user_detail: assignedUserDetail,
      };
      delete saveObj._id;
      const document = new this.followupModel(saveObj);
      await document.save();
      return this.res.success('SUCCESS.CREATE');
    } catch (error) {
      return this.res.error(HttpStatus.BAD_REQUEST, 'ERROR.BAD_REQ', error);
    }
  }

  async update(req: Request, params: any): Promise<any> {
    try {
      const exist = await this.followupModel
        .findOne({ _id: params._id })
        .exec();
      if (!exist)
        return this.res.error(HttpStatus.BAD_REQUEST, 'WARNING.NOT_EXIST');

      params.org_id = req['user']['org_id'];
      const updateObj: Record<string, any> = {
        ...req['updateObj'],
        ...params,
      };
      const updatedDocument = await this.followupModel.updateOne(
        { _id: params._id },
        updateObj,
      );
      if (!updatedDocument)
        return this.res.error(HttpStatus.BAD_REQUEST, 'ERROR.UPDATE_FAILED');
      return this.res.success('SUCCESS.UPDATE');
    } catch (error) {
      return this.res.error(HttpStatus.BAD_REQUEST, 'ERROR.BAD_REQ', error);
    }
  }

  async read(req: Request, params: any): Promise<any> {
    try {
      const orgId = req['user']['org_id'];
      let match: Record<string, any> = { is_delete: 0, org_id: orgId };

      const { start, end } = convertToUtcRange(new Date());

      const filters = commonFilters(params?.filters);
      match = { ...match, ...filters };

      if (global.LOGIN_TYPE_ID_PERMISSION?.includes(req['user']['login_type_id'])) {
        const userIds = await this.sharedUserService.getUsersIds(req, params);
        match.$or = [
          { assigned_to_user_id: { $in: userIds } },
          { created_id: { $in: userIds } },
        ];
      }

      const sorting = params?.sorting ?? { _id: -1 };
      const page: number = params?.page || global.PAGE;
      const limit: number = params?.limit || global.LIMIT;
      const skip: number = (page - 1) * limit;

      if (params.followup_id) {
        match._id = toObjectId(params.followup_id);
      } else {
        const activeTab = params?.activeTab;
        if (activeTab === global.FOLLOWUP_TAB[1]) {
          match.status = global.FOLLOWUP_TAB[1];
          match.followup_date = { $lt: end };
        } else if (activeTab === global.FOLLOWUP_TAB[2]) {
          match.status = { $ne: global.FOLLOWUP_TAB[3] };
          match.followup_date = { $gt: end };
        } else if (activeTab === global.FOLLOWUP_TAB[3]) {
          match.status = global.FOLLOWUP_TAB[3];
        }
      }

      const mainPipeline: any = [
        { $match: match },
        { $sort: sorting },
        { $project: { created_unix_time: 0 } },
      ];

      const tabCounts = await this.getTabCounts(req, start, end);
      const userViceCounts = await this.getUserCounts(match);
      const completedFollowups = await this.getCompletedCounts(req, start, end);
      const totalCountData = await this.followupModel.aggregate([
        ...mainPipeline,
        { $count: 'totalCount' },
      ]);
      const total = totalCountData[0]?.totalCount || 0;

      const result: any = await this.followupModel.aggregate([
        ...mainPipeline,
        { $skip: skip },
        { $limit: limit },
      ]);

      const finalData: any = {
        result,
        tabCounts,
        userViceCounts,
        completedFollowups,
      };
      return this.res.pagination(finalData, total, page, limit);
    } catch (error) {
      return this.res.error(HttpStatus.BAD_REQUEST, 'ERROR.BAD_REQ', error);
    }
  }

  async getTabCounts(req: Request, start: Date, end: Date) {
    const match: Record<string, any> = {};
    if (
      global.LOGIN_TYPE_ID_PERMISSION?.includes(req['user']['login_type_id'])
    ) {
      const userIds = await this.sharedUserService.getUsersIds(req, {});
      match.$or = [
        { assigned_to_user_id: { $in: userIds } },
        { created_id: { $in: userIds } },
      ];
    }
    const orgId: number = req['user']['org_id'];
    const aggregation = await this.followupModel.aggregate([
      { $match: { is_delete: 0, org_id: orgId } },
      {
        $facet: {
          pending: [
            {
              $match: {
                status: global.FOLLOWUP_TAB[1],
                followup_date: { $lt: end },
                ...match,
              },
            },
            { $count: 'count' },
          ],
          upcoming: [
            {
              $match: {
                status: { $ne: global.FOLLOWUP_TAB[3] },
                followup_date: { $gt: end },
                ...match,
              },
            },
            { $count: 'count' },
          ],
          complete: [
            {
              $match: {
                status: global.FOLLOWUP_TAB[3],
                ...match,
              },
            },
            { $count: 'count' },
          ],
        },
      },
    ]);

    const result = aggregation[0];
    return {
      pending: result.pending[0]?.count || 0,
      upcoming: result.upcoming[0]?.count || 0,
      complete: result.complete[0]?.count || 0,
    };
  }

  async getUserCounts(match: any) {
    const data = await this.followupModel.aggregate([
      { $match: match },
      {
        $group: {
          _id: {
            userId: '$assigned_user_detail._id',
            userName: '$assigned_user_detail.name',
          },
          count: { $sum: 1 },
        },
      },
    ]);

    return data.map((item) => ({
      assigned_to_user_id: item._id.userId,
      assigned_to_user_name: item._id.userName,
      assigned_count: item.count,
    }));
  }

  async getCompletedCounts(req: Request, start: Date, end: Date) {
    const match: Record<string, any> = {};
    if (
      global.LOGIN_TYPE_ID_PERMISSION?.includes(req['user']['login_type_id'])
    ) {
      const userIds = await this.sharedUserService.getUsersIds(req, {});
      match.$or = [
        { assigned_to_user_id: { $in: userIds } },
        { created_id: { $in: userIds } },
      ];
    }
    const orgId: number = req['user']['org_id'];
    const todayAgg = await this.followupModel.aggregate([
      {
        $match: {
          is_delete: 0,
          org_id: orgId,
          status: global.FOLLOWUP_TAB[3],
          updated_at: { $gte: start, $lte: end },
          followup_date: { $lte: end },
          ...match,
        },
      },
      { $group: { _id: null, todayCount: { $sum: 1 } } },
    ]);

    const total = await this.followupModel.countDocuments({
      is_delete: 0,
      org_id: orgId,
      status: global.FOLLOWUP_TAB[3],
      ...match,
    });

    return {
      today: todayAgg[0]?.todayCount || 0,
      total,
    };
  }

  async delete(req: Request, params: any): Promise<any> {
    try {
      const exist = await this.followupModel
        .findOne({ _id: params._id })
        .exec();
      if (!exist)
        return this.res.error(HttpStatus.BAD_REQUEST, 'WARNING.NOT_EXIST');

      params.org_id = req['user']['org_id'];
      const updateObj: Record<string, any> = {
        ...req['updateObj'],
        ...params,
      };
      const updatedDocument = await this.followupModel.updateOne(
        { _id: params._id },
        updateObj,
      );
      if (!updatedDocument)
        return this.res.error(HttpStatus.BAD_REQUEST, 'ERROR.UPDATE_FAILED');
      return this.res.success('SUCCESS.DELETE');
    } catch (error) {
      return this.res.error(HttpStatus.BAD_REQUEST, 'ERROR.BAD_REQ', error);
    }
  }

  async statusUpdate(req: Request, params: any): Promise<any> {
    try {
      const exist = await this.followupModel
        .findOne({ _id: params._id })
        .exec();
      if (!exist)
        return this.res.error(HttpStatus.BAD_REQUEST, 'WARNING.NOT_EXIST');

      const updateObj: Record<string, any> = {
        ...req['updateObj'],
        ...params,
      };

      if (params.status === global.FOLLOWUP_TAB[3]) {
        params.completed_date = new Date();
      }
      const updatedDocument = await this.followupModel.updateOne(
        { _id: params._id },
        updateObj,
      );
      if (!updatedDocument)
        return this.res.error(HttpStatus.BAD_REQUEST, 'ERROR.UPDATE_FAILED');
      return this.res.success('SUCCESS.STATUS_UPDATE');
    } catch (error) {
      return this.res.error(HttpStatus.BAD_REQUEST, 'ERROR.BAD_REQ', error);
    }
  }

  async categories(req: Request, params: any): Promise<any> {
    try {
      const categoryType = params.category_type;
      let match: Record<string, any> = {
        is_delete: 0,
        org_id: req['user']['org_id'],
      };

      if (params?.filters) {
        Object.keys(params.filters).forEach((key) => {
          if (params.filters[key]) {
            let dbField = key;
            if (categoryType === 'Site' && key === 'name')
              dbField = 'site_name';
            if (categoryType === 'Enquiry' && key === 'name') dbField = 'name';
            if (categoryType === 'Customer' && key === 'name')
              dbField = 'customer_name';

            match[dbField] = { $regex: params.filters[key], $options: 'i' }; // Case-insensitive filtering
          }
        });
      }

      let data: any;
      if (categoryType === 'Site') {
        data = await this.sitesModel.find(match);
        data = data.map((row: any) => ({
          label: row.site_name,
          value: row._id,
        }));
      } else if (categoryType === 'Enquiry') {
        data = await this.enquiryModel.find(match);
        data = data.map((row: any) => ({
          label: row.name,
          value: row._id,
        }));
      } else if (categoryType === 'Customer') {
        data = await this.customerModel.find(match);
        data = data.map((row: any) => ({
          label: row.customer_name,
          value: row._id,
        }));
      }
      return this.res.success('SUCCESS.FETCH', data);
    } catch (error) {
      return this.res.error(HttpStatus.BAD_REQUEST, 'ERROR.BAD_REQ', error);
    }
  }
  async followupDashboard(req: Request, params: any): Promise<any> {
    try {
      const { start, end } = convertToUtcRange(new Date());

      const matchBase = {
        is_delete: 0,
        $or: [
          { assigned_to_user_id: req['user']['_id'] },
          { created_id: req['user']['_id'] },
        ],
        org_id: req['user']['org_id'],
        updated_at: { $lte: end }, // filter date once in match
      };

      const [result] = await this.followupModel.aggregate([
        { $match: matchBase },
        {
          $group: {
            _id: null,
            total: {
              $sum: {
                $cond: [
                  {
                    $in: [
                      '$status',
                      [global.FOLLOWUP_TAB[1], global.FOLLOWUP_TAB[3]], // ✅ valid array
                    ],
                  },
                  1,
                  0,
                ],
              },
            },
            complete: {
              $sum: {
                $cond: [{ $eq: ['$status', global.FOLLOWUP_TAB[3]] }, 1, 0],
              },
            },
            last_completed_date: {
              $max: {
                $cond: [
                  { $eq: ['$status', global.FOLLOWUP_TAB[3]] },
                  '$updated_at',
                  null,
                ],
              },
            },
          },
        },
      ]);

      const total = result?.total || 0;
      const complete = result?.complete || 0;
      const lastCompletedAt = result?.last_completed_date || null;

      let tatOf = '0 days';
      if (lastCompletedAt) tatOf = tat(lastCompletedAt, new Date());

      return {
        total,
        complete,
        progress: calculatePercentage(complete, total),
        tat: tatOf,
      };
    } catch (error) {
      throw error;
    }
  }
}
