import { Injectable, HttpStatus } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { ResponseService } from 'src/services/response.service';
import { AttendanceModel } from '../../attendance/models/attendance.model';
import { BannerModel } from 'src/modules/master/app-content/banner/models/banner.model';
import {
  calculatePercentage,
  convertToUtcRange,
  tat,
  toObjectId,
} from 'src/common/utils/common.utils';
import { CustomerService } from 'src/modules/master/customer/default/web/customer.service';
import {
  ChatRoomModel,
  RoomType,
} from 'src/modules/chat/models/chat-room.model';
import { RedeemRequestModel } from 'src/modules/loyalty/redeem-request/models/redeem-request.model';
import { ChatModel } from 'src/modules/chat/models/chat.model';
import { InvoiceModel } from 'src/modules/dms/invoice/models/invoice.model';
import { UserToCustomerMappingModel } from 'src/modules/master/customer/default/models/user-to-customer-mapping.model';
import { COLLECTION_CONST } from 'src/config/collection.constant';
import { BannerService } from 'src/modules/master/app-content/banner/web/banner.service';
import { ReferralBonusModel } from 'src/modules/master/referral-bonus/models/referral-bonus.model';
import { SharedCustomerService } from 'src/modules/master/customer/shared-customer.service';
import { InsideBannerService } from 'src/shared/inside-banner/inside-banner.service';
import { AppExpenseService } from '../../expense/app/app-expense.service';
import { LeaveService } from '../../leave/web/leave.service';
import { SharedUserService } from 'src/modules/master/user/shared-user.service';
import { GlobalService } from 'src/shared/global/global.service';
import { SharedActivityService } from '../../activity/shared-activity.service';
import { FollowupService } from '../../followup/web/followup.service';
import { CustomerKycDetailModel } from 'src/modules/master/customer/default/models/customer-kyc-details.model';
import { CustomerToCustomerStockModel } from 'src/modules/dms/stock-transfer/models/customer-customer-stock.model';
// import { DefaultEnquiryService } from '../../enquiry/default/web/default-enquiry.serive';
import { EnquiryStrategyFactory } from '../../enquiry/enquiry-strategy.factory';
@Injectable()
export class AppHomeService {
  constructor(
    @InjectModel(AttendanceModel.name)
    private attendanceModel: Model<AttendanceModel>,
    @InjectModel(BannerModel.name) private bannerModel: Model<BannerModel>,
    @InjectModel(ChatRoomModel.name)
    private chatRoomModel: Model<ChatRoomModel>,
    @InjectModel(CustomerToCustomerStockModel.name)
    private customerToCustomerStockModel: Model<CustomerToCustomerStockModel>,
    @InjectModel(RedeemRequestModel.name)
    private redeemRequestModel: Model<RedeemRequestModel>,
    @InjectModel(ChatModel.name) private chatModel: Model<ChatModel>,
    @InjectModel(InvoiceModel.name) private invoiceModel: Model<InvoiceModel>,
    @InjectModel(ReferralBonusModel.name)
    private referralBonusModel: Model<ReferralBonusModel>,
    @InjectModel(UserToCustomerMappingModel.name)
    private userToCustomerMappingModel: Model<UserToCustomerMappingModel>,
    @InjectModel(CustomerKycDetailModel.name)
    private customerKycDetailModel: Model<CustomerKycDetailModel>,
    private readonly res: ResponseService,
    private readonly customerService: CustomerService,
    private readonly bannerService: BannerService,
    private readonly sharedCustomerService: SharedCustomerService,
    private readonly insideBannerService: InsideBannerService,
    private readonly appExpenseService: AppExpenseService,
    private readonly leaveService: LeaveService,
    private readonly sharedUserService: SharedUserService,
    private readonly globalService: GlobalService,
    private readonly sharedActivityService: SharedActivityService,
    private readonly followupService: FollowupService,
    private readonly enquiryStrategyFactory: EnquiryStrategyFactory,
  ) {}

