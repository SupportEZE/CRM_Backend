import { HttpStatus, Injectable } from '@nestjs/common';
import { CustomerStrategy } from '../../customer-strategy.interface';
import { commonFilters, toObjectId } from 'src/common/utils/common.utils';
import { DropdownService } from 'src/modules/master/dropdown/web/dropdown.service';
import { OzoneProspectStageModel } from '../../default/models/ozone-customer-stage.model';
import { Model } from 'mongoose';
import { InjectModel } from '@nestjs/mongoose';
import { ResponseService } from 'src/services/response.service';
import { CustomerModel } from '../../default/models/customer.model';
import { SharedCustomerService } from '../../shared-customer.service';
import { LoginTypeModel } from 'src/modules/master/rbac/models/login-type.model';
import { SharedUserService } from 'src/modules/master/user/shared-user.service';
import { GlobalService } from 'src/shared/global/global.service';
import { SharedActivityService } from 'src/modules/sfa/activity/shared-activity.service';
import { LedgerService } from 'src/modules/loyalty/ledger/web/ledger.service';
import { NotificationService } from 'src/shared/rpc/notification.service';
import { ReferralBonusModel } from 'src/modules/master/referral-bonus/models/referral-bonus.model';
import { UserModel } from 'src/modules/master/user/models/user.model';
import { Lts } from 'src/shared/translate/translate.service';
import { CustomerBankDetailModel } from '../../default/models/customer-bank-detail.model';
import { FollowupService } from 'src/modules/sfa/followup/web/followup.service';
import { CentralDynamicModelResolver } from 'src/common/resolvers/dynamic-model.resolver';
import { DB_NAMES } from 'src/config/db.constant';

@Injectable()
export class OzoneCustomerService implements CustomerStrategy {
  constructor(
    @InjectModel(OzoneProspectStageModel.name)
    private prospectStageModel: Model<OzoneProspectStageModel>,
    @InjectModel(CustomerModel.name)
    private customerModel: Model<CustomerModel>,
    @InjectModel(LoginTypeModel.name)
    private loginTypeModel: Model<LoginTypeModel>,
    @InjectModel(ReferralBonusModel.name)
    private referralBonusModel: Model<ReferralBonusModel>,
    @InjectModel(UserModel.name) private userModel: Model<UserModel>,
    @InjectModel(CustomerBankDetailModel.name)
    private customerBankDetailModel: Model<CustomerBankDetailModel>,
    private readonly dropdownService: DropdownService,
    private readonly res: ResponseService,
    private readonly sharedCustomerService: SharedCustomerService,
    private readonly sharedUserService: SharedUserService,
    private readonly globalService: GlobalService,
    private readonly sharedActivityService: SharedActivityService,
    private readonly ledgerService: LedgerService,
    private readonly notificationService: NotificationService,
    private readonly lts: Lts,
    private readonly followupService: FollowupService,
    private readonly dynamicModelResolver: CentralDynamicModelResolver,
  ) {}

