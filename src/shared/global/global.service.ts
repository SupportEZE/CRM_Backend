import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { TicketModel } from 'src/modules/master/ticket/models/ticket.model';
import { FollowupModel } from 'src/modules/sfa/followup/models/followup.model';
import { StockAuditModel } from 'src/modules/sfa/stock/models/stock-audit.model';
import { CustomFormModel } from '../form-builder/models/custom-form.model';
import { PaymentModel } from 'src/modules/sfa/payment/models/payment.model';
import { BrandAuditModel } from 'src/modules/sfa/brand-audit/models/brand-audit.model';
import { PopGiftTransactionModel } from 'src/modules/sfa/pop-gift/models/pop-gift-transaction.model';
import { EventPlanModel } from 'src/modules/sfa/event-plan/models/event-plan.model';
import {
  calculatePercentage,
  convertToUtcRange,
  tat,
  toObjectId,
} from 'src/common/utils/common.utils';
import { SitesModel } from 'src/modules/sfa/sites/models/sites.model';
import { PrimaryOrderModel } from 'src/modules/sfa/order/models/primary-order.model';
import { SecondaryOrderModel } from 'src/modules/sfa/secondary-order/models/secondary-order.model';
import { UnpaidInvoiceModel } from 'src/modules/dms/unpaid-invoice/models/unpaid-invoice.model';
import { CustomerOtherDetailModel } from 'src/modules/master/customer/default/models/customer-other-detail.model';
import { AppTargetService } from 'src/modules/sfa/target/app/app-target.service';
import { ActiveTabEnum } from 'src/modules/sfa/target/web/dto/target.dto';
import { AttendanceModel } from 'src/modules/sfa/attendance/models/attendance.model';
import { CustomerModel } from 'src/modules/master/customer/default/models/customer.model';
import { EnquiryModel } from 'src/modules/sfa/enquiry/default/models/enquiry.model';

@Injectable()
export class GlobalService {
  constructor(
    @InjectModel(TicketModel.name) private ticketModel: Model<TicketModel>,
    @InjectModel(FollowupModel.name)
    private followupModel: Model<FollowupModel>,
    @InjectModel(StockAuditModel.name)
    private stockauditModel: Model<StockAuditModel>,
    @InjectModel(EnquiryModel.name) private enquiryModel: Model<EnquiryModel>,
    @InjectModel(PaymentModel.name) private paymentModel: Model<PaymentModel>,
    @InjectModel(CustomFormModel.name)
    private customFormModel: Model<CustomFormModel>,
    @InjectModel(BrandAuditModel.name)
    private brandAuditModel: Model<BrandAuditModel>,
    @InjectModel(PopGiftTransactionModel.name)
    private popGiftTransactionModel: Model<PopGiftTransactionModel>,
    @InjectModel(EventPlanModel.name)
    private eventPlanModel: Model<EventPlanModel>,
    @InjectModel(SitesModel.name) private sitesModel: Model<SitesModel>,
    @InjectModel(PrimaryOrderModel.name)
    private primaryOrderModel: Model<PrimaryOrderModel>,
    @InjectModel(SecondaryOrderModel.name)
    private secondaryOrderModel: Model<SecondaryOrderModel>,
    @InjectModel(UnpaidInvoiceModel.name)
    private unpaidInvoiceModel: Model<UnpaidInvoiceModel>,
    @InjectModel(CustomerOtherDetailModel.name)
    private customerOtherDetailModel: Model<CustomerOtherDetailModel>,
    @InjectModel(AttendanceModel.name)
    private attendanceModel: Model<AttendanceModel>,
    @InjectModel(CustomerModel.name)
    private customerModel: Model<CustomerModel>,
    private readonly appTargetService: AppTargetService,
  ) {}

