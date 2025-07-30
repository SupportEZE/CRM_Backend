import { HttpStatus, Injectable } from '@nestjs/common';
import {
  CustomerModel,
  PrimaryProfileStatus,
} from '../../default/models/customer.model';
import { Model } from 'mongoose';
import { CustomerBankDetailModel } from '../../default/models/customer-bank-detail.model';
import { CustomerContactPersonModel } from '../../default/models/customer-contact-person.model';
import { CustomerDocsModel } from '../../default/models/customer-docs.model';
import { CustomerOtherDetailModel } from '../../default/models/customer-other-detail.model';
import { CustomerShopGalleryModel } from '../../default/models/customer-shop-gallery.model';
import { CustomerTypeModel } from '../../../customer-type/models/customer-type.model';
import { OzoneProspectStageModel } from '../../default/models/ozone-customer-stage.model';

import { InjectModel } from '@nestjs/mongoose';
import { ResponseService } from 'src/services/response.service';
import {
  calculatePercentage,
  commonSearchFilter,
  getNextDate,
  tat,
} from 'src/common/utils/common.utils';
import { CustomerService } from '../web/customer.service';
import { CustomerKycDetailModel } from '../../default/models/customer-kyc-details.model';
import { QrcodeService } from 'src/modules/loyalty/qr-code/web/qr-code.service';
import { BadgesModel } from 'src/modules/loyalty/badges/models/badges.model';
import { RbacService } from '../../../rbac/web/rbac.service';
import { AuthService } from 'src/shared/rpc/auth.service';
import { KycStatusEnum } from '../../default/models/customer-kyc-details.model';
import { COLLECTION_CONST } from 'src/config/collection.constant';
import { UserToCustomerMappingModel } from '../../default/models/user-to-customer-mapping.model';
import { CryptoService } from 'src/services/crypto.service';
import { CustomerShippingAddressModel } from '../../default/models/customer-shipping-address.model';
import { CustomerToCustomerMappingModel } from '../../default/models/customer-to-customer-mapping.dto';
import { LoginTypeModel } from '../../../rbac/models/login-type.model';
import { SharedCustomerService } from '../../shared-customer.service';
import { DefaultFormModel } from 'src/shared/form-builder/models/default-form.model';
import { SharedActivityService } from 'src/modules/sfa/activity/shared-activity.service';
import { GlobalService } from 'src/shared/global/global.service';
import { SharedUserService } from '../../../user/shared-user.service';
import { DB_NAMES } from 'src/config/db.constant';
import { GlobalAchievementService } from 'src/shared/global/achievement.service';
import { AppLedgerService } from 'src/modules/loyalty/ledger/app/app-ledger.service';
import { LedgerService } from 'src/modules/loyalty/ledger/web/ledger.service';
import { commonFilters, Like, toObjectId } from 'src/common/utils/common.utils';
import { DropdownService } from 'src/modules/master/dropdown/web/dropdown.service';

@Injectable()
export class AppCustomerService {
  constructor(
    @InjectModel(CustomerModel.name)
    private customerModel: Model<CustomerModel>,
    @InjectModel(LoginTypeModel.name)
    private loginTypeModel: Model<LoginTypeModel>,
    @InjectModel(CustomerBankDetailModel.name)
    private customerBankDetailModel: Model<CustomerBankDetailModel>,
    @InjectModel(CustomerContactPersonModel.name)
    private customerContactPersonModel: Model<CustomerContactPersonModel>,
    @InjectModel(CustomerDocsModel.name)
    private customerDocsModel: Model<CustomerDocsModel>,
    @InjectModel(CustomerOtherDetailModel.name)
    private customerOtherDetailModel: Model<CustomerOtherDetailModel>,
    @InjectModel(CustomerShopGalleryModel.name)
    private customerShopGalleryModel: Model<CustomerShopGalleryModel>,
    @InjectModel(CustomerTypeModel.name)
    private customerTypeModel: Model<CustomerTypeModel>,
    @InjectModel(CustomerKycDetailModel.name)
    private customerKycDetailModel: Model<CustomerKycDetailModel>,
    @InjectModel(BadgesModel.name) private badgesModel: Model<BadgesModel>,
    @InjectModel(UserToCustomerMappingModel.name)
    private userToCustomerMappingModel: Model<UserToCustomerMappingModel>,
    @InjectModel(CustomerShippingAddressModel.name)
    private customerShippingAddressModel: Model<CustomerShippingAddressModel>,
    @InjectModel(DefaultFormModel.name, DB_NAMES().CORE_DB)
    private defaultFormModel: Model<DefaultFormModel>,
    @InjectModel(CustomerToCustomerMappingModel.name)
    private customerToCustomerMappingModel: Model<CustomerToCustomerMappingModel>,
    @InjectModel(OzoneProspectStageModel.name)
    private prospectStageModel: Model<OzoneProspectStageModel>,

    private readonly res: ResponseService,
    private readonly customerService: CustomerService,
    private readonly qrcodeService: QrcodeService,
    private readonly rbacService: RbacService,
    private readonly authService: AuthService,
    private readonly cryptoService: CryptoService,
    private readonly sharedCustomerService: SharedCustomerService,
    private readonly sharedActivityService: SharedActivityService,
    private readonly globalService: GlobalService,
    private readonly sharedUserService: SharedUserService,
    private readonly globalAchievementService: GlobalAchievementService,
    private readonly appLedgerService: AppLedgerService,
    private readonly ledgerService: LedgerService,
    private readonly dropdownService: DropdownService,
  ) { }