  async read(req: Request, params: any): Promise<any> {
    try {
      if (!params) params = {};
      params.internalCall = true;
      const [profilePercentage, roomId, chatId] = await Promise.all([
        this.profilePercentageInfo(req, params),
        this.getRoomId(req, params),
        this.getChatId(req, params),
      ]);

      let loginInfo: Record<string, any> = req['user'];
      delete loginInfo.jwt_app_token;
      delete loginInfo.jwt_web_token;
      delete loginInfo.is_delete;

      loginInfo.room_id = roomId;
      loginInfo.chat_id = chatId;
      loginInfo.files = await this.sharedCustomerService.getDocument(
        loginInfo._id,
        global.BIG_THUMBNAIL_IMAGE,
        'Profile Pic',
      );

      const kycData: Record<string, any> = await this.readKycData(req, params);
      loginInfo.kyc_status = kycData.kyc_status || '';

      const referral = await this.referralBonusModel.findOne({
        org_id: req['user']['org_id'],
        bonus_type: global.BONUS_TYPES[4],
        customer_type_id: toObjectId(req['user']['customer_type_id']),
        status: global.STATUS[1],
        is_delete: 0,
      });

      if (referral?.bonus_point > 0) {
        loginInfo.invite_point = referral.bonus_point;
      } else {
        loginInfo.invite_point = 0;
      }
      let data: Record<any, any> = {
        login_info: loginInfo,
        profile_percentage: profilePercentage,
      };

      const loginTypeId = req['user']['login_type_id'];
      if (
        [
          global.LOGIN_TYPE_ID['INFLUENCER'],
          global.LOGIN_TYPE_ID['PRIMARY'],
        ].includes(loginTypeId)
      ) {
        let customerHome: Record<string, any> = await this.customerHome(
          req,
          params,
        );
        ((data.banners = customerHome.banners),
          (data.credit_summary = customerHome.credit_data));
        data.invoice_summary = customerHome.invoice_data;
      }
      if (req['user']['login_type_id'] === global.LOGIN_TYPE_ID['FIELD_USER']) {
        loginInfo.files = await this.sharedUserService.getDocument(
          loginInfo._id,
          global.THUMBNAIL_IMAGE,
        );
        data.login_info = loginInfo;
        let userHome: Record<string, any> = await this.userHome(req, params);
        data.attendance = userHome.attendance;
        data.assign_customer_types = userHome.assign_customer_types;
        data.expense = userHome?.expense || null;
        data.leave = userHome?.leave || null;
        data.primary_order =
          userHome?.orderAndTarget?.primary_order_data || null;
        data.secondary_order =
          userHome?.orderAndTarget?.secondary_order_data || null;
        data.target = userHome?.orderAndTarget?.target_data || null;
        data.visit = userHome?.visit || null;
        data.enquiry = userHome?.enquiry || null;
        data.followup = userHome?.followup || null;
      }

      const orgId = req['user']['org_id'];

      const outgoingMatch = {
        is_delete: 0,
        org_id: orgId,
        transaction_type: 'Outgoing',
      };

      const returnMatch = {
        is_delete: 0,
        org_id: orgId,
        transaction_type: 'Return',
        status: 'Approved',
      };

      const [stockresult, stockreturnresult] = await Promise.all([
        this.getStockSummary(outgoingMatch),
        this.getStockSummary(returnMatch),
      ]);

      params.banner_name = global.INSIDE_BANNER[2];
      data.purchase_details = stockresult;
      data.return_purchase_details = stockreturnresult;
      data.inside_banner = await this.insideBannerService.read(req, params);
      return this.res.success('SUCCESS.FETCH', data);
    } catch (error) {
      return this.res.error(HttpStatus.BAD_REQUEST, 'ERROR.BAD_REQ', error);
    }
  }
  async getStockSummary(matchStage: any): Promise<{
    totalCount: number;
    totalAmount: number;
    lastBillDate: Date | null;
    lastBillAmount: number;
  }> {
    const records = (await this.customerToCustomerStockModel
      .find(matchStage)
      .sort({ bill_date: -1 })
      .lean()
      .exec()) as CustomerToCustomerStockModel[];

    const totalCount = records.length;
    const totalAmount = records.reduce(
      (sum, r) => sum + (r.bill_amount || 0),
      0,
    );
    const lastBillDate = records[0]?.bill_date || null;
    const lastBillAmount = records[0]?.bill_amount || 0;

    return {
      totalCount,
      totalAmount,
      lastBillDate,
      lastBillAmount,
    };
  }
  async userHome(req: Request, params: any): Promise<any> {
    try {
      const enquiryService = this.enquiryStrategyFactory.getStrategy(
        req['user']['org_id'],
      );

      const [
        attendance,
        assignCustomerTypes,
        expense,
        leave,
        orderAndTarget,
        visit,
        enquiry,
        followup,
      ] = await Promise.all([
        this.readAttendance(req, params),
        this.assignCustomerTypes(req, params),
        this.expenseDashboard(req, params),
        this.leaveDashboard(req, params),
        this.globalService.orderAndTargetDashboard(req, params),
        this.visitDashboard(req, params),
        enquiryService.enquiryDashboard(req, params),
        this.followupService.followupDashboard(req, params),
      ]);
      return {
        attendance,
        assign_customer_types: assignCustomerTypes,
        expense,
        leave,
        orderAndTarget,
        visit,
        enquiry,
        followup,
      };
    } catch (error) {
      throw error;
    }
  }
  async customerHome(req: Request, params: any): Promise<any> {
    try {
      if (!params) params = {};
      params.internalCall = true;
      params.customer_id = req['user']['_id'];

      const [banners, credit_data, invoice_data] = await Promise.all([
        this.readBanners(req, params),
        this.globalService.readCreditData(req, params),
        this.readInvoiceData(req, params),
      ]);
      let data: Record<any, any> = {
        banners: banners,
        credit_data: credit_data,
        invoice_data: invoice_data,
      };
      return data;
    } catch (error) {
      throw error;
    }
  }
  async expenseDashboard(req: Request, params: any): Promise<any> {
    try {
      params.internalCall = true;
      let data: Record<string, any> =
        await this.appExpenseService.getExpenseSummary(req, params);
      data.percentage = calculatePercentage(
        data.total_paid_amount,
        data.total_claim_amount,
      );
      return data;
    } catch (error) {
      throw error;
    }
  }
  async leaveDashboard(req: Request, params: any): Promise<any> {
    try {
      params.internalCall = true;
      let data: Record<string, any> = await this.leaveService.getLeaveTypes(
        req,
        params,
      );
      if (data?.length > 0) {
        data = data.reduce(
          (acc: any, item: any) => {
            acc.total += item.total || 0;
            acc.balance += item.balance || 0;
            return acc;
          },
          { total: 0, balance: 0 },
        );
      } else {
        data = { total: 0, balance: 0 };
      }
      data.tat = await this.leaveService.lastLeave(req, params);
      data.percentage = calculatePercentage(data.balance, data.total);
      return data;
    } catch (error) {
      throw error;
    }
  }
  async visitDashboard(req: Request, params: any): Promise<any> {
    try {
      const assignBeats: number =
        await this.sharedCustomerService.beatCustomers(req, params);
      const total = assignBeats?.[0]?.total || 0;
      params.customer_ids = assignBeats?.[0]?.uniqueCustomerIds || [];
      const visit: Record<string, any> =
        await this.sharedActivityService.todayActivityData(req, params);
      const achieved = visit?.total_count;
      const progress = calculatePercentage(achieved, total);
      let tatOf = '0 days';
      if (visit?.last_activity) tatOf = tat(visit.last_activity, new Date());
      return {
        total,
        achieved,
        progress,
        tat: tatOf,
      };
    } catch (error) {
      throw error;
    }
  }
  async readAttendance(req: Request, params: any): Promise<any> {
    try {
      const { start, end } = convertToUtcRange(new Date());

      let attendance: Record<string, any> = await this.attendanceModel
        .findOne({
          user_id: req['user']['_id'],
          attend_date: {
            $gte: start,
            $lte: end,
          },
          is_delete: 0,
        })
        .select('punch_in punch_out attend_date form_data')
        .lean();
      if (attendance) {
        attendance.tat = tat(attendance.punch_in, new Date());
        if (attendance?.punch_out)
          attendance.tat = tat(attendance.punch_in, attendance.punch_out);
      }

      return attendance;
    } catch (error) {
      throw error;
    }
  }
  async readBanners(req: Request, params: any): Promise<any> {
    try {
      const match: Record<string, any> = {
        org_id: req['user']['org_id'],
        is_delete: 0,
        customer_type_id: req['user']['customer_type_id'].toString(),
      };

      let data: Record<string, any> = await this.bannerModel
        .find(match)
        .sort({ _id: -1 })
        .lean();

      data = await Promise.all(
        data.map(async (item: any) => {
          item.files = await this.bannerService.getDocument(item._id);
          return item;
        }),
      );

      const allFiles = data.reduce((acc, item) => {
        return acc.concat(item.files);
      }, []);
      return allFiles;
    } catch (error) {
      throw error;
    }
  }
  async readKycData(req: Request, params: any): Promise<any> {
    try {
      params.customer_id = req['user']['_id'];

      const match: Record<string, any> = {
        org_id: req['user']['org_id'],
        is_delete: 0,
        customer_id: toObjectId(params.customer_id),
      };

      const data = await this.customerKycDetailModel
        .findOne(match)
        .lean()
        .exec();
      return data || {};
    } catch (error) {
      throw error;
    }
  }
  async readInvoiceData(req: Request, params: any): Promise<any> {
    try {
      const orgId = req['user']['org_id'];
      const customerId = req['user']['_id'];

      const matchBase = {
        org_id: orgId,
        is_delete: 0,
        customer_id: customerId,
      };

      // 1. Latest invoice with PENDING GRN
      const pending_grn = await this.invoiceModel
        .findOne({
          ...matchBase,
          grn_status: global.APPROVAL_STATUS[0], // e.g., 'PENDING'
        })
        .sort({ _id: -1 })
        .lean();

      // 2. Latest invoice with PENDING or APPROVED GRN
      const latest_invoice = await this.invoiceModel
        .findOne({
          ...matchBase,
          grn_status: {
            $in: [global.APPROVAL_STATUS[0], global.APPROVAL_STATUS[5]],
          },
        })
        .sort({ _id: -1 })
        .lean();

      // 3. Sum of invoice amount with PENDING GRN
      const totalAgg = await this.invoiceModel.aggregate([
        {
          $match: {
            ...matchBase,
            grn_status: global.APPROVAL_STATUS[0],
          },
        },
        {
          $group: {
            _id: null,
            total_amount: { $sum: '$net_amount_with_tax' },
          },
        },
      ]);

      const total_invoice_amount = totalAgg[0]?.total_amount || 0;

      // 4. Latest invoice with billing_date and amount for GRN = PENDING
      const latest_invoice_amount_detail = await this.invoiceModel
        .findOne(
          {
            ...matchBase,
            grn_status: global.APPROVAL_STATUS[0],
          },
          {
            billing_date: 1,
            net_amount_with_tax: 1,
          },
        )
        .sort({ _id: -1 })
        .lean();

      // ✅ Final JSON to return
      const finalJson = {
        pending_grn,
        latest_invoice,
        total_invoice_amount,
        latest_invoice_amount_detail,
      };

      return finalJson;
    } catch (error) {
      return this.res.error(HttpStatus.BAD_REQUEST, 'ERROR.BAD_REQ', error);
    }
  }
  async profilePercentageInfo(req: Request, params: any): Promise<any> {
    try {
      let percentage: number = 0;
      if (req['user']['login_type_id'] === global.LOGIN_TYPE_ID['INFLUENCER']) {
        percentage = await this.infulenceProfilePercentageInfo(req, params);
      }
      return percentage;
    } catch (error) {
      throw error;
    }
  }
  async infulenceProfilePercentageInfo(
    req: Request,
    params: any,
  ): Promise<any> {
    try {
      params._id = req['user']['_id'];
      const loginPerson = await this.customerService.detail(req, params);

      let completion = 0;

      // Basic Info (40%)
      if (loginPerson.basic_detail) {
        completion += 40;
      }

      if (
        loginPerson.doc_detail &&
        Array.isArray(loginPerson.doc_detail) &&
        loginPerson.doc_detail.length > 0
      ) {
        let totalRows = loginPerson.doc_detail.length;
        const docsFields: string[] = global.DOCS_PERCENATGE_INFO; // List of required fields
        let totalColumns = docsFields.length; // Number of required columns

        let totalRowScore = 0; // Track total contribution

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

        // Normalize final score to fit into 30%
        completion += (totalRowScore / totalRows) * 30;
      }

      // Bank Info (30%) - Count filled fields
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
  async getRoomId(req: Request, params: any) {
    try {
      let loginId: string = req['user']['_id'];
      let roomId: any = null;
      const existingRoom: Record<string, any> =
        await this.chatRoomModel.findOne({
          room_type: RoomType.PRIVATE,
          participants: {
            $all: [{ $elemMatch: { participant_id: loginId } }],
          },
        });

      if (existingRoom?._id) roomId = existingRoom._id;
      return roomId;
    } catch (error) {
      throw error;
    }
  }
  async getChatId(req: Request, params: any) {
    try {
      let loginId: string = req['user']['_id'];
      let chatId: any = null;
      const exist: Record<string, any> = await this.chatModel.findOne({
        sender_id: loginId,
      });
      if (exist?._id) chatId = exist._id;
      return chatId;
    } catch (error) {
      throw error;
    }
  }
  async readPendingRedeemPoints(req: Request, params: any) {
    try {
      let match: Record<string, any> = {
        is_delete: 0,
        org_id: req['user']['org_id'],
        customer_id: req['user']['_id'],
      };

      const pipeline: any[] = [
        {
          $match: match,
        },
        {
          $group: {
            _id: '$customer_id', // Use field reference
            total_pending_points: { $sum: '$redeem_point' }, // Use field reference
          },
        },
      ];

      const data: Record<string, any>[] =
        await this.redeemRequestModel.aggregate(pipeline);

      return data.length > 0 ? data[0] : { total_pending_points: 0 }; // Ensure a valid return
    } catch (error) {
      throw error;
    }
  }
  async assignCustomerTypes(req: Request, params: any) {
    try {
      let match: Record<string, any> = {
        is_delete: 0,
        org_id: req['user']['org_id'],
        user_id: req['user']['_id'],
      };

      const customerLookup = this.customerLookup(req, params);

      const pipeline: any[] = [
        { $match: match },
        ...customerLookup,
        {
          $match: {
            'customer_info.customer_type_name': { $ne: null },
          },
        },
        {
          $group: {
            _id: '$customer_info.customer_type_name',
            count: { $sum: 1 },
            customer_type_name: { $first: '$customer_info.customer_type_name' },
            customer_type_id: { $first: '$customer_info.customer_type_id' },
          },
        },
        {
          $project: {
            customer_type_id: 1,
            customer_type_name: 1,
            count: 1,
          },
        },
      ];

      const data: Record<string, any>[] =
        await this.userToCustomerMappingModel.aggregate(pipeline);
      return data;
    } catch (error) {
      throw error;
    }
  }
  customerLookup(req: Request, params: any) {
    const customerLookup = [
      {
        $lookup: {
          from: COLLECTION_CONST().CRM_CUSTOMERS,
          localField: 'customer_id',
          foreignField: '_id',
          as: 'customer_info',
          pipeline: [
            {
              $project: {
                _id: 1,
                customer_name: 1,
                customer_type_name: 1,
                customer_type_id: 1,
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
}