  async visitActivityStockAudit(req: Request, params: any): Promise<any> {
    try {
      let match: Record<string, any> = {
        is_delete: 0,
        org_id: req['user']['org_id'],
        visit_activity_id: params.visit_activity_id,
      };
      const data: Record<string, any> = await this.stockauditModel.findOne(
        match,
        { _id: 1 },
      );
      return data;
    } catch (error) {
      throw error;
    }
  }
  async visitActivityTicket(req: Request, params: any): Promise<any> {
    try {
      let match: Record<string, any> = {
        is_delete: 0,
        org_id: req['user']['org_id'],
        visit_activity_id: params.visit_activity_id,
      };
      const data: Record<string, any> = await this.ticketModel.findOne(match, {
        _id: 1,
      });
      return data;
    } catch (error) {
      throw error;
    }
  }
  async visitActivityFollowup(req: Request, params: any): Promise<any> {
    try {
      let match: Record<string, any> = {
        is_delete: 0,
        org_id: req['user']['org_id'],
        visit_activity_id: params.visit_activity_id,
      };
      const data: Record<string, any> = await this.followupModel.findOne(
        match,
        { _id: 1 },
      );
      return data;
    } catch (error) {
      throw error;
    }
  }
  async visitActivityEnquiry(req: Request, params: any): Promise<any> {
    try {
      let match: Record<string, any> = {
        is_delete: 0,
        org_id: req['user']['org_id'],
        visit_activity_id: params.visit_activity_id,
      };
      const data: Record<string, any> = await this.enquiryModel.findOne(match, {
        _id: 1,
      });
      return data;
    } catch (error) {
      throw error;
    }
  }
  async visitActivityPayment(req: Request, params: any): Promise<any> {
    try {
      let match: Record<string, any> = {
        is_delete: 0,
        org_id: req['user']['org_id'],
        visit_activity_id: params.visit_activity_id,
      };
      const data: Record<string, any> = await this.paymentModel.findOne(match, {
        _id: 1,
      });
      return data;
    } catch (error) {
      throw error;
    }
  }
  async visitActivityBrandAudit(req: Request, params: any): Promise<any> {
    try {
      let match: Record<string, any> = {
        is_delete: 0,
        org_id: req['user']['org_id'],
        visit_activity_id: params.visit_activity_id,
      };
      const data: Record<string, any> = await this.brandAuditModel.findOne(
        match,
        { _id: 1 },
      );
      return data;
    } catch (error) {
      throw error;
    }
  }
  async visitActivityPopGiftTxn(req: Request, params: any): Promise<any> {
    try {
      let match: Record<string, any> = {
        is_delete: 0,
        org_id: req['user']['org_id'],
        visit_activity_id: params.visit_activity_id,
      };
      const data: Record<string, any> =
        await this.popGiftTransactionModel.findOne(match, { _id: 1 });
      return data;
    } catch (error) {
      throw error;
    }
  }

  async getCustomFormData(orgId: number, formId: number) {
    const where = {
      org_id: orgId,
      form_id: formId,
      is_delete: 0,
    };
    const projection: Record<string, any> = {
      _id: 1,
      form_id: 1,
      form_data: 1,
      form_type: 1,
      form_source: 1,
    };
    return await this.customFormModel.findOne(where, projection).lean();
  }

  async getEventByIds(req: Request, params: any) {
    const where = {
      org_id: req['user']['org_id'],
      _id: toObjectId(params.event_plan_id),
      is_delete: 0,
    };
    const projection: Record<string, any> = {
      _id: 1,
      event_type: 1,
      event_date: 1,
      assigned_to_user_id: 1,
    };
    return await this.eventPlanModel.findOne(where, projection).lean();
  }

  async getEnquiryById(req: Request, params: any): Promise<any> {
    const enquiry = await this.enquiryModel.findOne({
      _id: toObjectId(params.customer_id),
    });
    return enquiry;
  }

  async getSiteById(req: Request, params: any): Promise<any> {
    const site = await this.sitesModel.findOne({
      _id: toObjectId(params.customer_id),
    });
    return site;
  }