  async read(req: Request, params: any): Promise<any> {
    try {
      const userId = req['user']['_id'];
      const orgId = req['user']['org_id']; // optional: include only if needed

      const match: Record<string, any> = {
        is_delete: 0,
        login_type_id: req['user']['login_type_id'], // ← this seems fine
        created_id: userId,
      };

      if (params.customer_type_id) {
        match.customer_type_id = toObjectId(params.customer_type_id);
      }

      // Optional org check
      if (orgId) {
        match.org_id = orgId;
      }

      const result = await this.customerModel.find(match).lean();
      console.log(result);

      return result;
    } catch (err) {
      console.error('App read error:', err);
      throw err;
    }
  }

  async readOz(req: Request, params: any): Promise<any> {
    try {
      const user = req['user'];
      const userId = user['_id'];
      const orgId = user['org_id'];

      const match: Record<string, any> = {
        is_delete: 0,
        login_type_id: params.login_type_id,
        created_id: userId,
      };

      if (orgId) {
        match.org_id = orgId;
      }

      if (params.customer_type_id) {
        match.customer_type_id = toObjectId(params.customer_type_id);
      }
      const activeStatus = params.activeTab;
      if (activeStatus) {
        match.profile_status = activeStatus;
      }
      const filters = commonFilters(params.filters);
      Object.assign(match, filters);

      const page = params.page || global.PAGE;
      const limit = params.limit || global.LIMIT;
      const skip = (page - 1) * limit;

      const projection = {
        created_unix_time: 0,
        is_delete: 0,
      };

      let sort: Record<string, 1 | -1> = { _id: -1 };
      if (params.sorting && Object.keys(params.sorting).length > 0) {
        sort = params.sorting;
      }

      const pipeline = [
        { $match: match },
        { $project: projection },
        { $sort: sort },
      ];

      const totalCountData = await this.customerModel.aggregate([
        ...pipeline,
        { $count: 'totalCount' },
      ]);
      const total = totalCountData.length ? totalCountData[0].totalCount : 0;

      const result = await this.customerModel.aggregate([
        ...pipeline,
        { $skip: skip },
        { $limit: limit },
      ]);

      // 👇 Add Stage Count Logic Here
      const stageList = [
        'Prospect',
        'Lead',
        'Meeting',
        'Showroom Visit',
        'Site Visit',
        'Business Head Meeting',
        'Status',
      ];

      const stageCounts: Record<string, number> = {};
      for (const status of stageList) {
        const count = await this.customerModel.countDocuments({
          is_delete: 0,
          login_type_id: params.login_type_id,
          created_id: userId,
          org_id: orgId,
          profile_status: status,
        });
        stageCounts[status] = count;
      }
      const data: any = {
        result,
        activeTab: stageCounts,
      };
      return this.res.pagination(data, total, page, limit);
    } catch (error) {
      console.error('App Read Error:', error);
      return this.res.error(HttpStatus.BAD_REQUEST, 'ERROR.BAD_REQ', error);
    }
  }
  async readCustomerType(req: Request, params: any): Promise<any> {
    try {
      params.org_id = await this.rbacService.getOrgId(req, params);

      const match: Record<string, any> = {
        org_id: params.org_id,
        is_delete: 0,
        login_type_id: 10,
      };

      const customerTypes: any[] = await this.customerTypeModel
        .find(match)
        .lean();

      const enrichedCustomerTypes = await Promise.all(
        customerTypes.map(async (type) => {
          const forms = await this.defaultFormModel
            .findOne(
              {
                module_id: global.MODULES['Masters'],
                login_type_id: type.login_type_id,
                $or: [
                  { platform: global.PLATFORM[1] },
                  { platform: global.PLATFORM[3] },
                ],
              },
              { form_id: 1, form_type: 1 },
            )
            .lean();

          return {
            label: type.customer_type_name,
            value: type._id,
            forms,
            org_id: params.org_id,
          };
        }),
      );

      return this.res.success('SUCCESS.FETCH', enrichedCustomerTypes);
    } catch (error) {
      return this.res.error(HttpStatus.BAD_REQUEST, 'ERROR.BAD_REQ', error);
    }
  }
  async createInfluencer(req: Request, params: any): Promise<any> {
    try {
      params.org_id = await this.rbacService.getOrgId(req, params);
      const basicValidation = await this.basicValidation(req, params);
      if (!basicValidation?.status) return false;

      let exist: Record<string, any>;
      params.internalCall = true;
      exist = await this.checkReferralCode(req, params);
      if (exist?.status)
        return this.res.error(HttpStatus.BAD_REQUEST, exist.message);

      params.basic_info.duplicacyCheck = true;
      exist = await this.customerService.duplicate(
        req,
        { ...params.basic_info, ...params.bank_info, ...params.docs_info },
        params.org_id,
      );
      if (exist?.status)
        return this.res.error(HttpStatus.BAD_REQUEST, exist.message);

      exist = await this.customerService.identifier(req, {
        ...params.basic_info,
        org_id: params.org_id,
      });
      if (!exist?.status) return exist;

      const profileStatus: any = await this.loginTypeModel
        .findOne(
          { is_delete: 0, login_type_id: exist.customerTypeData.login_type_id },
          { login_type_name: 1, customer_type_name: 1, profile_status: 1 },
        )
        .lean();

      if (profileStatus?.profile_status?.length === 0)
        return this.res.error(
          HttpStatus.BAD_REQUEST,
          'ERROR.BAD_REQ',
          'profile status not found',
        );

      const addonFields: Record<string, any> = {
        login_type_id: exist.customerTypeData.login_type_id,
        login_type_name: exist.customerTypeData.login_type_name,
        customer_type_id: exist.customerTypeData._id,
        profile_status: profileStatus.profile_status[0],
      };

      if (!params?.basic_info?.form_data?.referral_code)
        delete params?.basic_info?.form_data?.referral_code;
      params.basic_info.form_data.invitation_code = params.basic_info.mobile;

      params.createObj = {
        created_id: 1,
        created_name: params.basic_info.customer_name,
        org_id: params.org_id,
      };
      const saveObj: Record<string, any> = {
        ...params.createObj,
        ...params.basic_info,
        ...addonFields,
        identifier: exist.identifier,
        identifier_number: exist.identifierNumber,
      };
      const document = new this.customerModel(saveObj);
      const insert = await document.save();
      if (!insert)
        return this.res.error(HttpStatus.BAD_REQUEST, 'ERROR.BAD_REQ');
      params.customer_id = insert._id;
      params.createObj.created_id = insert._id;
      await this.customerModel.updateOne(
        { _id: insert._id },
        { created_id: insert._id },
      );
      await this.saveBankDetail(req, params);
      await this.saveKycStatus(req, params);
      const token: Record<string, any> = await this.authService.createAppToken(
        req,
        { _id: insert._id },
      );
      const response = { inserted_id: insert._id, token: token };

      return this.res.success('SUCCESS.CREATE', response);
    } catch (error) {
      return this.res.error(HttpStatus.BAD_REQUEST, 'ERROR.BAD_REQ', error);
    }
  }
  async basicValidation(req: Request, params: any): Promise<any> {
    try {
      if (
        params?.bank_info?.account_no !== params?.bank_info?.confirm_account_no
      ) {
        return this.res.error(
          HttpStatus.BAD_REQUEST,
          'CUSTOMER.ACCOUNT_NOT_MATCHED',
        );
      }
      return { status: true };
    } catch (error) {
      return this.res.error(
        HttpStatus.BAD_REQUEST,
        'ERROR.BAD_REQ',
        error.message,
      );
    }
  }
  async update(req: Request, params: any): Promise<any> {
    try {
      params.duplicacyCheck = true;
      let exist: Record<string, any>;
      exist = await this.customerModel.findOne({ _id: params._id }).exec();
      if (!exist)
        return this.res.error(HttpStatus.BAD_REQUEST, 'CUSTOMER.NOT_EXIST');
      if (params?.is_delete && exist['is_delete'] === params?.is_delete)
        return this.res.error(HttpStatus.BAD_REQUEST, 'WARNING.ALREADY_DELETE');
      if (params?.status && exist['status'] === params?.status)
        return this.res.error(
          HttpStatus.BAD_REQUEST,
          'WARNING.ALREADY_STATUS_UPDATE',
        );
      if (!params?.is_delete && !params?.status) {
        exist = await this.customerService.duplicate(req, params);
        if (exist.status)
          return this.res.error(HttpStatus.BAD_REQUEST, exist.message);
      }
      const updateObj: Record<string, any> = {
        ...req['updateObj'],
        ...params,
      };
      await this.customerModel.updateOne({ _id: params._id }, updateObj);
      if (params?.is_delete) return this.res.success('SUCCESS.DELETE');
      if (params?.status) return this.res.success('SUCCESS.UPDATE');
      return this.res.success('SUCCESS.UPDATE');
    } catch (error) {
      return this.res.error(HttpStatus.BAD_REQUEST, 'ERROR.BAD_REQ', error);
    }
  }

