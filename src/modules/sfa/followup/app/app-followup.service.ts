import { HttpStatus, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { FollowupModel } from '../models/followup.model';
import { ResponseService } from 'src/services/response.service';
import {
  toObjectId,
  appCommonFilters,
  convertToUtcRange,
} from 'src/common/utils/common.utils';
import { SitesModel } from '../../sites/models/sites.model';
import { CustomerModel } from 'src/modules/master/customer/default/models/customer.model';
import { UserModel } from 'src/modules/master/user/models/user.model';
import { UserToCustomerMappingModel } from 'src/modules/master/customer/default/models/user-to-customer-mapping.model';
import { UserHierarchyModel } from 'src/modules/master/user/models/user-hierarchy.model';
import { SharedUserService } from 'src/modules/master/user/shared-user.service';
import { WorkingActivityType } from 'src/modules/master/user/models/user-working-activity.model';
import { EnquiryModel } from '../../enquiry/default/models/enquiry.model';
@Injectable()
export class AppFollowupService {
  constructor(
    @InjectModel(FollowupModel.name)
    private followupModel: Model<FollowupModel>,
    @InjectModel(SitesModel.name) private sitesModel: Model<SitesModel>,
    @InjectModel(EnquiryModel.name) private enquiryModel: Model<EnquiryModel>,
    @InjectModel(CustomerModel.name)
    private customerModel: Model<CustomerModel>,
    @InjectModel(UserModel.name) private userModel: Model<UserModel>,
    @InjectModel(UserToCustomerMappingModel.name)
    private userToCustomerMappingModel: Model<UserToCustomerMappingModel>,
    @InjectModel(UserHierarchyModel.name)
    private userHierarchyModel: Model<UserHierarchyModel>,
    private readonly res: ResponseService,
    private readonly sharedUserService: SharedUserService,
  ) {}

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
      params.status = 'Pending';

      if (params?.visit_activity_id)
        params.visit_activity_id = toObjectId(params.visit_activity_id);

      const saveObj: Record<string, any> = {
        ...req['createObj'],
        ...params,
        category_detail: formattedCategoryDetail,
        customer_name: formattedCategoryDetail.name,
        assigned_user_detail: assignedUserDetail,
      };
      const document = new this.followupModel(saveObj);
      const insert = await document.save();
      if (!insert || !insert._id) {
        return this.res.error(HttpStatus.BAD_REQUEST, 'ERROR.BAD_REQ');
      }
      if (insert) {
        if (
          req['user']['login_type_id'] === global.LOGIN_TYPE_ID['FIELD_USER']
        ) {
          const data = {
            working_activity_type: WorkingActivityType.FOLLOW_UP_CREATE,
            working_activity_id: insert._id,
            display_name: formattedCategoryDetail.name,
          };
          this.sharedUserService.saveUserWorkingActivity(req, data);
        }
      }
      return this.res.success('SUCCESS.CREATE', { inserted_id: insert._id });
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

      await this.followupModel.updateOne({ _id: params._id }, updateObj);
      return this.res.success('SUCCESS.UPDATE');
    } catch (error) {
      return this.res.error(HttpStatus.BAD_REQUEST, 'ERROR.BAD_REQ', error);
    }
  }

  async read(req: Request, params: any): Promise<any> {
    try {
      const userId = req['user']['_id'];
      const orgId = req['user']['org_id'];

      let activityDateRaw = new Date().toISOString().slice(0, 10);
      const activityDate = new Date(activityDateRaw);
      const { start, end } = convertToUtcRange(activityDate);

      // const { start, end } = convertToUtcRange(new Date());

      let match: Record<string, any> = {
        is_delete: 0,
        org_id: orgId,
        $or: [{ assigned_to_user_id: userId }, { created_id: userId }],
      };

      if (params?.activeTab) {
        const activeTab = params.activeTab;
        if (activeTab === global.FOLLOWUP_TAB[1]) {
          match.status = global.FOLLOWUP_TAB[1];
          match.followup_date = { $lt: end };
        } else if (activeTab === global.FOLLOWUP_TAB[2]) {
          match.status = { $ne: global.FOLLOWUP_TAB[3] };
          match.followup_date = { $gt: end };
        } else if (activeTab === global.FOLLOWUP_TAB[3]) {
          match.status = global.FOLLOWUP_TAB[3];
          match.followup_date = { $gte: start, $lte: end };
        }
      } else {
        match.followup_date = { $gte: start, $lte: end };
      }

      if (params?.filters?.search) {
        const fieldsToSearch = [
          'followup_type',
          'category_type',
          'remark',
          'status',
        ];
        const searchQuery = appCommonFilters(params.filters, fieldsToSearch);
        match = { ...match, ...searchQuery };
      }

      const page: number = params?.page || global.PAGE;
      const limit: number = params?.limit || global.LIMIT;
      const skip: number = (page - 1) * limit;

      const sorting =
        params?.sorting &&
        typeof params.sorting === 'object' &&
        Object.keys(params.sorting).length
          ? params.sorting
          : { _id: -1 };

      const pipeline = [
        { $match: match },
        { $sort: sorting },
        { $project: { created_unix_time: 0 } },
      ];

      const totalCompleted = await this.followupModel.countDocuments({
        ...match,
        status: global.FOLLOWUP_TAB[3],
        followup_date: { $gte: start, $lte: end },
      });

      const totalPending = await this.followupModel.countDocuments({
        ...match,
        status: global.FOLLOWUP_TAB[1],
        followup_date: { $lt: end },
      });

      const totalUpcoming = await this.followupModel.countDocuments({
        ...match,
        status: { $ne: global.FOLLOWUP_TAB[3] },
        followup_date: { $gt: end },
      });

      const totalCountData = await this.followupModel.aggregate([
        ...pipeline,
        { $count: 'totalCount' },
      ]);

      const total: number =
        totalCountData.length > 0 ? totalCountData[0].totalCount : 0;
      const result = await this.followupModel.aggregate([
        ...pipeline,
        { $skip: skip },
        { $limit: limit },
      ]);

      const Data: any = {
        result,
        totalCompleted,
        totalPending,
        totalUpcoming,
      };
      return this.res.pagination(Data, total, page, limit);
    } catch (error) {
      return this.res.error(
        HttpStatus.BAD_REQUEST,
        'ERROR.BAD_REQ',
        error.message,
      );
    }
  }

  async detail(req: Request, params: any): Promise<any> {
    try {
      const exist = await this.followupModel
        .findOne({ _id: params._id })
        .exec();
      if (!exist)
        return this.res.error(HttpStatus.BAD_REQUEST, 'WARNING.NOT_EXIST');

      let match: Record<string, any> = {
        is_delete: 0,
        org_id: req['user']['org_id'],
        _id: params._id,
      };

      let result = await this.followupModel.findOne(match).lean();
      if (!result) return this.res.success('SUCCESS.FETCH', result);
      return this.res.success('SUCCESS.FETCH', result);
    } catch (error) {
      return this.res.error(HttpStatus.BAD_REQUEST, 'ERROR.BAD_REQ', error);
    }
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

      await this.followupModel.updateOne({ _id: params._id }, updateObj);
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
      await this.followupModel.updateOne({ _id: params._id }, updateObj);
      return this.res.success('SUCCESS.STATUS_UPDATE');
    } catch (error) {
      return this.res.error(HttpStatus.BAD_REQUEST, 'ERROR.BAD_REQ', error);
    }
  }

  async userAssign(req: Request, params: any): Promise<any> {
    try {
      const exist = await this.followupModel
        .findOne({ _id: params._id })
        .exec();
      if (!exist)
        return this.res.error(HttpStatus.BAD_REQUEST, 'WARNING.NOT_EXIST');

      params.assigned_to_user_id = toObjectId(params.assigned_to_user_id);
      params.assigned_date = new Date();

      const updateObj: Record<string, any> = {
        ...req['updateObj'],
        ...params,
      };

      await this.followupModel.updateOne({ _id: params._id }, updateObj);

      return this.res.success('ENQUIRY.USR_ASSIGNED');
    } catch (error) {
      return this.res.error(HttpStatus.BAD_REQUEST, 'ERROR.BAD_REQ', error);
    }
  }

  async followupForList(req: Request, params: any): Promise<any> {
    try {
      let match: Record<string, any>;

      let result: Record<string, any>[];
      if (params.type == 'Site') {
        match = {
          is_delete: 0,
          org_id: req['user']['org_id'],
          $or: [
            { assigned_to_user_id: req['user']['_id'] },
            { created_id: req['user']['_id'] },
          ],
        };

        result = await this.sitesModel
          .find(match, { _id: 1, site_name: 1, mobile: 1 })
          .lean();
        result = result.map((row: any) => {
          return {
            label: row.site_name + ' - ' + row.mobile,
            value: row._id,
          };
        });
      } else if (params.type == 'Enquiry') {
        match = {
          is_delete: 0,
          org_id: req['user']['org_id'],
          $or: [
            { assigned_to_user_id: req['user']['_id'] },
            { created_id: req['user']['_id'] },
          ],
        };

        result = await this.enquiryModel
          .find(match, { _id: 1, name: 1, mobile: 1 })
          .lean();
        result = result.map((row: any) => {
          return {
            label: row.name + ' - ' + row.mobile,
            value: row._id,
          };
        });
      } else if (params.type == 'Customer') {
        const match = {
          is_delete: 0,
          org_id: req['user']['org_id'],
          user_id: req['user']['_id'],
        };

        const mappings = await this.userToCustomerMappingModel
          .find(match, { customer_id: 1 })
          .lean();
        const customerIds = mappings.map((m) => m.customer_id);

        const customers = await this.customerModel
          .find(
            {
              _id: { $in: customerIds },
              is_delete: 0,
            },
            {
              customer_name: 1,
              customer_type_name: 1,
              mobile: 1,
            },
          )
          .lean();

        result = customers.map((customer) => ({
          label: `${customer.customer_name} - ${customer.customer_type_name} - ${customer.mobile}`,
          value: customer._id,
        }));
      } else {
        result = [];
      }
      return this.res.success('SUCCESS.FETCH', result);
    } catch (error) {
      return this.res.error(HttpStatus.BAD_REQUEST, 'ERROR.BAD_REQ', error);
    }
  }

  async assignUserList(req: Request, params: any): Promise<any> {
    try {
      let match: Record<string, any>;
      let result: Record<string, any>[];
      match = {
        is_delete: 0,
        org_id: req['user']['org_id'],
        parent_user_id: req['user']['_id'],
      };

      result = await this.userHierarchyModel
        .find(match, { child_user_id: 1, child_user_name: 1 })
        .lean();
      result = result.map((row: any) => {
        return {
          label: row.child_user_name,
          value: row.child_user_id,
        };
      });
      return this.res.success('SUCCESS.FETCH', result);
    } catch (error) {
      return this.res.error(
        HttpStatus.BAD_REQUEST,
        'ERROR.BAD_REQ',
        error.message,
      );
    }
  }
}