  async customerLastOrder(req: Request, params: any): Promise<any> {
    try {
      let OrderModel;
      if (
        params.login_type_id === global.LOGIN_TYPE_ID['PRIMARY'] ||
        params.login_type_id === global.LOGIN_TYPE_ID['SUB_PRIMARY']
      ) {
        OrderModel = this.primaryOrderModel;
      } else {
        OrderModel = this.secondaryOrderModel;
      }

      const match: Record<string, any> = {
        is_delete: 0,
        org_id: req['user']['org_id'],
      };

      if (req?.url.includes(global.MODULE_ROUTES[1])) {
        match.created_id = toObjectId(req['user']['_id']);
      }

      if (Array.isArray(params.customer_id)) {
        match.customer_id = { $in: params.customer_id };
      } else {
        match.customer_id = params.customer_id;
      }

      const pipeline = [
        { $match: match },
        { $sort: { created_at: -1 as const } },
        {
          $group: {
            _id: '$customer_id',
            last_order: { $first: '$$ROOT' },
          },
        },
        { $replaceRoot: { newRoot: '$last_order' } },
        {
          $project: {
            customer_id: 1,
            created_at: 1,
            amount: '$net_amount_with_tax',
          },
        },
      ];

      const data: Record<string, any>[] = await OrderModel.aggregate(pipeline);
      return data.map((row) => ({
        ...row,
        tat: tat(new Date(), row.created_at, global.TAT_UNIT[1]),
      }));
    } catch (error) {
      throw error;
    }
  }

  async readCreditData(req: Request, params: any): Promise<any> {
    try {
      const match: Record<string, any> = {
        org_id: req['user']['org_id'],
        is_delete: 0,
        customer_id: toObjectId(params.customer_id),
      };

      const data: Record<string, any> = await this.customerOtherDetailModel
        .findOne(match)
        .sort({ _id: -1 })
        .lean();
      const credit_days = data?.credit_days || 0;
      const credit_limit = data?.credit_limit || 0;

      const unpaid_invoices: any[] = await this.unpaidInvoiceModel
        .find(match)
        .lean();

      let outstanding = 0;
      let overdue = 0;
      const today = new Date();

      for (const invoice of unpaid_invoices) {
        const pendingAmount =
          (invoice.net_amount || 0) - (invoice.received_amount || 0);

        if (pendingAmount > 0) {
          outstanding += pendingAmount;

          if (invoice.billing_date) {
            const dueDate = new Date(invoice.billing_date);
            dueDate.setDate(dueDate.getDate() + credit_days);

            if (today > dueDate) {
              overdue += pendingAmount;
            }
          }
        }
      }

      const credit_utilization = calculatePercentage(outstanding, credit_limit);
      const overdue_percentage = calculatePercentage(overdue, outstanding);

      const finalJson = {
        credit_limit,
        credit_days,
        outstanding,
        overdue,
        credit_utilization: +credit_utilization.toFixed(0),
        overdue_percentage: +overdue_percentage.toFixed(0),
      };

      return finalJson;
    } catch (error) {
      throw error;
    }
  }

  async orderAndTargetDashboard(req: Request, params: any): Promise<any> {
    try {
      let target_data: Record<string, any> = { tat: '0 days' };
      let primary_order_data: Record<string, any> = {
        total_count: 0,
        total_net_amount_with_tax: 0,
        progress: 0,
        tat: '0 days',
      };
      let secondary_order_data: Record<string, any> = {
        total_count: 0,
        total_net_amount_with_tax: 0,
        progress: 0,
        tat: '0 days',
      };
      let response: Record<string, any> = {};

      params.activeTab = ActiveTabEnum.TIMELINE;
      params.internalCall = true;
      const target: Record<string, any> = await this.appTargetService.read(
        req,
        params,
      );

      target_data.total_target = target?.overall_summary?.total_target || 0;
      target_data.total_achieved = target?.overall_summary?.total_achieved || 0;
      target_data.progress = target?.overall_summary?.progress || 0;
      target_data.required_rate = target?.target_analytics?.required_rate || 0;

      const { start, end } = convertToUtcRange(new Date());

      const match: Record<string, any> = {
        is_delete: 0,
        created_id: req['user']['_id'],
        org_id: req['user']['org_id'],
        created_at: {
          $gte: start,
          $lte: end,
        },
      };

      let result = await this.primaryOrderModel.aggregate([
        { $match: match },
        {
          $group: {
            _id: null,
            total_count: { $sum: 1 },
            total_net_amount_with_tax: { $sum: '$net_amount_with_tax' },
            last_created_at: { $max: '$created_at' },
          },
        },
      ]);
      if (result?.[0]) {
        primary_order_data.total_net_amount_with_tax =
          result?.[0].total_net_amount_with_tax;
        primary_order_data.total_count = result?.[0].total_count;
        primary_order_data.tat = tat(result?.[0].last_created_at, new Date());
        primary_order_data.progress =
          calculatePercentage(
            result?.[0].total_net_amount_with_tax,
            target_data.required_rate,
          ) || 0;
        target_data.tat = tat(result?.[0].last_created_at, new Date());
      }

      result = await this.secondaryOrderModel.aggregate([
        { $match: match },
        {
          $group: {
            _id: null,
            total_count: { $sum: 1 },
            total_net_amount_with_tax: { $sum: '$net_amount_with_tax' },
            last_created_at: { $max: '$created_at' },
          },
        },
      ]);
      if (result?.[0]) {
        secondary_order_data.total_net_amount_with_tax =
          result?.[0].total_net_amount_with_tax;
        secondary_order_data.total_count = result?.[0].total_count;
        secondary_order_data.tat = tat(result?.[0].last_created_at, new Date());
        secondary_order_data.progress =
          calculatePercentage(
            result?.[0].total_net_amount_with_tax,
            target_data.required_rate,
          ) || 0;
      }

      return (response = {
        target_data,
        primary_order_data,
        secondary_order_data,
      });
    } catch (error) {
      throw error;
    }
  }