  async customerProfile(
    req: Request,
    params: Record<string, any>,
  ): Promise<any> {
    try {
      params = params || {};

      let loginId: any = params?.customer_id || req['user']['_id'];

      const match: Record<string, any> = {
        is_delete: 0,
        org_id: req['user']['org_id'],
        _id: loginId,
      };

      const projection: Record<string, any> = {
        is_delete: 0,
        org_id: 0,
        created_id: 0,
        created_name: 0,
        updated_at: 0,
      };

      const result: Record<string, any> | null = await this.customerModel
        .findOne(match, projection)
        .lean();
      if (!result)
        return this.res.error(HttpStatus.NOT_FOUND, 'ERROR.NOT_FOUND');

      delete result.jwt_app_token;
      delete result.jwt_web_token;
      params.customer_id = result._id;

      const [
        BankDetail,
        docDetail,
        kycDetail,
        badgeResult,
        points,
        profile_percentage,
        pointSummary,
        customerPointsByCategories,
        customerOtherDetails,
      ]: [
          Record<string, any>,
          Record<string, any>[],
          Record<string, any>[],
          { custom_date_range: string; point_fixed: number; title: string },
          number,
          number,
          Record<string, any>,
          Record<string, any>[],
          Record<string, any>,
        ] = await Promise.all([
          this.getBankDetail(req, params),
          this.getDocs(req, params),
          this.getKycStatus(req, params),
          this.getBadge(req, params),
          this.qrcodeService.getPoints(req, params),
          this.sharedCustomerService.profilePercentage(req, params),
          this.appLedgerService.wallet(req, params),
          this.appLedgerService.readCustomerPointEarnByCategory(req, params),
          await this.customerOtherDetailModel
            .findOne({ customer_id: result._id })
            .lean(),
        ]);

      params.custom_date_range = badgeResult.custom_date_range;

      const badgeProgress: number =
        badgeResult.point_fixed === 0
          ? 0
          : Math.min((points / badgeResult.point_fixed) * 100, 100);
      const remainingPoints: number = Math.max(
        badgeResult.point_fixed - points,
        0,
      );

      const badgeData: Record<string, any> = {
        title: badgeResult.title,
        badgeProgress,
        remainingPoints,
      };

      const data: Record<string, any> = {
        basic_detail: {
          ...result,
          lat: customerOtherDetails?.lat ?? null,
          long: customerOtherDetails?.long ?? null,
        },
        bank_detail: BankDetail,
        doc_detail: docDetail,
        kyc_detail: kycDetail,
        badge_detail: badgeData,
        point_summary: pointSummary,
        customer_points_catgories: customerPointsByCategories,
        profile_percentage,
      };

      if (
        result?.form_data?.invitation_code &&
        result.login_type_id === global.LOGIN_TYPE_ID['INFLUENCER']
      ) {
        data.reffer_customers = await this.customerModel
          .find(
            {
              'form_data.referral_code': result?.form_data?.invitation_code,
              profile_status: PrimaryProfileStatus.ACTIVE,
              is_delete: 0,
            },
            { customer_name: 1, mobile: 1 },
          )
          .lean();

        if (data.reffer_customers.length > 0) {
          const customer_ids = data.reffer_customers.map(
            (customer: any) => customer._id,
          );
          const points = await this.ledgerService.getPointsByType(req, {
            customer_ids,
            creation_type: global.global.CREATION_TYPE[12],
          });
          data.reffer_customers = data.reffer_customers.map((customer: any) => {
            const customerPoints = points.find(
              (point: any) =>
                point.customer_id.toString() === customer._id.toString(),
            );
            customer.points = customerPoints ? customerPoints.points : 0;
            return customer;
          });
        }
      }

      const loginType: number = result['login_type_id'];
      params.login_type_id = loginType;

      if (
        loginType === global.LOGIN_TYPE_ID['PRIMARY'] ||
        loginType === global.LOGIN_TYPE_ID['SECONDARY'] ||
        loginType === global.LOGIN_TYPE_ID['SUB_PRIMARY']
      ) {
        const [
          contactPerson,
          otherDetail,
          shippingAddress,
          assignCustomers,
          assignUsers,
          lastVisit,
          lastOrder,
          allDocs,
        ]: [
            Record<string, any>[],
            Record<string, any>,
            Record<string, any>[],
            Record<string, any>[],
            Record<string, any>[],
            Record<string, any>,
            Record<string, any>,
            Record<string, any>[],
          ] = await Promise.all([
            this.getContactPerson(req, params),
            this.getOtherDetail(req, params),
            this.getShippingAddressDetail(req, params),
            this.getCustomerAssigning(req, params),
            this.getUserAssigning(req, params),
            this.sharedActivityService.customerLastVisit(req, params),
            this.globalService.customerLastOrder(req, params),
            this.sharedCustomerService.getDocument(
              toObjectId(params.customer_id),
            ),
          ]);

        let primarySalesAchievement: Record<string, any> = {};
        let secondarySalesAchievement: Record<string, any> = {};
        let creditData: Record<string, any> = {};

        params.customer_ids = [params.customer_id];

        switch (loginType) {
          case global.LOGIN_TYPE_ID['PRIMARY']:
            [primarySalesAchievement, secondarySalesAchievement, creditData] =
              await Promise.all([
                this.globalAchievementService.getPrimarySaleAchievement(
                  req,
                  params,
                ),
                this.globalAchievementService.getSecondaryAchievement(
                  req,
                  params,
                ),
                this.globalService.readCreditData(req, params),
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
            [primarySalesAchievement, creditData] = await Promise.all([
              this.globalAchievementService.getPrimarySaleAchievement(
                req,
                params,
              ),
              this.globalService.readCreditData(req, params),
            ]);
            break;
        }
        data.contact_person_detail = contactPerson;
        data.other_detail = otherDetail;
        data.shipping_address = shippingAddress;
        data.assign_customers = assignCustomers;
        data.secondary_network_count = assignCustomers.length;
        data.assign_users = assignUsers;
        data.last_visit = lastVisit[0] || '';
        data.last_order = lastOrder[0] || '';
        data.shop_gallery_detail = allDocs.filter(
          (row: any) => row.label === global.FILES_LABEL[1],
        );
        data.primary_sales_achievement =
          Array.isArray(primarySalesAchievement) &&
            primarySalesAchievement.length
            ? primarySalesAchievement[0]
            : {
              total_net_amount_with_tax: 0,
              count: 0,
              customer_id: '',
            };
        data.secondary_sales_achievement = secondarySalesAchievement;
        data.credit_summary = creditData;
      }
      return this.res.success('SUCCESS.FETCH', data);
    } catch (error: any) {
      return this.res.error(HttpStatus.BAD_REQUEST, 'ERROR.BAD_REQ', error);
    }
  }
  async getBankDetail(req: Request, params: any): Promise<any> {
    try {
      let match: Record<string, any> = {
        org_id: req['user']['org_id'],
        customer_id: params.customer_id,
        is_delete: 0,
      };

      const projection: Record<string, any> = {
        is_delete: 0,
        org_id: 0,
        created_id: 0,
        created_name: 0,
        updated_at: 0,
      };

      let data: Record<string, any> = await this.customerBankDetailModel
        .findOne(match, projection)
        .lean();
      return data;
    } catch (error) {
      return this.res.error(HttpStatus.BAD_REQUEST, 'ERROR.BAD_REQ', error);
    }
  }
  async saveBankDetail(req: Request, params: any): Promise<any> {
    try {
      if (!params?.bank_info?.account_no) return;
      params.bank_info.customer_id = params.customer_id;
      const saveObj: Record<string, any> = {
        ...params.createObj,
        ...params.bank_info,
      };
      const document = new this.customerBankDetailModel(saveObj);
      await document.save();
    } catch (error) {
      return this.res.error(HttpStatus.BAD_REQUEST, 'ERROR.BAD_REQ', error);
    }
  }
  async getContactPerson(req: Request, params: any): Promise<any> {
    try {
      let match: Record<string, any> = {
        org_id: req['user']['org_id'],
        customer_id: params.customer_id,
        is_delete: 0,
      };
      const projection: Record<string, any> = {
        contact_person_name: 1,
        contact_person_mobile: 1,
        designation: 1,
      };
      let data: Record<string, any> = await this.customerContactPersonModel
        .find(match, projection)
        .lean();
      return data;
    } catch (error) {
      throw error;
    }
  }
  async saveContactPerson(req: Request, params: any): Promise<any> {
    try {
      let match: Record<string, any> = {
        org_id: req['user']['org_id'],
        contact_person_mobile: params.contact_person_mobile,
      };
      let exist: Record<string, any> = await this.customerContactPersonModel
        .findOne(match)
        .lean();
      if (exist)
        return this.res.error(
          HttpStatus.BAD_REQUEST,
          'CUSTOMER.ACCOUNT_NUMBER_EXIST',
        );
      const saveObj: Record<string, any> = {
        ...req['createObj'],
        ...params,
      };
      const document = new this.customerContactPersonModel(saveObj);
      await document.save();
      return this.res.success('SUCCESS.CREATE');
    } catch (error) {
      return this.res.error(HttpStatus.BAD_REQUEST, 'ERROR.BAD_REQ');
    }
  }
  async getOtherDetail(req: Request, params: any): Promise<any> {
    try {
      let match: Record<string, any> = {
        org_id: req['user']['org_id'],
        customer_id: params.customer_id,
        is_delete: 0,
      };
      const projection: Record<string, any> = {
        org_id: 0,
        is_delete: 0,
      };
      let data: Record<string, any> = await this.customerOtherDetailModel
        .findOne(match, projection)
        .lean();
      return data;
    } catch (error) {
      throw error;
    }
  }
  async getShippingAddressDetail(req: Request, params: any): Promise<any> {
    try {
      let match: Record<string, any> = {
        org_id: req['user']['org_id'],
        customer_id: params.customer_id,
        is_delete: 0,
      };
      const projection: Record<string, any> = {
        org_id: 0,
        is_delete: 0,
      };
      let data: Record<string, any> = await this.customerShippingAddressModel
        .find(match, projection)
        .lean();
      return data;
    } catch (error) {
      throw error;
    }
  }
  async saveOtherDetail(req: Request, params: any): Promise<any> {
    try {
      const saveObj: Record<string, any> = {
        ...req['createObj'],
        ...params,
      };
      const document = new this.customerOtherDetailModel(saveObj);
      await document.save();
      return this.res.success('SUCCESS.CREATE');
    } catch (error) {
      return this.res.error(HttpStatus.BAD_REQUEST, 'ERROR.BAD_REQ');
    }
  }
  async getShopGallery(req: Request, params: any): Promise<any> {
    try {
      let match: Record<string, any> = {
        org_id: req['user']['org_id'],
        customer_id: params.customer_id,
        is_delete: 0,
      };
      let data: Record<string, any> = await this.customerShopGalleryModel
        .find(match)
        .lean();
      return data;
    } catch (error) {
      return this.res.error(
        HttpStatus.BAD_REQUEST,
        'ERROR.BAD_REQ',
        error.message,
      );
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
  async saveDocs(req: Request, params: any): Promise<any> {
    try {
      if (!params?.docs_info) return;

      const docs: Record<string, any>[] = [];

      for (let i of params.docs_info) {
        if (!i.doc_files) continue;

        for (let doc of i.doc_files) {
          let docRow = {
            ...params.createObj,
            customer_id: params.customer_id,
            doc_type: i.doc_type,
            doc_number: i.doc_number,
            doc_label: doc.doc_label,
            doc_file: doc.doc_file,
          };
          docs.push(docRow);
        }
      }
      if (docs.length > 0) {
        await this.customerDocsModel.insertMany(docs);
      }
    } catch (error) {
      return this.res.error(HttpStatus.BAD_REQUEST, 'ERROR.BAD_REQ', error);
    }
  }
  async checkReferralCode(req: Request, params: any): Promise<any> {
    try {
      if (params?.internalCall) {
        if (!params?.basic_info?.form_data?.referral_code) return;
      }
      let referralCode: string;
      if (params?.internalCall) {
        referralCode = params?.basic_info?.form_data.referral_code;
      } else {
        referralCode = params.referral_code;
      }
      let match: Record<string, any> = {
        org_id: params.org_id,
        'form_data.invitation_code': referralCode,
        is_delete: 0,
      };
      let exist: Record<string, any> = await this.customerModel.findOne(match);

      if (params?.internalCall && !exist)
        return { status: true, message: 'CUSTOMER.REFRRALCODE' };
      if (!exist)
        return this.res.error(HttpStatus.BAD_REQUEST, 'CUSTOMER.REFRRALCODE');
    } catch (error) {
      return this.res.error(
        HttpStatus.BAD_REQUEST,
        'ERROR.BAD_REQ',
        error.message,
      );
    }
  }
  async saveKycStatus(req: Request, params: any): Promise<any> {
    try {
      const document = new this.customerKycDetailModel({
        ...(params.createObj || req['createObj']),
        kyc_status: KycStatusEnum.PENDING,
        customer_id: params.customer_id,
      });
      await document.save();
    } catch (error) {
      return this.res.error(HttpStatus.BAD_REQUEST, 'ERROR.BAD_REQ', error);
    }
  }
  async getKycStatus(req: Request, params: any): Promise<any> {
    try {
      let match: Record<string, any> = {
        org_id: req['user']['org_id'],
        customer_id: params.customer_id,
        is_delete: 0,
      };
      let projection: Record<string, any> = {
        updated_at: 1,
        kyc_status: 1,
        status_remark: 1,
      };
      let data: Record<string, any> = await this.customerKycDetailModel.findOne(
        match,
        projection,
      );
      return data;
    } catch (error) {
      return this.res.error(HttpStatus.BAD_REQUEST, 'ERROR.BAD_REQ');
    }
  }
  async updateProfile(req: Request, params: any): Promise<any> {
    try {
      params.customer_id = toObjectId(params.customer_id);
      let match: Record<string, any> = {
        org_id: req['user']['org_id'],
        customer_id: params.customer_id,
        is_delete: 0,
      };
      let data: Record<string, any> = await this.customerModel.findOne(match);
      if (!data)
        return this.res.error(HttpStatus.BAD_REQUEST, 'CUSTOMER.NOT_EXIST');
      const updateObj: Record<string, any> = {
        ...req['updateObj'],
        ...params,
      };
      await this.customerModel.updateOne(match, updateObj);
      return this.res.success('SUCCESS.UPDATE');
    } catch (error) {
      return this.res.error(HttpStatus.BAD_REQUEST, 'ERROR.BAD_REQ');
    }
  }
  async updateBasicInfo(req: Request, params: any): Promise<any> {
    try {
      params.customer_id = req['user']['_id'];
      let match: Record<string, any> = {
        org_id: req['user']['org_id'],
        _id: params.customer_id,
        is_delete: 0,
      };
      let data: Record<string, any> = await this.customerModel.findOne(match);
      if (!data)
        return this.res.error(HttpStatus.BAD_REQUEST, 'CUSTOMER.NOT_EXIST');
      const updateObj: Record<string, any> = {
        ...req['updateObj'],
        ...params,
      };
      await this.customerModel.updateOne(match, updateObj);
      return this.res.success('SUCCESS.UPDATE');
    } catch (error) {
      return this.res.error(HttpStatus.BAD_REQUEST, 'ERROR.BAD_REQ');
    }
  }
  async updateBankInfo(req: Request, params: any): Promise<any> {
    try {
      params.customer_id = req['user']['_id'];
      let match: Record<string, any> = {
        org_id: req['user']['org_id'],
        _id: params.customer_id,
        is_delete: 0,
      };
      let data: Record<string, any> = await this.customerModel.findOne(match);
      if (!data)
        return this.res.error(HttpStatus.BAD_REQUEST, 'CUSTOMER.NOT_EXIST');

      match = {
        org_id: req['user']['org_id'],
        customer_id: params.customer_id,
        is_delete: 0,
      };

      data = await this.customerKycDetailModel.findOne(match);
      if (data?.kyc_status === KycStatusEnum.APPROVED) {
        return this.res.error(HttpStatus.BAD_REQUEST, 'CUSTOMER.KYC_ERROR');
      }

      if (params?.account_no) {
        match = {
          org_id: req['user']['org_id'],
          _id: { $ne: params.customer_id },
          is_delete: 0,
          account_no: params.account_no,
        };
        data = await this.customerBankDetailModel.findOne(match);
        if (data)
          return this.res.error(
            HttpStatus.BAD_REQUEST,
            'CUSTOMER.ACCOUNT_NUMBER_EXIST',
          );
      }

      match = {
        org_id: req['user']['org_id'],
        customer_id: params.customer_id,
        is_delete: 0,
      };

      data = await this.customerBankDetailModel.findOne(match);
      if (data) {
        let updateObj: Record<string, any> = {
          ...req['updateObj'],
          ...params,
        };

        match = {
          org_id: req['user']['org_id'],
          customer_id: params.customer_id,
          is_delete: 0,
        };

        await this.customerBankDetailModel.updateOne(match, updateObj);
        updateObj = {
          ...req['updateObj'],
          is_delete: 1,
        };
        await this.customerKycDetailModel.updateOne(match, updateObj);
      } else {
        let saveObj: Record<string, any> = {
          ...req['createObj'],
          ...params,
        };

        const document = new this.customerBankDetailModel(saveObj);
        await document.save();
      }

      await this.saveKycStatus(req, params);
      return this.res.success('SUCCESS.UPDATE');
    } catch (error) {
      return this.res.error(HttpStatus.BAD_REQUEST, 'ERROR.BAD_REQ', error);
    }
  }
  async updateDocsInfo(req: Request, params: any): Promise<any> {
    try {
      params.customer_id = req['user']['_id'];
      let match: Record<string, any> = {
        org_id: req['user']['org_id'],
        _id: params.customer_id,
        is_delete: 0,
      };
      let data: Record<string, any> = await this.customerModel.findOne(match);
      if (!data)
        return this.res.error(HttpStatus.BAD_REQUEST, 'CUSTOMER.NOT_EXIST');
      const updateObj: Record<string, any> = {
        ...req['updateObj'],
        ...params,
      };
      if (params?.doc_number) {
        match = {
          org_id: req['user']['org_id'],
          _id: { $ne: params._id },
          doc_number: params.doc_number,
          is_delete: 0,
        };
        data = await this.customerDocsModel.findOne(match);
        if (data)
          return this.res.error(
            HttpStatus.BAD_REQUEST,
            'CUSTOMER.DOC_NUMBER_EXIST',
          );
      }
      match = {
        org_id: req['user']['org_id'],
        _id: params._id,
        is_delete: 0,
      };
      await this.customerDocsModel.updateOne(match, updateObj);
      return this.res.success('SUCCESS.UPDATE');
    } catch (error) {
      return this.res.error(HttpStatus.BAD_REQUEST, 'ERROR.BAD_REQ');
    }
  }
  async getProfileRequest(req: Request, params: any): Promise<any> {
    try {
      let match: Record<string, any> = {
        org_id: req['user']['org_id'],
        customer_id: req['user']['_id'],
        is_delete: 0,
      };
      let projection: Record<string, any> = {
        updated_at: 1,
        kyc_status: 1,
        status_remark: 1,
      };
      let data: Record<string, any> = await this.customerKycDetailModel.findOne(
        match,
        projection,
      );
      let customer: Record<string, any> = await this.customerModel.findOne(
        { _id: req['user']['_id'] },
        { identifier: 1 },
      );
      const finaldata = {
        data,
        customer,
      };
      return this.res.success('SUCCESS.FETCH', finaldata);
    } catch (error) {
      return this.res.error(HttpStatus.BAD_REQUEST, 'ERROR.BAD_REQ');
    }
  }
  async getBadge(req: Request, params: any): Promise<any> {
    try {
      if (!params) params = {};

      let data: Record<string, any> = {};
      let custom_date_range: Record<string, Date>;
      const customerTypeName = req['user']?.['customer_type_name'];

      let match: Record<string, any> = {
        is_delete: 0,
        org_id: req['user']['org_id'],
        customer_type_name: { $in: [customerTypeName] },
      };
      const badge: Record<string, any> = await this.badgesModel
        .findOne(match)
        .sort({ _id: -1 });
      if (badge) {
        if (badge?.slab_type === global.BADGE_SLAB_TYPE[1]) {
          const start: Date = badge.created_at;
          const end: Date = getNextDate(
            `${badge.eligible_days}d`,
            badge.created_at,
          );
          start.setUTCHours(0, 0, 0, 0);
          end.setUTCHours(23, 59, 59, 999);
          custom_date_range = {
            start,
            end,
          };
        }
        if (badge?.slab_type === global.BADGE_SLAB_TYPE[2]) {
          const start: Date = badge.start_date;
          const end: Date = badge.end_date;
          start.setUTCHours(0, 0, 0, 0);
          end.setUTCHours(23, 59, 59, 999);
          custom_date_range = {
            start,
            end,
          };
        }
        data.custom_date_range = custom_date_range;
        data.point_fixed = badge.point_fixed;
        data.title = badge.title;
      }
      return data;
    } catch (error) {
      return this.res.error(HttpStatus.BAD_REQUEST, 'ERROR.BAD_REQ', error);
    }
  }
  async assignCustomers(req: Request, params: any): Promise<any> {
    try {
      let data: Record<string, any>[] = [];

      let match: Record<string, any> = {
        is_delete: 0,
        org_id: req['user']['org_id'],
        user_id: req['user']['_id'],
      };

      // Define the fields you want to search on (customer name, contact person name, etc.)
      const searchableFields = [
        'customer_info.customer_name',
        'contact_person_Info.contact_person_name',
        'customer_info.customer_type_name',
        // Add more fields here as needed
      ];

      // Apply the common search filter function
      const filters = commonSearchFilter(params.filters, searchableFields);
      match = { ...match, ...filters }; // Merge the match conditions

      const customerLookup = this.customerLookup(req, params);
      const contactPersonLookup = this.contactPersonLookup(req, params);

      // Pagination setup
      const page: number = params?.page || global.PAGE;
      const limit: number = params?.limit || global.LIMIT;
      const skip: number = (page - 1) * limit;

      const pipelineForTotalCount: any[] = [
        { $match: match },
        ...customerLookup,
        {
          $match: {
            'customer_info.customer_type_id': toObjectId(
              params.customer_type_id,
            ),
          },
        },
        ...contactPersonLookup,
        {
          $project: {
            customer_info: 1,
            contact_person_Info: 1,
          },
        },
      ];

      // First aggregation to get the total count
      const totalCountData: Record<string, any>[] =
        await this.userToCustomerMappingModel.aggregate([
          ...pipelineForTotalCount,
          { $count: 'totalCount' },
        ]);

      const total: number =
        totalCountData.length > 0 ? totalCountData[0].totalCount : 0;

      // Second aggregation to get the paginated data
      const pipelineForData: any[] = [
        { $match: match },
        ...customerLookup,
        {
          $match: {
            'customer_info.customer_type_id': toObjectId(
              params.customer_type_id,
            ),
          },
        },
        ...contactPersonLookup,
        {
          $project: {
            customer_info: 1,
            contact_person_Info: 1,
          },
        },
        { $skip: skip }, // Apply skip for pagination
        { $limit: limit }, // Apply limit for pagination
      ];

      // Second aggregation to fetch the actual data
      data = await this.userToCustomerMappingModel.aggregate(pipelineForData);

      // Process the results (e.g., decrypting contact info, calculating achievement percentage)
      data = await Promise.all(
        data.map(async (row: any) => {
          row.customer_info.files =
            await this.sharedCustomerService.getDocument(
              row.customer_info._id,
              global.BIG_THUMBNAIL_IMAGE,
            );

          row.customer_info.target = 80;
          row.customer_info.achivement = 40;

          row.customer_info.achivement_per = calculatePercentage(
            row.customer_info.achivement,
            row.customer_info.target,
          );

          // Decrypt contact person mobile numbers
          await Promise.all(
            row.contact_person_Info.map(async (subRow: any) => {
              subRow.contact_person_mobile = await this.cryptoService.decrypt(
                subRow.contact_person_mobile,
              );
            }),
          );

          return row;
        }),
      );
      return this.res.pagination(data, total, page, limit);
    } catch (error) {
      return this.res.error(HttpStatus.BAD_REQUEST, 'ERROR.BAD_REQ', error);
    }
  }
  customerLookup(req: Request, params: any) {
    let localField = 'customer_id';
    if (params?.localField) localField = params.localField;

    const customerLookup = [
      {
        $lookup: {
          from: COLLECTION_CONST().CRM_CUSTOMERS,
          localField: localField,
          foreignField: '_id',
          as: 'customer_info',
          pipeline: [
            {
              $project: {
                _id: 1,
                customer_name: 1,
                customer_type_name: 1,
                customer_type_id: 1,
                country: 1,
                state: 1,
                district: 1,
                city: 1,
                pincode: 1,
                address: 1,
                status: 1,
                mobile: 1,
                email: 1,
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
    ];
    return customerLookup;
  }
  userLookup(req: Request, params: any) {
    let localField = 'user_id';
    if (params?.localField) localField = params.localField;

    const userLookup = [
      {
        $lookup: {
          from: COLLECTION_CONST().CRM_USERS,
          localField: 'user_id',
          foreignField: '_id',
          as: 'user_info',
          pipeline: [
            {
              $project: {
                _id: 1,
                name: 1,
                email: 1,
                user_code: 1,
                reporting_manager_name: 1,
                designation: 1,
              },
            },
          ],
        },
      },
      {
        $unwind: {
          path: '$user_info',
          preserveNullAndEmptyArrays: true,
        },
      },
    ];
    return userLookup;
  }
  contactPersonLookup(req: Request, params: any) {
    const contactPersonLookup = [
      {
        $lookup: {
          from: COLLECTION_CONST().CRM_CUSTOMER_CONTACT_PERSON,
          localField: 'customer_id',
          foreignField: 'customer_id',
          as: 'contact_person_Info',
          pipeline: [
            {
              $project: {
                contact_person_name: 1,
                contact_person_mobile: 1,
                designation: 1,
              },
            },
          ],
        },
      },
    ];
    return contactPersonLookup;
  }
  async getCustomerAssigning(req: Request, params: any): Promise<any> {
    try {
      let data: Record<string, any>[] = [];
      let match: Record<string, any> = {
        is_delete: 0,
        org_id: req['user']['org_id'],
        parent_customer_id: params.customer_id,
      };

      params.localField = 'child_customer_id';
      const customerLookup: any[] = this.customerLookup(req, params);

      const pipeline: any[] = [
        { $match: match },
        ...customerLookup,
        {
          $project: {
            customer_info: 1,
          },
        },
      ];
      data = await this.customerToCustomerMappingModel.aggregate(pipeline);
      return data;
    } catch (error) {
      throw error;
    }
  }
  async getUserAssigning(req: Request, params: any): Promise<any> {
    try {
      let data: Record<string, any>[] = [];
      let match: Record<string, any> = {
        is_delete: 0,
        org_id: req['user']['org_id'],
        customer_id: params.customer_id,
      };

      const userLookup: any[] = this.userLookup(req, params);

      const pipeline: any[] = [
        { $match: match },
        ...userLookup,
        {
          $project: {
            user_info: 1,
          },
        },
      ];
      data = await this.userToCustomerMappingModel.aggregate(pipeline);

      data = await Promise.all(
        data.map(async (item: any) => {
          item.files = await this.sharedUserService.getDocument(
            item._id,
            global.THUMBNAIL_IMAGE,
          );
          return item;
        }),
      );
      return data;
    } catch (error) {
      throw error;
    }
  }
  async customersAssignedtoUser(req: Request, params: any): Promise<any> {
    try {
      let data: Record<string, any>[] = [];

      let match: Record<string, any> = {
        is_delete: 0,
        org_id: req['user']['org_id'],
        user_id: req['user']['_id'],
      };

      const searchableFields = ['customer_info.customer_name'];
      const filters = commonSearchFilter(params.filters, searchableFields);
      match = { ...match, ...filters };

      const moduleId = global.MODULES['Customers'];
      const moduleName = Object.keys(global.MODULES).find(
        (key) => global.MODULES[key] === global.MODULES['Customers'],
      );

      const customerLookup = [
        {
          $lookup: {
            from: COLLECTION_CONST().CRM_CUSTOMERS,
            let: { customerId: '$customer_id' },
            pipeline: [
              {
                $match: {
                  $expr: {
                    $and: [
                      { $eq: ['$_id', '$$customerId'] },
                      {
                        $eq: [
                          '$customer_type_id',
                          toObjectId(params.customer_type_id),
                        ],
                      },
                      { $ne: ['$profile_status', PrimaryProfileStatus.LEAD] },
                    ],
                  },
                },
              },
              {
                $project: {
                  label: '$customer_name',
                  value: '$_id',
                  mobile: 1,
                  customer_type_id: 1,
                  customer_type_name: 1,
                  login_type_id: 1,
                  form_data: 1
                }
              }
            ],
            as: 'customer_info',
          },
        },
        { $unwind: '$customer_info' },
      ];

      const page: number = params?.page || global.PAGE;
      const limit: number = params?.limit || global.LIMIT;
      const skip: number = (page - 1) * limit;

      const totalCountData = await this.userToCustomerMappingModel.aggregate([
        { $match: match },
        ...customerLookup,
        { $count: 'totalCount' },
      ]);
      const total: number =
        totalCountData.length > 0 ? totalCountData[0].totalCount : 0;

      data = await this.userToCustomerMappingModel.aggregate([
        { $match: match },
        ...customerLookup,
        {
          $addFields: {
            module_id: moduleId,
            module_name: moduleName,
          },
        },
        {
          $project: {
            _id: 0,
            label: '$customer_info.label',
            value: '$customer_info.value',
            mobile: '$customer_info.mobile',
            customer_type_id: '$customer_info.customer_type_id',
            customer_type_name: '$customer_info.customer_type_name',
            login_type_id: '$customer_info.login_type_id',
            form_data: '$customer_info.form_data',
            module_id: 1,
            module_name: 1
          }
        },
        { $skip: skip },
        { $limit: limit },
      ]);

      if (!data || data.length === 0) {
        return this.res.error(HttpStatus.NOT_FOUND, 'ERROR.NOT_FOUND');
      }

      return this.res.pagination(data, total, page, limit);
    } catch (error) {
      return this.res.error(HttpStatus.BAD_REQUEST, 'ERROR.BAD_REQ', error);
    }
  }
}
