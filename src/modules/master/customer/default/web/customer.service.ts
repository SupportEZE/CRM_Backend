import { forwardRef, HttpStatus, Inject, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { ResponseService } from 'src/services/response.service';
import { Lts } from 'src/shared/translate/translate.service';
import { commonFilters, toObjectId, tat, } from 'src/common/utils/common.utils';
import { CustomerModel, CustomerSource, PrimaryProfileStatus, OzoneOBprospectStatus, } from '../models/customer.model';
import { ReferralBonusModel } from '../../../referral-bonus/models/referral-bonus.model';
import { LedgerService } from 'src/modules/loyalty/ledger/web/ledger.service';
import { UserModel } from '../../../user/models/user.model';
import { CustomerBankDetailModel } from '../models/customer-bank-detail.model';
import { CustomerContactPersonModel } from '../models/customer-contact-person.model';
import { CustomerMarkaModel } from '../models/customer-marka.model';
import { CustomerDocsModel } from '../models/customer-docs.model';
import { CustomerOtherDetailModel } from '../models/customer-other-detail.model';
import { CustomerShopGalleryModel } from '../models/customer-shop-gallery.model';
import { CustomerTypeModel } from '../../../customer-type/models/customer-type.model';
import { UserToCustomerMappingModel } from '../models/user-to-customer-mapping.model';
import { CustomerToCustomerMappingModel } from '../models/customer-to-customer-mapping.dto';
import { CustomerShippingAddressModel } from '../models/customer-shipping-address.model';
import {
  CustomerKycDetailModel,
  KycStatusEnum,
} from '../models/customer-kyc-details.model';
import { CryptoService } from 'src/services/crypto.service';
import { LoginTypeModel } from '../../../rbac/models/login-type.model';
import { NotificationService } from 'src/shared/rpc/notification.service';
import { S3Service } from 'src/shared/rpc/s3.service';
import { SharedCustomerService } from '../../shared-customer.service';
import { SharedUserService } from '../../../user/shared-user.service';
import { GlobalService } from 'src/shared/global/global.service';
import { SharedActivityService } from 'src/modules/sfa/activity/shared-activity.service';
import { GlobalAchievementService } from 'src/shared/global/achievement.service';
import { nextSeq } from 'src/common/utils/common.utils';
import { OzoneProspectStageModel } from '../models/ozone-customer-stage.model';
import { DropdownService } from 'src/modules/master/dropdown/web/dropdown.service';
import { CommentService } from 'src/modules/sfa/comment/web/comment.service';
@Injectable()
export class CustomerService {
  constructor(
    @InjectModel(CustomerModel.name)
    private customerModel: Model<CustomerModel>,
    @InjectModel(UserModel.name) private userModel: Model<UserModel>,
    @InjectModel(CustomerBankDetailModel.name)
    private customerBankDetailModel: Model<CustomerBankDetailModel>,
    @InjectModel(CustomerContactPersonModel.name)
    private customerContactPersonModel: Model<CustomerContactPersonModel>,
    @InjectModel(CustomerMarkaModel.name)
    private customerMarkaModel: Model<CustomerMarkaModel>,
    @InjectModel(CustomerDocsModel.name)
    private customerDocsModel: Model<CustomerDocsModel>,
    @InjectModel(CustomerOtherDetailModel.name)
    private customerOtherDetailModel: Model<CustomerOtherDetailModel>,
    @InjectModel(CustomerShopGalleryModel.name)
    private customerShopGalleryModel: Model<CustomerShopGalleryModel>,
    @InjectModel(CustomerTypeModel.name)
    private customerTypeModel: Model<CustomerTypeModel>,
    @InjectModel(UserToCustomerMappingModel.name)
    private userToCustomerMappingModel: Model<UserToCustomerMappingModel>,
    @InjectModel(CustomerToCustomerMappingModel.name)
    private customerToCustomerMappingModel: Model<CustomerToCustomerMappingModel>,
    @InjectModel(CustomerShippingAddressModel.name)
    private customerShippingAddressModel: Model<CustomerShippingAddressModel>,
    @InjectModel(CustomerKycDetailModel.name)
    private customerKycDetailModel: Model<CustomerKycDetailModel>,
    @InjectModel(ReferralBonusModel.name)
    private referralBonusModel: Model<ReferralBonusModel>,
    @InjectModel(LoginTypeModel.name)
    private loginTypeModel: Model<LoginTypeModel>,
    @InjectModel(OzoneProspectStageModel.name)
    private prospectStageModel: Model<OzoneProspectStageModel>,

    private readonly res: ResponseService,
    private readonly s3Service: S3Service,
    private readonly lts: Lts,
    private readonly cryptoService: CryptoService,
    private readonly ledgerService: LedgerService,
    private readonly notificationService: NotificationService,
    private readonly globalService: GlobalService,
    @Inject(forwardRef(() => SharedCustomerService))
    private readonly sharedCustomerService: SharedCustomerService,
    private readonly sharedUserService: SharedUserService,
    private readonly sharedActivityService: SharedActivityService,
    private readonly globalAchievementService: GlobalAchievementService,
    private readonly dropdownService: DropdownService,
    private readonly commentService: CommentService,
  ) { }

  async create(req: Request, params: any): Promise<any> {
    try {
      params.duplicacyCheck = true;
      let exist: Record<string, any> = await this.duplicate(
        req,
        params,
        req['user']['org_id'],
      );
      if (exist.status)
        return this.res.error(HttpStatus.BAD_REQUEST, exist.message);

      exist = await this.identifier(req, params);
      if (!exist?.status) return exist;

      const profileStatus: any = await this.loginTypeModel
        .findOne(
          { is_delete: 0, login_type_id: exist.customerTypeData.login_type_id },
          { login_type_name: 1, profile_status: 1 },
        )
        .lean();

      if (
        !Array.isArray(profileStatus?.profile_status) ||
        profileStatus.profile_status.length === 0
      ) {
        return this.res.error(
          HttpStatus.BAD_REQUEST,
          'ERROR.BAD_REQ',
          'Profile status not found',
        );
      }

      let addonFields: Record<string, any> = {
        login_type_id: exist.customerTypeData.login_type_id,
        login_type_name: exist.customerTypeData.login_type_name,
        customer_type_id: exist.customerTypeData._id,
        profile_status: profileStatus.profile_status
          ? profileStatus?.profile_status[0]
          : '',
      };

      if (
        exist.customerTypeData.login_type_id ===
        global.LOGIN_TYPE_ID['OB_PROSPECT']
      ) {
        addonFields.profile_status = OzoneOBprospectStatus.PROSPECT;
      }

      params.status = params?.source === CustomerSource.COMPLAINT ? 'Pending' : global.STATUS[1];
      params.org_id = req['user']['org_id'];

      const saveObj: Record<string, any> = {
        ...req['createObj'],
        ...params,
        ...addonFields,
        identifier: exist.identifier,
        identifier_number: exist.identifierNumber,
      };
      const loginTypeId = exist.customerTypeData.login_type_id;

      if (loginTypeId === global.LOGIN_TYPE_ID['OB_PROSPECT']) {
        const yearSuffix = new Date().getFullYear().toString().slice(-2);
        const codePrefix = `OBPR-${yearSuffix}`;
        const customerCode = await nextSeq(req, {
          modelName: this.customerModel,
          idKey: 'customer_code',
          prefix: codePrefix,
        });

        if (!customerCode) {
          throw new Error('Customer code generation failed');
        }
        saveObj.customer_code = customerCode;
      }

      if (loginTypeId === global.LOGIN_TYPE_ID['INFLUENCER']) {
        const influencerId = await nextSeq(req, {
          modelName: this.customerModel,
          idKey: 'influencer_id',
          prefix: 'INF',
        });
        saveObj.influencer_id = influencerId;

        const referralData = await this.generateRefferalCode(req, params);
        saveObj.referral_code = referralData?.referral_code;
        saveObj.profile_status = global.APPROVAL_STATUS[1];
      } else {
        saveObj.profile_status = global.APPROVAL_STATUS[0];
      }

      if (params?.source === CustomerSource.VISIT) {
        saveObj.profile_status = PrimaryProfileStatus.LEAD;
      }

      const document = new this.customerModel(saveObj);
      const insert = await document.save();

      if (params?.source === CustomerSource.VISIT) {
        params.customer_id = insert._id;

        this.saveOtherInfo(req, params);
        this.sharedCustomerService.assignCustomerByVisit(req, params);

        return { inserted_id: insert._id };
      }

      if (!params.skipKyc && params?.source !== CustomerSource.COMPLAINT) {
        await this.saveKycStatus(req, {
          ...params,
          customer_id: insert._id,
        });
      }

      if (loginTypeId === global.LOGIN_TYPE_ID['INFLUENCER'] && insert?._id) {
        params._id = insert._id;
        params.login_type_id = loginTypeId
        await this.sendWelcomePointsToInfluencer(req, params);
      }

      return this.res.success('SUCCESS.CREATE', { inserted_id: insert._id });
    } catch (error) {
      return this.res.error(
        HttpStatus.BAD_REQUEST,
        'ERROR.BAD_REQ',
        error.message,
      );
    }
  }

  async sendWelcomePointsToInfluencer(req: any, params: any): Promise<any> {
    try {
      const referralBonus = await this.referralBonusModel.findOne({
        customer_type_id: String(params.customer_type_id),
        is_delete: 0,
        bonus_type: global.BONUS_TYPES[1],
        org_id: req['user']['org_id'],
      }).lean();

      if (referralBonus?.bonus_point) {
        const ledgerParams = {
          customer_id: params._id,
          customer_name: params.customer_name,
          login_type_id: params.login_type_id,
          customer_type_id: params.customer_type_id,
          transaction_type: global.TRANSACTION_TYPE[0],
          points: referralBonus.bonus_point,
          remark: `${referralBonus.bonus_point} Point credited against welcome bonus.`,
          transaction_id: params.id,
          creation_type: global.CREATION_TYPE[9],
        };
        await this.ledgerService.create(req, ledgerParams);
        await this.customerModel.updateOne({ _id: params._id }, { welcome_point: true });
      }
    } catch (error) {
      return this.res.error(HttpStatus.BAD_REQUEST, 'ERROR.BAD_REQ', error);
    }
  }

  async generateRefferalCode(req: Request, params: any): Promise<any> {
    try {
      const orgName: string = req['user']?.['org']?.['org_name'] || '';
      const mobileNo: string = params?.mobile || '';

      const prefix = orgName.substring(0, 2).toUpperCase();
      const referralCode = `${prefix}-${mobileNo}`;

      return { referral_code: referralCode };
    } catch (error) {
      console.error('Error generating referral code:', error);
      throw new Error('Failed to generate referral code');
    }
  }

  async update(req: Request, params: any): Promise<any> {
    try {
      params.duplicacyCheck = true;

      const ids = Array.isArray(params._id) ? params._id.map(toObjectId) : [toObjectId(params._id)];

      const existingCustomers = await this.customerModel
        .find({ _id: { $in: ids } })
        .exec();

      if (!existingCustomers || existingCustomers.length !== ids.length) {
        return this.res.error(HttpStatus.BAD_REQUEST, 'CUSTOMER.NOT_EXIST');
      }

      if (!params?.is_delete && !params?.profile_status) {
        const duplicateCheckResult = await this.duplicate(req, params);
        if (duplicateCheckResult?.profile_status) {
          return this.res.error(HttpStatus.BAD_REQUEST, duplicateCheckResult.message);
        }
      }

      const updateObj: Record<string, any> = {
        ...req['updateObj'],
        ...params,
      };
      delete updateObj._id;

      await this.customerModel.updateMany({ _id: { $in: ids } }, { $set: updateObj });

      if (params?.is_delete) {
        return this.res.success('SUCCESS.DELETE');
      }

      const approvalStatus = params?.profile_status;
      const approvedStatus = global.APPROVAL_STATUS[1];

      for (const customer of existingCustomers) {
        if (approvalStatus === approvedStatus && !customer.welcome_point) {
          const referralBonus = await this.referralBonusModel.findOne({
            customer_type_id: String(customer.customer_type_id),
            is_delete: 0,
            bonus_type: global.BONUS_TYPES[1],
            org_id: req['user']['org_id'],
          }).lean();

          if (referralBonus?.bonus_point) {
            const ledgerParams = {
              customer_id: customer._id,
              customer_name: customer.customer_name,
              login_type_id: customer.login_type_id,
              customer_type_id: customer.customer_type_id,
              transaction_type: global.TRANSACTION_TYPE[0],
              points: referralBonus.bonus_point,
              remark: `${referralBonus.bonus_point} Point credited against welcome bonus.`,
              transaction_id: customer.id,
              creation_type: global.CREATION_TYPE[9],
            };
            await this.ledgerService.create(req, ledgerParams);
            await this.customerModel.updateOne({ _id: customer._id }, { welcome_point: true });
          }

          const referralCode = customer?.form_data?.referral_code;
          if (referralCode) {
            const referrer = await this.customerModel.findOne({
              'form_data.invitation_code': referralCode,
            }).exec();

            if (referrer?._id) {
              const inviteBonus = await this.referralBonusModel.findOne({
                customer_type_id: referrer.customer_type_id,
                is_delete: 0,
                bonus_type: global.BONUS_TYPES[4],
                org_id: req['user']['org_id'],
              }).lean();

              if (inviteBonus?.bonus_point) {
                const ledgerParams = {
                  customer_id: referrer._id,
                  customer_name: referrer.customer_name,
                  login_type_id: referrer.login_type_id,
                  customer_type_id: referrer.customer_type_id,
                  transaction_type: global.TRANSACTION_TYPE[0],
                  points: inviteBonus.bonus_point,
                  remark: `${inviteBonus.bonus_point} Point credited against referral bonus.`,
                  transaction_id: referrer.id,
                  creation_type: global.CREATION_TYPE[9],
                };
                await this.ledgerService.create(req, ledgerParams);
              }
            }
          }
        }
      }

      params.template_id = approvalStatus === approvedStatus ? 3 : 4;

      params.account_ids = existingCustomers.map((c: any) => ({
        account_ids: c._id,
        login_type_id: c.login_type_id,
      }));

      params.variables = { status: approvalStatus };
      params.push_notify = true;
      params.in_app = true;

      await this.notificationService.notify(req, params);
      return this.res.success('SUCCESS.UPDATE');
    } catch (error) {
      return this.res.error(HttpStatus.BAD_REQUEST, 'ERROR.BAD_REQ', error);
    }
  }


  async read(req: Request, params: any): Promise<any> {
    try {
      let match: Record<string, any> = {
        is_delete: 0,
        org_id: req['user']['org_id'],
        login_type_id: params.login_type_id,
        customer_type_id: toObjectId(params.customer_type_id),
      };

      if (
        global.LOGIN_TYPE_ID_PERMISSION?.includes(req['user']['login_type_id'])
      ) {
        const userIds = await this.sharedUserService.getUsersIds(req, params);
        params.user_ids = userIds;
        match.created_id = { $in: userIds };
        params.customer_type_id = match.customer_type_id;
        const customerIds =
          await this.sharedCustomerService.getCustomersIdsByUserId(req, params);
        match._id = { $in: customerIds };
      }

      const groupField =
        params.login_type_id == global.LOGIN_TYPE_ID['INFLUENCER']
          ? 'profile_status'
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
        {
          $addFields: {
            pincode: { $toString: '$pincode' },
          },
        },
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

      let result: Record<string, any>[] = await this.customerModel.aggregate([
        ...pipeline,
        { $skip: skip },
        { $limit: limit },
      ]);

      let countCondition: Record<string, any> = {
        is_delete: 0,
        login_type_id: params.login_type_id,
      };

      const profileStatus: any = await this.loginTypeModel
        .findOne(countCondition, {
          login_type_name: 1,
          customer_type_name: 1,
          profile_status: 1,
        })
        .lean();

      countCondition.org_id = req['user']['org_id'];

      if (
        global.LOGIN_TYPE_ID_PERMISSION?.includes(req['user']['login_type_id'])
      ) {
        const userIds = await this.sharedUserService.getUsersIds(req, params);
        params.user_ids = userIds;
        countCondition.created_id = { $in: userIds };
        const customerIds =
          await this.sharedCustomerService.getCustomersIdsByUserId(req, params);
        countCondition._id = { $in: customerIds };
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
            await this.sharedCustomerService.getUserToCustomerMapping(req, idParams);
          item.assigned_user = assignedUsers.map((a: any) => a.user_name).join(', ');

          const assignedCustomers: Record<string, any>[] =
            await this.sharedCustomerService.getCustomerAssigning(req, idParams);
          item.assigned_customer = assignedCustomers.map((a: any) => a.label).join(', ');

          item.user_platform = item.device_info?.system_name || '';

          const lastVisit: Record<string, any>[] =
            await this.sharedActivityService.customerLastVisit(req, idParams);
          const lastOrder: Record<string, any>[] =
            await this.globalService.customerLastOrder(req, idParams);

          item.last_visit = lastVisit[0] || '';
          item.last_order = lastOrder[0] || '';

          if (params.login_type_id === global.LOGIN_TYPE_ID['INFLUENCER']) {
            params.internalCall = true;
            item.current_wallet = await this.ledgerService.balance(idParams.customer_id);

            const commentsData: any = await this.commentService.fetchCustomerLatestComment(req, idParams);
            item.remark = commentsData?.comment || '';
          }
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

  async detail(req: Request, params: any): Promise<any> {
    try {
      let match: Record<string, any> = {
        is_delete: 0,
        org_id: req['user']['org_id'],
        _id: toObjectId(params._id),
      };

      const projection: Record<string, any> = {
        created_unix_time: 0,
        is_delete: 0,
        org_id: 0,
      };

      const result: Record<string, any> = await this.customerModel
        .findOne(match, projection)
        .lean();
      if (!result)
        return this.res.error(HttpStatus.BAD_REQUEST, 'CUSTOMER.NOT_EXIST');

      params.customer_id = result._id;

      if (result.login_type_id === global.LOGIN_TYPE_ID['OB_PROSPECT']) {
        params.module_id = global.MODULES['Customers'];
        params.dropdown_name = global.DROPDOWNS[6];
        params.internalCall = true;

        const stages = await this.dropdownService.readDropdown(req, params);
        delete params.internalCall;

        const existingStages = await this.prospectStageModel
          .find({
            customer_id: toObjectId(params._id),
            is_delete: 0,
          })
          .lean();

        result.stages = stages.map((row: any) => {
          const stageExist = existingStages.find((s) => s.stage === row.label);
          return {
            label: row.label,
            value: row.value,
            checked: stageExist ? !!stageExist.checked : false,
          };
        });
      }

      const BankDetail = await this.getBankDetail(req, params);
      const ContactPersonDetail =
        await this.sharedCustomerService.getContactPerson(req, params);
      const OtherDetail = await this.sharedCustomerService.getOtherDetail(
        req,
        params,
      );
      const marka = await this.sharedCustomerService.getMarkaDetail(
        req,
        params,
      );
      const allDocs = await this.sharedCustomerService.getDocument(
        toObjectId(params._id),
      );
      const profileDetail = allDocs.find(
        (doc) => doc.label?.toLowerCase() === global.FILES_LABEL[0],
      );
      const docDetail = allDocs.filter(
        (doc) => doc.label?.toLowerCase() !== global.FILES_LABEL[0],
      );
      const shippingAddress = await this.getShippingAddress(req, params);
      const userToCustomerMapping =
        await this.sharedCustomerService.getUserToCustomerMapping(req, params);
      const customerToCustomerMapping =
        await this.sharedCustomerService.getAssignCustomerMapping(req, params);
      const kycStatusDetail = await this.getKycStatus(req, params);
      const profileStatus = await this.loginTypeModel
        .findOne({ login_type_id: result.login_type_id }, { profile_status: 1 })
        .lean();

      params.login_type_id = result.login_type_id;
      const lastVisit = await this.sharedActivityService.customerLastVisit(
        req,
        params,
      );
      const lastOrder = await this.globalService.customerLastOrder(req, params);

      let primarySalesAchievement: Record<string, any> = {};
      let secondarySalesAchievement: Record<string, any> = {};

      const loginType = result.login_type_id;
      params.customer_ids = [params.customer_id];

      switch (loginType) {
        case global.LOGIN_TYPE_ID['PRIMARY']:
          [primarySalesAchievement, secondarySalesAchievement] =
            await Promise.all([
              this.globalAchievementService.getPrimarySaleAchievement(
                req,
                params,
              ),
              this.globalAchievementService.getSecondaryAchievement(
                req,
                params,
              ),
            ]);
          break;

        case global.LOGIN_TYPE_ID['SECONDARY']:
          secondarySalesAchievement =
            await this.globalAchievementService.getSecondaryAchievement(
              req,
              params,
            );
          break;

        case global.LOGIN_TYPE_ID['SUB_PRIMARY']:
          [primarySalesAchievement] = await Promise.all([
            this.globalAchievementService.getPrimarySaleAchievement(
              req,
              params,
            ),
          ]);
          break;
      }

      const assignedStates =
        await this.sharedCustomerService.fetchCustomerStateMapping(req, params);

      const data: Record<string, any> = {
        basic_detail: result,
        bank_detail: BankDetail,
        contact_person_detail: ContactPersonDetail,
        other_detail: OtherDetail,
        shop_gallery_detail: allDocs.filter(
          (row) => row.label === global.FILES_LABEL[1],
        ),
        doc_detail: docDetail,
        marka: marka,
        profile_detail: profileDetail,
        shipping_address: shippingAddress,
        customer_to_customer_mapping: customerToCustomerMapping,
        user_to_customer_mapping: userToCustomerMapping,
        kyc_status_detail: kycStatusDetail,
        profileStatus: profileStatus?.profile_status || [],
        last_visit: lastVisit[0] || '',
        last_order: lastOrder[0] || '',
        secondary_network_count: customerToCustomerMapping.length,
        primary_sales_achievement: primarySalesAchievement[0],
        secondary_sales_achievement: secondarySalesAchievement,
        assigned_state: assignedStates[0]?.state || [],
        assigned_district: assignedStates[0]?.district || [],
      };

      if (params?.internalCall) return data;
      return this.res.success('SUCCESS.FETCH', data);
    } catch (error) {
      return this.res.error(HttpStatus.BAD_REQUEST, 'ERROR.BAD_REQ', error);
    }
  }

  async duplicate(
    req: Request,
    params: any,
    orgId: number = null,
  ): Promise<any> {
    try {
      if (!orgId) orgId = req['user']['org_id'];
      let errorObject: any = {};
      let message: string = '';
      let response: any = {};

      if (params?.mobile) {
        const exist: any = await this.customerModel
          .findOne({ mobile: params.mobile, org_id: orgId })
          .exec();
        if (exist) {
          if (!params._id) errorObject['mobile'] = true;
          if (params._id && !toObjectId(params._id).equals(exist._id))
            errorObject['mobile'] = true;
        } else {
          const exist: any = await this.userModel
            .findOne({ mobile: params.mobile, org_id: orgId })
            .exec();
          if (exist) {
            if (!params._id) errorObject['mobile'] = true;
            if (params._id && !toObjectId(params._id).equals(exist._id))
              errorObject['mobile'] = true;
          }
        }
      }
      if (params?.upi_id) {
        const exist: any = await this.customerBankDetailModel
          .findOne({ upi_id: params.upi_id, org_id: orgId })
          .exec();

        if (exist) {
          if (!params._id) errorObject['upi_id'] = true;
          if (params._id && !toObjectId(params._id).equals(exist._id))
            errorObject['upi_id'] = true;
        }
      }
      if (params?.account_no) {
        const exist: any = await this.customerBankDetailModel
          .findOne({ account_no: params.account_no, org_id: orgId })
          .exec();
        if (exist) {
          if (!params._id) errorObject['account_number'] = true;
          if (params._id && !toObjectId(params._id).equals(exist._id))
            errorObject['account_number'] = true;
        }
      }

      if (params?.customer_code) {
        const exist: any = await this.customerModel
          .findOne({ customer_code: params.customer_code, org_id: orgId })
          .exec();
        if (exist) {
          if (!params._id) errorObject['customer_code'] = true;
          if (params._id && !toObjectId(params._id).equals(exist._id))
            errorObject['customer_code'] = true;
        }
      }
      if (Object.keys(errorObject).length !== 0) {
        const existingFields = Object.keys(errorObject).filter(
          (key) => errorObject[key],
        );
        const fieldNames: Record<string, string> = {
          mobile: await this.lts.t('CUSTOMER.MOBILE'),
          email: await this.lts.t('CUSTOMER.EMAIL'),
          upi_id: await this.lts.t('CUSTOMER.UPI_ID'),
          account_number: await this.lts.t('CUSTOMER.ACCOUNT_NUMBER'),
          customer_code: await this.lts.t('CUSTOMER.CUSTOMER_CODE'),
          doc_number: await this.lts.t('CUSTOMER.DOC_NUMBER'),
        };
        const EXIST = await this.lts.t('WARNING.EXIST');
        message =
          existingFields.map((key) => fieldNames[key]).join('/') + ' ' + EXIST;

        if (params?.duplicacyCheck)
          return (response = { status: true, message: message });
        else return this.res.error(HttpStatus.BAD_REQUEST, message);
      } else {
        if (params.duplicacyCheck) return (response = { status: false });
        else return this.res.success('WARNING.NO_DUPLICACY');
      }
    } catch (error) {
      return this.res.error(HttpStatus.BAD_REQUEST, 'ERROR.BAD_REQ');
    }
  }
  async getBankDetail(req: Request, params: any): Promise<any> {
    try {
      let match: Record<string, any> = {
        org_id: req['user']['org_id'],
        customer_id: params.customer_id,
        is_delete: 0,
      };
      let data: Record<string, any> = await this.customerBankDetailModel
        .findOne(match)
        .lean();
      return data;
    } catch (error) {
      return this.res.error(HttpStatus.BAD_REQUEST, 'ERROR.BAD_REQ', error);
    }
  }

  async getDocs(req: Request, params: any): Promise<any> {
    try {
      const allDocs: Record<string, any>[] =
        await this.sharedCustomerService.getDocument(
          toObjectId(params.customer_id),
        );
      const profileDetail: Record<string, any> = allDocs.find(
        (doc: any) => doc.label?.toLowerCase() === 'profile pic',
      );

      const docDetail: Record<string, any>[] = allDocs.filter(
        (doc: any) => doc.label?.toLowerCase() !== 'profile pic',
      );

      return { profileDetail, docDetail };
    } catch (error) {
      return this.res.error(HttpStatus.BAD_REQUEST, 'ERROR.BAD_REQ');
    }
  }
  async saveBankInfo(req: Request, params: any): Promise<any> {
    try {
      params.customer_id = toObjectId(params.customer_id);
      let match: Record<string, any>;
      match = {
        org_id: req['user']['org_id'],
        account_no: await this.cryptoService.encrypt(params.account_no),
      };
      let exist: Record<string, any> = await this.customerBankDetailModel
        .findOne(match)
        .lean();
      //  if(exist?.customer_id && !exist.customer_id.equals(toObjectId(params.customer_id))) {
      //   return this.res.error(HttpStatus.BAD_REQUEST, 'CUSTOMER.ACCOUNT_NUMBER_EXIST')
      //  }

      match = {
        org_id: req['user']['org_id'],
        customer_id: params.customer_id,
      };

      exist = await this.customerBankDetailModel.findOne(match).lean();
      if (exist) {
        const updateObj = {
          ...req['updateObj'],
          ...params,
        };
        await this.customerBankDetailModel.updateOne(
          { customer_id: toObjectId(params.customer_id) },
          updateObj,
        );
      } else {
        const saveObj = {
          ...req['createObj'],
          ...params,
        };

        const document = new this.customerBankDetailModel(saveObj);
        await document.save();
      }
      return this.res.success('SUCCESS.CREATE');
    } catch (error) {
      return this.res.error(HttpStatus.BAD_REQUEST, 'ERROR.BAD_REQ', error);
    }
  }
  async saveContactPersonInfo(req: Request, params: any): Promise<any> {
    try {
      let match: Record<string, any>;
      match = {
        org_id: req['user']['org_id'],
        contact_person_mobile: params.contact_person_mobile,
      };
      let exist: Record<string, any> = await this.customerContactPersonModel
        .findOne(match)
        .lean();
      if (exist)
        return this.res.error(HttpStatus.BAD_REQUEST, 'CUSTOMER.MOBILE_EXIST');
      params.customer_id = toObjectId(params.customer_id);
      const saveObj: Record<string, any> = {
        ...req['createObj'],
        ...params,
      };
      const document = new this.customerContactPersonModel(saveObj);
      await document.save();
      if (req.url.includes(global.MODULE_ROUTES[1])) return;
      return this.res.success('SUCCESS.CREATE');
    } catch (error) {
      if (req.url.includes(global.MODULE_ROUTES[1])) throw error;
      return this.res.error(HttpStatus.BAD_REQUEST, 'ERROR.BAD_REQ', error);
    }
  }
  async updateContactPersonInfo(req: Request, params: any): Promise<any> {
    try {
      let match: Record<string, any>;
      match = {
        org_id: req['user']['org_id'],
        _id: params._id,
      };
      let exist: Record<string, any> = await this.customerContactPersonModel
        .findOne(match)
        .lean();
      if (!exist)
        return this.res.error(HttpStatus.BAD_REQUEST, 'ERROR.NOT_FOUND');
      if (params.is_delete === exist.is_delete)
        return this.res.error(HttpStatus.BAD_REQUEST, 'WARNING.ALREADY_DELETE');

      const updateObj: Record<string, any> = {
        ...req['updateObj'],
        ...params,
      };
      await this.customerContactPersonModel.updateOne(
        { _id: params._id },
        updateObj,
      );
      if (params.is_delete) return this.res.success('SUCCESS.DELETE');
      return this.res.success('SUCCESS.UPDATE');
    } catch (error) {
      return this.res.error(HttpStatus.BAD_REQUEST, 'ERROR.BAD_REQ', error);
    }
  }

  async saveMarka(req: Request, params: any): Promise<any> {
    try {
      let match: Record<string, any>;
      match = {
        org_id: req['user']['org_id'],
        customer_id: toObjectId(params.customer_id),
        marka: params.marka,
      };

      let exist: Record<string, any> = await this.customerMarkaModel
        .findOne(match)
        .lean();
      if (exist)
        return this.res.error(HttpStatus.BAD_REQUEST, 'CUSTOMER.MARKA_EXIST');
      params.customer_id = toObjectId(params.customer_id);
      const saveObj: Record<string, any> = {
        ...req['createObj'],
        ...params,
      };
      const document = new this.customerMarkaModel(saveObj);
      await document.save();
      return this.res.success('SUCCESS.CREATE');
    } catch (error) {
      return this.res.error(HttpStatus.BAD_REQUEST, 'ERROR.BAD_REQ', error);
    }
  }
  async updateMarka(req: Request, params: any): Promise<any> {
    try {
      let match: Record<string, any>;
      match = {
        org_id: req['user']['org_id'],
        _id: params._id,
      };
      let exist: Record<string, any> = await this.customerMarkaModel
        .findOne(match)
        .lean();
      if (!exist)
        return this.res.error(HttpStatus.BAD_REQUEST, 'ERROR.NOT_FOUND');
      if (params.is_delete === exist.is_delete)
        return this.res.error(HttpStatus.BAD_REQUEST, 'WARNING.ALREADY_DELETE');

      const updateObj: Record<string, any> = {
        ...req['updateObj'],
        ...params,
      };
      await this.customerMarkaModel.updateOne({ _id: params._id }, updateObj);
      if (params.is_delete) return this.res.success('SUCCESS.DELETE');
      return this.res.success('SUCCESS.UPDATE');
    } catch (error) {
      return this.res.error(HttpStatus.BAD_REQUEST, 'ERROR.BAD_REQ', error);
    }
  }

  async saveOtherInfo(req: Request, params: any): Promise<any> {
    try {
      let match: Record<string, any>;
      match = {
        org_id: req['user']['org_id'],
        gst_number: await this.cryptoService.encrypt(params.gst_number),
      };
      let exist: Record<string, any> = await this.customerOtherDetailModel
        .findOne(match)
        .lean();

      match = {
        org_id: req['user']['org_id'],
        customer_id: toObjectId(params.customer_id),
      };
      params.customer_id = toObjectId(params.customer_id);
      params.beat_code_id = toObjectId(params.beat_code_id);

      exist = await this.customerOtherDetailModel.findOne(match).lean();

      if (exist) {
        const updateObj = {
          ...req['updateObj'],
          ...params,
        };
        await this.customerOtherDetailModel.updateOne(
          { customer_id: toObjectId(params.customer_id) },
          updateObj,
        );
      } else {
        const saveObj = {
          ...req['createObj'],
          ...params,
        };
        const document = new this.customerOtherDetailModel(saveObj);
        await document.save();
      }
      return this.res.success('SUCCESS.CREATE');
    } catch (error) {
      return this.res.error(HttpStatus.BAD_REQUEST, 'ERROR.BAD_REQ', error);
    }
  }
  async saveShopGallery(req: Request, params: any): Promise<any> {
    try {
      const saveObj: Record<string, any> = {
        ...req['createObj'],
        ...params,
      };
      const document = new this.customerShopGalleryModel(saveObj);
      await document.save();
      return this.res.success('SUCCESS.CREATE');
    } catch (error) {
      return this.res.error(HttpStatus.BAD_REQUEST, 'ERROR.BAD_REQ');
    }
  }
  async saveUserToCustomerMapping(req: Request, params: any): Promise<any> {
    try {
      const updateObj: Record<string, any> = {
        ...req['updateObj'],
        is_delete: 1,
      };

      await this.userToCustomerMappingModel.updateMany(
        { customer_id: toObjectId(params.customer_id) },
        updateObj,
      );

      if (params?.user_array) {
        let userIds: Record<string, any>[] = [];
        for (let row of params.user_array) {
          let userRow: Record<string, any> = {
            ...req['createObj'],
            customer_id: toObjectId(params.customer_id),
            customer_name: params.customer_name,
            customer_type_id: toObjectId(params.customer_type_id),
            customer_type_name: params.customer_type_name,
            user_id: toObjectId(row.value),
            user_data: row,
          };
          userIds.push(userRow);
        }
        await this.userToCustomerMappingModel.insertMany(userIds);
      }
      return this.res.success('SUCCESS.CREATE');
    } catch (error) {
      return this.res.error(HttpStatus.BAD_REQUEST, 'ERROR.BAD_REQ', error);
    }
  }
  async assignCustomerMapping(req: Request, params: any): Promise<any> {
    try {
      const updateObj: Record<string, any> = {
        ...req['updateObj'],
        is_delete: 1,
      };

      await this.customerToCustomerMappingModel.updateMany(
        { child_customer_id: toObjectId(params.child_customer_id) },
        updateObj,
      );

      let mappingArray: Record<string, any>[] = [];
      for (let row of params.parent_customer_array) {
        let mapping: Record<string, any> = {
          ...req['createObj'],
          child_customer_id: toObjectId(params.child_customer_id),
          child_customer_name: params.child_customer_name,
          child_customer_type_name: params.child_customer_type_name,
          child_customer_type_id: toObjectId(params.child_customer_type_id),
          parent_customer_id: toObjectId(row.value),
          parent_customer_name: row.label,
          parent_customer_type_name: row.customer_type_name,
          parent_customer_type_id: toObjectId(row.customer_type_id),
        };
        mappingArray.push(mapping);
      }
      await this.customerToCustomerMappingModel.insertMany(mappingArray);
      return this.res.success('SUCCESS.CREATE');
    } catch (error) {
      return this.res.error(HttpStatus.BAD_REQUEST, 'ERROR.BAD_REQ', error);
    }
  }
  async identifier(req: Request, params: any): Promise<any> {
    try {
      const orgId = req?.['user']?.['org_id'] || params.org_id;
      if (!orgId) throw Error('Org not found');
      let match: Record<string, any> = {
        org_id: orgId,
        _id: toObjectId(params.customer_type_id),
        is_delete: 0,
      };

      let exist: Record<string, any> = await this.customerTypeModel
        .findOne(match)
        .lean();

      if (!exist) throw Error('account type not found');
      if (!exist?.identifier) throw Error('identifier not found');
      let identifierNumber: number;

      match = {
        org_id: orgId,
        customer_type_id: toObjectId(exist._id),
      };

      let customerExist: Record<string, any> = await this.customerModel
        .findOne(match)
        .sort({ _id: -1 });

      if (customerExist?.identifier_number) {
        identifierNumber = customerExist?.identifier_number + 1;
      } else {
        identifierNumber = 1;
      }

      const identifier: string = `${exist.identifier}-${identifierNumber}`;
      return {
        customerTypeData: exist,
        identifier,
        identifierNumber,
        status: true,
      };
    } catch (error) {
      throw error;
    }
  }
  async saveShippingAddress(req: Request, params: any): Promise<any> {
    try {
      if (params?.customer_id) {
        params.customer_id = params.customer_id;
      } else {
        params.customer_id = req['user']['_id'];
      }

      params.customer_id = toObjectId(params.customer_id);
      const saveObj: Record<string, any> = {
        ...req['createObj'],
        ...params,
      };
      const document = new this.customerShippingAddressModel(saveObj);
      await document.save();
      return this.res.success('SUCCESS.CREATE');
    } catch (error) {
      return this.res.error(HttpStatus.BAD_REQUEST, 'ERROR.BAD_REQ', error);
    }
  }
  async updateShippingAddress(req: Request, params: any): Promise<any> {
    try {
      let match: Record<string, any>;
      match = {
        org_id: req['user']['org_id'],
        _id: params._id,
        is_delete: 0,
      };
      let exist: Record<string, any> = await this.customerShippingAddressModel
        .findOne(match)
        .lean();
      if (!exist)
        return this.res.error(HttpStatus.BAD_REQUEST, 'ERROR.NOT_FOUND');
      if (params.is_delete === exist.is_delete)
        return this.res.error(HttpStatus.BAD_REQUEST, 'WARNING.ALREADY_DELETE');
      params.customer_id = toObjectId(params.customer_id);
      const updateObj: Record<string, any> = {
        ...req['updateObj'],
        ...params,
      };
      await this.customerShippingAddressModel.updateOne(
        { _id: params._id },
        updateObj,
      );
      if (params.is_delete) return this.res.success('SUCCESS.DELETE');
      return this.res.success('SUCCESS.UPDATE');
    } catch (error) {
      return this.res.error(HttpStatus.BAD_REQUEST, 'ERROR.BAD_REQ', error);
    }
  }
  async getShippingAddress(req: Request, params: any): Promise<any> {
    try {
      let match: Record<string, any> = {
        org_id: req['user']['org_id'],
        customer_id: params.customer_id,
        is_delete: 0,
      };
      let data: Record<string, any> = await this.customerShippingAddressModel
        .find(match)
        .sort({ _id: -1 })
        .lean();
      return data;
    } catch (error) {
      return this.res.error(HttpStatus.BAD_REQUEST, 'ERROR.BAD_REQ');
    }
  }
  async saveKycStatus(req: Request, params: any): Promise<any> {
    try {
      params.customer_id = toObjectId(params.customer_id);
      let match: Record<string, any> = {
        org_id: req['user']['org_id'],
        is_delete: 0,
      };
      console.log('xdhfgghhjhfcgjfhghgjhcfhvgcvhmghcf', params.customer_id);

      const customerExist: Record<string, any> =
        await this.customerModel.findOne({ ...match, _id: params.customer_id });
      if (!customerExist) {
        return this.res.error(
          HttpStatus.NOT_FOUND,
          'ERROR.NOT_FOUND',
          'Customer not found with given id',
        );
      }
      const exist: Record<string, any> =
        await this.customerKycDetailModel.findOne({
          ...match,
          customer_id: params.customer_id,
        });

      if (exist) {
        const updateObj: Record<string, any> = {
          ...req['updateObj'],
          kyc_status: params.kyc_status,
          status_remark: params.status_remark ? params.status_remark : '',
        };
        await this.customerKycDetailModel.updateOne(
          { ...match, customer_id: params.customer_id },
          updateObj,
        );
      } else {
        const document = new this.customerKycDetailModel({
          ...req['createObj'],
          kyc_status: params.kyc_status
            ? params.kyc_status
            : KycStatusEnum.PENDING,
          customer_id: params.customer_id,
          status_remark: params.status_remark ? params.status_remark : '',
        });
        await document.save();
      }

      params.template_id = 5;
      params.account_ids = [
        {
          account_ids: customerExist.customer_id,
          login_type_id: customerExist.login_type_id,
        },
      ];

      params.variables = {
        status: params.kyc_status,
      };
      params.push_notify = true;
      params.in_app = true;

      this.notificationService.notify(req, params);
      return this.res.success('SUCCESS.UPDATE');
    } catch (error) {
      return this.res.error(HttpStatus.BAD_REQUEST, 'ERROR.BAD_REQ');
    }
  }
  async getKycStatus(req: Request, params: any): Promise<any> {
    try {
      let match: Record<string, any> = {
        org_id: req['user']['org_id'],
        customer_id: params.customer_id,
        is_delete: 0,
      };
      let data: Record<string, any> =
        await this.customerKycDetailModel.findOne(match);
      return data;
    } catch (error) {
      return this.res.error(HttpStatus.BAD_REQUEST, 'ERROR.BAD_REQ');
    }
  }
  async saveDocs(files: Express.Multer.File[], req: any): Promise<any> {
    try {
      req.body.module_name = Object.keys(global.MODULES).find(
        (key) => global.MODULES[key] === global.MODULES['Customers'],
      );

      if (req.body.exist_id && Types.ObjectId.isValid(req.body.exist_id)) {
        let match: Record<string, any> = {
          org_id: req['user']['org_id'],
          _id: toObjectId(req.body.exist_id),
          is_delete: 0,
        };

        const updateObj: Record<string, any> = {
          ...req['updateObj'],
          is_delete: 1,
        };
        await this.customerDocsModel.updateOne(match, updateObj);

        let response = await this.s3Service.uploadMultiple(
          files,
          req,
          this.customerDocsModel,
        );
        return this.res.success('SUCCESS.UPDATE', response);
      } else {
        let response = await this.s3Service.uploadMultiple(
          files,
          req,
          this.customerDocsModel,
        );
        return this.res.success('SUCCESS.CREATE', response);
      }
    } catch (error) {
      return this.res.error(
        HttpStatus.BAD_REQUEST,
        'Error uploading files to S3',
        error?.message || error,
      );
    }
  }
  async updateDocs(req: Request, params: any): Promise<any> {
    try {
      let match: Record<string, any> = {
        org_id: req['user']['org_id'],
        _id: params._id,
        is_delete: 0,
      };

      let exist: Record<string, any> =
        await this.customerDocsModel.findOne(match);
      if (!exist)
        return this.res.error(HttpStatus.BAD_REQUEST, 'ERROR.NOT_FOUND');

      exist = await this.customerDocsModel.findOne({
        org_id: req['user']['org_id'],
        doc_no: params.doc_no,
        _id: { $ne: params._id },
        is_delete: 0,
      });

      if (exist)
        return this.res.error(
          HttpStatus.BAD_REQUEST,
          'CUSTOMER.DOC_NUMBER_EXIST',
        );

      const updateObj: Record<string, any> = {
        ...req['updateObj'],
        ...params,
      };
      await this.customerDocsModel.updateOne(match, updateObj);
      return this.res.success('SUCCESS.UPDATE');
    } catch (error) {
      return this.res.error(HttpStatus.BAD_REQUEST, 'ERROR.BAD_REQ', error);
    }
  }
  async getCustomerAssigning(req: Request, params: any): Promise<any> {
    try {
      const customerType: Record<string, any> = await this.customerModel
        .findOne(
          { _id: toObjectId(params.customer_id) },
          { customer_type_name: 1 },
        )
        .lean();

      let data: Record<string, any>[] = [];
      let match: Record<string, any> = {
        is_delete: 0,
        org_id: req['user']['org_id'],
      };
      if (customerType?.login_type_id === global.LOGIN_TYPE_ID['PRIMARY']) {
        match.parent_customer_id = toObjectId(params.customer_id);
        params.localField = 'child_customer_id';
      } else {
        match.child_customer_id = toObjectId(params.customer_id);
        params.localField = 'parent_customer_id';
      }

      const customerLookup: any[] = this.sharedCustomerService.customerLookup(
        req,
        params,
      );
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
      if (!data || data.length === 0) {
        return this.res.error(HttpStatus.NOT_FOUND, 'No Customer Found');
      }
      return this.res.success('SUCCESS.FETCH', data);
    } catch (error) {
      return this.res.error(HttpStatus.BAD_REQUEST, 'ERROR.BAD_REQ', error);
    }
  }

  async referralDetails(req: Request, params: any): Promise<any> {
    try {
      if (!params?.customer_id && !req['user']?._id) {
        if (params.internalCall) return [];
        return this.res.error(HttpStatus.BAD_REQUEST, 'CUSTOMER_ID_REQUIRED');
      }
      params._id = toObjectId(params?.customer_id) || req['user']['_id'];

      const customer = await this.customerModel
        .findOne({ _id: params._id })
        .lean();
      if (!customer) {
        if (params.internalCall) return [];
        return this.res.error(HttpStatus.NOT_FOUND, 'CUSTOMER.NOT_EXIST');
      }
      let referral_data = [];

      if (customer.form_data && customer.form_data.invitation_code) {
        referral_data = await this.customerModel
          .find({
            'form_data.referral_code': customer.form_data.invitation_code,
          })
          .lean();
      } else {
        referral_data = [];
      }

      if (params.internalCall) return referral_data;
      return this.res.success('SUCCESS.FETCH', referral_data);
    } catch (error) {
      return this.res.error(HttpStatus.BAD_REQUEST, 'ERROR.BAD_REQ', error);
    }
  }
}