  async read(req: Request, params: any): Promise<any> {
    try {
      const loginTypeId = params.login_type_id;
      const userId = req['user']['_id'];
      let match: Record<string, any> = {
        is_delete: 0,
        org_id: req['user']['org_id'],
        login_type_id: params.login_type_id,
        customer_type_id: toObjectId(params.customer_type_id),
      };

      const isProspect = loginTypeId === global.LOGIN_TYPE_ID['OB_PROSPECT'];

      if (isProspect && req?.url.includes(global.MODULE_ROUTES[27])) {
        match.created_id = userId;
      } else if (
        global.LOGIN_TYPE_ID_PERMISSION?.includes(req['user']['login_type_id'])
      ) {
        const userIds = await this.sharedUserService.getUsersIds(req, params);
        params.user_ids = userIds;
        const customerIds: any =
          await this.sharedCustomerService.getCustomersIdsByUserId(req, params);

        match.$or = [
          { created_id: { $in: userIds } },
          { _id: { $in: customerIds } },
        ];
      }

      const groupField = [
        global.LOGIN_TYPE_ID['INFLUENCER'],
        global.LOGIN_TYPE_ID['OB_PROSPECT'],
      ].includes(params.login_type_id)
        ? 'status'
        : 'status';
      if (params?.active_tab) {
        match[groupField] = params.active_tab;
      }

      const projection: Record<string, any> = {
        created_unix_time: 0,
        is_delete: 0,
      };

      let sorting: Record<string, 1 | -1> = { _id: -1 };
      if (params?.sorting && Object.keys(params.sorting).length !== 0) {
        sorting = params.sorting;
      }

      const filters: Record<string, any> = commonFilters(params.filters);
      Object.assign(match, filters);

      const page: number = params?.page || global.PAGE;
      const limit: number = params?.limit || global.LIMIT;
      const skip: number = (page - 1) * limit;

      const pipeline: any[] = [
        // {
        //   $addFields: {
        //     pincode: { $toString: '$pincode' },
        //   },
        // },
        { $match: match },
        { $project: projection },
        { $sort: sorting },
      ];

      const totalCountData: Record<string, any>[] =
        await this.customerModel.aggregate([
          ...pipeline,
          { $count: 'totalCount' },
        ]);

      const total: number =
        totalCountData.length > 0 ? totalCountData[0].totalCount : 0;

      console.log('Customer data query is here');

      let result: Record<string, any>[] = await this.customerModel.aggregate([
        ...pipeline,
        { $skip: skip },
        { $limit: limit },
      ]);

      const model = await this.dynamicModelResolver.getModel(
        'loginType',
        params,
        req,
      );

      let countCondition: Record<string, any> = {
        is_delete: 0,
        login_type_id: params.login_type_id,
      };

      console.log('This is for the profile status made');

      const profileStatus: any = await model
        .findOne(countCondition, {
          login_type_name: 1,
          customer_type_name: 1,
          profile_status: 1,
        })
        .lean();

      console.log('📄 Sample data in collection:', profileStatus);

      countCondition.org_id = req['user']['org_id'];

      if (isProspect && req?.url.includes(global.MODULE_ROUTES[27])) {
        countCondition.created_id = userId;
      } else if (
        global.LOGIN_TYPE_ID_PERMISSION?.includes(req['user']['login_type_id'])
      ) {
        const userIds = await this.sharedUserService.getUsersIds(req, params);
        params.user_ids = userIds;
        const customerIds =
          await this.sharedCustomerService.getCustomersIdsByUserId(req, params);

        countCondition.$or = [
          { created_id: { $in: userIds } },
          { _id: { $in: customerIds } },
        ];
      }

      countCondition.customer_type_id = toObjectId(params.customer_type_id);
      const statusCounts = await this.customerModel.aggregate([
        { $match: countCondition },
        {
          $group: {
            _id: `$${groupField}`,
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

      result = await Promise.all(
        result.map(async (item: any) => {
          const idParams = {
            ...params,
            customer_id: item._id,
          };

          const assignedUsers: Record<string, any>[] =
            await this.sharedCustomerService.getUserToCustomerMapping(
              req,
              idParams,
            );
          item.assigned_user = assignedUsers
            .map((a: any) => a.user_name)
            .join(', ');

          const assignedCustomers: Record<string, any>[] =
            await this.sharedCustomerService.getCustomerAssigning(
              req,
              idParams,
            );
          item.assigned_customer = assignedCustomers
            .map((a: any) => a.label)
            .join(', ');

          item.user_platform = item.device_info?.system_name || '';

          const lastVisit: Record<string, any>[] =
            await this.sharedActivityService.customerLastVisit(req, params);
          const lastOrder: Record<string, any>[] =
            await this.globalService.customerLastOrder(req, params);

          item.last_visit = lastVisit[0] || '';
          item.last_order = lastOrder[0] || '';

          return item;
        }),
      );

      const data: any = {
        result,
        profile_status_tabs: profileStatusTabs,
      };
      return this.res.pagination(data, total, page, limit);
    } catch (error) {
      return this.res.error(HttpStatus.BAD_REQUEST, 'ERROR.BAD_REQ', error);
    }
  }

  async updateCustomerStage(req: Request, params: any): Promise<any> {
    try {
      const orgId: number = req['user']['org_id'];
      const customerId = toObjectId(params._id);
      const currentStageLabel = params.status;

      params.module_id = global.MODULES['Customers'];
      params.dropdown_name = global.DROPDOWNS[6];
      params.internalCall = true;

      const stageList = (
        await this.dropdownService.readDropdown(req, params)
      ).map((stage, index) => ({ ...stage, sequence: index + 1 }));

      const currentStage = stageList.find(
        (stage) => stage.label === currentStageLabel,
      );
      if (!currentStage) {
        return this.res.error(HttpStatus.BAD_REQUEST, 'INVALID.STAGE');
      }
      const previousStages = stageList.filter(
        (stage) => stage.sequence < currentStage.sequence,
      );
      for (const prevStage of previousStages) {
        const prevMatch = {
          is_delete: 0,
          org_id: orgId,
          customer_id: customerId,
          stage: prevStage.label,
        };

        const exists = await this.prospectStageModel.findOne(prevMatch).lean();
        if (!exists) {
          await new this.prospectStageModel({
            ...req['createObj'],
            customer_id: customerId,
            org_id: orgId,
            stage: prevStage.label,
            checked: true,
          }).save();
        }
      }

      const currentMatch = {
        is_delete: 0,
        org_id: orgId,
        customer_id: customerId,
        stage: currentStageLabel,
      };

      const existingCurrent =
        await this.prospectStageModel.findOne(currentMatch);
      if (existingCurrent) {
        await this.prospectStageModel.updateOne(
          { _id: existingCurrent._id },
          { ...req['updateObj'], checked: true },
        );
      } else {
        await new this.prospectStageModel({
          ...req['createObj'],
          customer_id: customerId,
          org_id: orgId,
          stage: currentStageLabel,
          checked: true,
        }).save();
      }

      await this.customerModel.updateOne(
        { _id: customerId },
        { ...req['updateObj'], profile_status: currentStageLabel },
      );
      return this.res.success('SUCCESS.STATUS_UPDATE');
    } catch (error) {
      return this.res.error(HttpStatus.BAD_REQUEST, 'ERROR.BAD_REQ', error);
    }
  }

  async update(req: Request, params: any): Promise<any> {
    try {
      const existingCustomer: any = await this.customerModel
        .findOne({ _id: params._id })
        .exec();

      if (!existingCustomer) {
        return this.res.error(HttpStatus.BAD_REQUEST, 'CUSTOMER.NOT_EXIST');
      }

      const updateObj: Record<string, any> = {
        ...req['updateObj'],
        ...params,
      };

      await this.customerModel.updateOne({ _id: params._id }, updateObj);

      if (params.followup_creation === 'Yes') {
        params.category_id = existingCustomer._id;
        params.category_type = 'Customer';

        await this.followupService.create(req, params);
      }

      return this.res.success('SUCCESS.UPDATE');
    } catch (error) {
      console.error('Update Error:', error);
      return this.res.error(
        HttpStatus.BAD_REQUEST,
        'ERROR.BAD_REQ',
        error?.message || error,
      );
    }
  }
}