  async getPunchInAddress(req: any, params: any): Promise<any> {
    const { start, end } = convertToUtcRange(new Date());

    const match: Record<string, any> = {
      user_id: toObjectId(params.user_id),
      created_at: { $gte: start, $lte: end },
    };

    const data: Record<string, any> = await this.attendanceModel
      .findOne(match)
      .sort({ _id: -1 })
      .select('start_address start_lat start_lng');
    return data;
  }

  async updateCustomerActivityData(req: any, params: any): Promise<any> {
    try {
      let updateObj: Record<string, any> = {};
      if (req.url.includes(global.MODULE_ROUTES[1])) {
        updateObj = {
          last_checkin_id: params.checkin_id,
          last_checkin_Date: params.checkin_date,
        };
      }

      if (req.url.includes(global.MODULE_ROUTES[2])) {
        updateObj = {
          last_order_id: params.order_id,
          last_order_date: params.order_date,
        };
      }

      await this.customerModel.updateOne(
        { _id: params.customer_id },
        updateObj,
      );
    } catch (error) {
      throw error;
    }
  }

  async visitActivityOrder(req: Request, params: any): Promise<any> {
    try {
      let match: Record<string, any> = {
        is_delete: 0,
        org_id: req['user']['org_id'],
        visit_activity_id: params.visit_activity_id,
      };
      let data: Record<string, any> = await this.primaryOrderModel.findOne(
        match,
        { _id: 1 },
      );
      if (!data)
        data = await this.secondaryOrderModel.findOne(match, { _id: 1 });
      return data;
    } catch (error) {
      throw error;
    }
  }

  async getModuleAssignedCount(
    moduleName: string,
    userId: string,
    orgId: number,
  ): Promise<number> {
    const match = {
      assigned_to_user_id: userId,
      org_id: orgId,
      is_delete: 0,
    };

    switch (moduleName) {
      case 'Enquiry':
        return await this.enquiryModel.countDocuments(match);

      case 'Site-Project':
        return await this.sitesModel.countDocuments(match);
      default:
        return 0;
    }
  }

  async getModuleAssignedDetails(
    moduleName: string,
    userId: string,
    orgId: number,
    page: number = 1,
    limit: number = 10,
  ): Promise<{ result: any[]; total: number }> {
    const skip = (page - 1) * limit;

    const match = {
      assigned_to_user_id: userId,
      org_id: orgId,
      is_delete: 0,
    };

    let model;
    switch (moduleName) {
      case 'Enquiry':
        model = this.enquiryModel;
        break;
      case 'Site':
        model = this.sitesModel;
        break;
      default:
        return { result: [], total: 0 };
    }

    const [total, result] = await Promise.all([
      model.countDocuments(match),
      model.find(match).skip(skip).limit(limit).lean(),
    ]);

    return { result, total };
  }

  async getModuleCheckInDetails(
    moduleId: number,
    userId: string,
  ): Promise<{ result: any }> {
    const match = {
      _id: userId,
      is_delete: 0,
    };

    let model;
    switch (moduleId) {
      case 11:
        model = this.enquiryModel;
        break;
      case 24:
        model = this.sitesModel;
        break;
      default:
        return { result: {} };
    }

    const result = await model.findOne(match).lean();

    return { result };
  }
}
