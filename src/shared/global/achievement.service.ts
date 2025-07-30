import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { PaymentModel } from 'src/modules/sfa/payment/models/payment.model';
import { EventPlanModel } from 'src/modules/sfa/event-plan/models/event-plan.model';
import { toObjectId } from 'src/common/utils/common.utils';
import {
  SitesModel,
  SitesStatus,
} from 'src/modules/sfa/sites/models/sites.model';
import { SecondaryOrderModel } from 'src/modules/sfa/secondary-order/models/secondary-order.model';
import {
  CustomerModel,
  PrimaryProfileStatus,
} from 'src/modules/master/customer/default/models/customer.model';
import { OrderStatus } from 'src/modules/sfa/order/web/dto/order.dto';
import { VisitActivityModel } from 'src/modules/sfa/activity/models/visit-activity.model';
import { InvoiceModel } from 'src/modules/dms/invoice/models/invoice.model';
import { AdditionalTarget } from 'src/modules/sfa/target/models/target.model';
import {
  invoiceItemLookup,
  productLookup,
} from '../collection-lookups/lookups';
import { TargetTypeEnum } from 'src/modules/sfa/target/web/dto/target.dto';
import {
  EnquiryModel,
  EnquiryStatus,
} from 'src/modules/sfa/enquiry/default/models/enquiry.model';

export const AdditionalTargetArray = [
  {
    name: AdditionalTarget.SECONDARY_SALE,
    function: 'getSecondaryAchievement',
  },
  {
    name: AdditionalTarget.NEW_CUSTOMER,
    function: 'getNewCustomerAchievement',
  },
  {
    name: AdditionalTarget.ENQUIRY_COLSE,
    function: 'getEnquiryCloseAchievement',
  },
  {
    name: AdditionalTarget.SITE_CREATION,
    function: 'getSiteCreationAchievement',
  },
  {
    name: AdditionalTarget.SITE_COLSE,
    function: 'getSiteCloseAchievement',
  },
  {
    name: AdditionalTarget.CUSTOMER_VISIT,
    function: 'getCustomerVisitAchievement',
  },
  {
    name: AdditionalTarget.EVENT,
    function: 'getEventAchievement',
  },
  {
    name: AdditionalTarget.INFLUENCER_REGISTRATION,
    function: 'getNewInfulencerAchievement',
  },
  {
    name: AdditionalTarget.PAYMENT_COLLECTION,
    function: 'getPaymentCollectionAchievement',
  },
];

@Injectable()
export class GlobalAchievementService {
  constructor(
    @InjectModel(EnquiryModel.name) private enquiryModel: Model<EnquiryModel>,
    @InjectModel(PaymentModel.name) private paymentModel: Model<PaymentModel>,
    @InjectModel(EventPlanModel.name)
    private eventPlanModel: Model<EventPlanModel>,
    @InjectModel(SitesModel.name) private sitesModel: Model<SitesModel>,
    @InjectModel(SecondaryOrderModel.name)
    private secondaryOrderModel: Model<SecondaryOrderModel>,
    @InjectModel(CustomerModel.name)
    private customerModel: Model<CustomerModel>,
    @InjectModel(VisitActivityModel.name)
    private visitActivityModel: Model<VisitActivityModel>,
    @InjectModel(InvoiceModel.name) private invoiceModel: Model<InvoiceModel>,
  ) {}

  async getPrimarySaleAchievement(
    req: any,
    params: any,
    type: string = TargetTypeEnum.FIELD_USER,
  ): Promise<any> {
    try {
      const { customer_ids, start, end } = params;

      const isCustomerRoute = req?.url.includes(global.MODULE_ROUTES[27]);

      const matchStage: any = {
        $match: {
          org_id: req['user']['org_id'],
          is_delete: 0,
          customer_id: { $in: customer_ids },
        },
      };

      if (!isCustomerRoute) {
        matchStage.$match.billing_date = {
          $gte: start,
          $lte: end,
        };
      }
      const groupKey = type === TargetTypeEnum.CUSTOMER ? 'customer_id' : null;
      const groupStage = {
        $group: {
          _id: groupKey,
          customer_id: { $first: '$customer_id' },
          total_net_amount_with_tax: {
            $sum: {
              $toDouble: '$net_amount_with_tax',
            },
          },
          count: { $sum: 1 },
        },
      };

      const result = await this.invoiceModel.aggregate([
        matchStage,
        groupStage,
      ]);

      if (TargetTypeEnum.CUSTOMER) return result;
      if (type === TargetTypeEnum.CUSTOMER) return result;

      if (result.length === 0) {
        return {
          total_net_amount_with_tax: 0,
          count: 0,
          customer_id: 0,
        };
      }

      return {
        total_net_amount_with_tax: result[0].total_net_amount_with_tax || '',
        count: result[0].count || 0,
        customer_id: result[0].customer_id || '',
      };
    } catch (error) {
      throw error;
    }
  }
  async getSecondaryAchievement(req: Request, params: any): Promise<any> {
    const { start, end, customer_ids, user_id } = params;
    const isCustomerRoute = req?.url.includes(global.MODULE_ROUTES[27]);

    const match: Record<string, any> = {
      org_id: req['user']['org_id'],
      is_delete: 0,
      status: OrderStatus.Approved,
      customer_id: { $in: customer_ids },
    };

    if (!isCustomerRoute) {
      match.created_id = toObjectId(user_id);
      match.updated_at = {
        $gte: start,
        $lte: end,
      };
    }

    const matchStage = { $match: match };
    const groupStage = {
      $group: {
        _id: null,
        total_net_amount_with_tax: {
          $sum: {
            $toDouble: '$net_amount_with_tax',
          },
        },
        count: { $sum: 1 },
      },
    };

    const result = await this.secondaryOrderModel.aggregate([
      matchStage,
      groupStage,
    ]);

    if (result.length === 0) {
      return {
        total_net_amount_with_tax: 0,
        count: 0,
      };
    }

    return {
      total_net_amount_with_tax: result[0].total_net_amount_with_tax,
      count: result[0].count,
    };
  }
  async getNewCustomerAchievement(req: Request, params: any): Promise<any> {
    const { start, end, user_id } = params;
    const match: Record<string, any> = {
      created_id: toObjectId(user_id),
      org_id: req['user']['org_id'],
      is_delete: 0,
      profile_status: PrimaryProfileStatus.LEAD,
      created_at: {
        $gte: start,
        $lte: end,
      },
    };

    return await this.customerModel.countDocuments(match);
  }
  async getEnquiryCloseAchievement(req: Request, params: any): Promise<any> {
    const { start, end, user_id } = params;
    const match: Record<string, any> = {
      created_id: toObjectId(user_id),
      org_id: req['user']['org_id'],
      is_delete: 0,
      status: EnquiryStatus.WIN,
      updated_at: {
        $gte: start,
        $lte: end,
      },
    };
    return await this.enquiryModel.countDocuments(match);
  }
  async getSiteCreationAchievement(req: Request, params: any): Promise<any> {
    const { start, end, user_id } = params;
    const match: Record<string, any> = {
      created_id: toObjectId(user_id),
      org_id: req['user']['org_id'],
      is_delete: 0,
      status: { $ne: SitesStatus.WIN },
      created_at: {
        $gte: start,
        $lte: end,
      },
    };
    return await this.sitesModel.countDocuments(match);
  }
  async getSiteCloseAchievement(req: Request, params: any): Promise<any> {
    const { start, end, user_id } = params;
    const match: Record<string, any> = {
      created_id: toObjectId(user_id),
      org_id: req['user']['org_id'],
      is_delete: 0,
      status: SitesStatus.WIN,
      updated_at: {
        $gte: start,
        $lte: end,
      },
    };
    return await this.sitesModel.countDocuments(match);
  }
  async getCustomerVisitAchievement(req: Request, params: any): Promise<any> {
    const { start, end, user_id, customer_ids } = params;
    const match: Record<string, any> = {
      created_id: toObjectId(user_id),
      org_id: req['user']['org_id'],
      is_delete: 0,
      customer_id: { $in: customer_ids },
      created_at: {
        $gte: start,
        $lte: end,
      },
    };
    return await this.visitActivityModel.countDocuments(match);
  }
  async getEventAchievement(req: Request, params: any): Promise<any> {
    const { start, end, user_id } = params;
    const match: Record<string, any> = {
      created_id: toObjectId(user_id),
      org_id: req['user']['org_id'],
      is_delete: 0,
      created_at: {
        $gte: start,
        $lte: end,
      },
    };
    return await this.eventPlanModel.countDocuments(match);
  }
  async getNewInfulencerAchievement(req: Request, params: any): Promise<any> {
    const { start, end, user_id } = params;
    const match: Record<string, any> = {
      created_id: toObjectId(user_id),
      org_id: req['user']['org_id'],
      is_delete: 0,
      created_at: {
        $gte: start,
        $lte: end,
      },
    };
    return await this.customerModel.countDocuments(match);
  }
  async getPaymentCollectionAchievement(
    req: Request,
    params: any,
  ): Promise<any> {
    const { start, end, user_id } = params;
    const match: Record<string, any> = {
      created_id: toObjectId(user_id),
      org_id: req['user']['org_id'],
      is_delete: 0,
      created_at: {
        $gte: start,
        $lte: end,
      },
    };
    return await this.paymentModel.countDocuments(match);
  }

  async getCategoryWiseAchievement(req: Request, params: any): Promise<any> {
    const { start, end, customer_ids } = params;

    const match: Record<string, any> = {
      org_id: req['user']['org_id'],
      is_delete: 0,
      billing_date: {
        $gte: start,
        $lte: end,
      },
      customer_id: { $in: customer_ids },
      ...(params.category_names && params.category_names.length > 0
        ? {
            'product_info.category_name': { $in: params.category_names },
          }
        : {}),
    };

    const matchStage = { $match: match };

    const groupStage = {
      $group: {
        _id: '$invoice_item_info.product_id',
        product_code: { $first: '$invoice_item_info.product_code' },
        product_name: { $first: '$invoice_item_info.product_name' },
        category_name: { $first: '$product_info.category_name' },
        total_net_amount_with_tax: {
          $sum: {
            $toDouble: '$invoice_item_info.net_amount_with_tax',
          },
        },
        total_quantity: {
          $sum: {
            $toDouble: '$invoice_item_info.total_quantity',
          },
        },
        count: { $sum: 1 },
      },
    };

    const result = await this.invoiceModel.aggregate([
      ...invoiceItemLookup(req, {
        ...params,
        localField: '_id',
        foreignField: 'invoice_id',
      }),
      ...productLookup(req, {
        ...params,
        localField: 'invoice_item_info.product_id',
        foreignField: '_id',
      }),
      matchStage,
      groupStage,
    ]);

    return result;
  }

  async getProductWiseAchievement(req: Request, params: any): Promise<any> {
    const { start, end, customer_ids } = params;

    const match: Record<string, any> = {
      org_id: req['user']['org_id'],
      is_delete: 0,
      billing_date: {
        $gte: start,
        $lte: end,
      },
      customer_id: { $in: customer_ids },
      ...(params.product_ids && params.product_ids.length > 0
        ? {
            'invoice_item_info.product_id': { $in: params.product_ids },
          }
        : {}),
    };

    const matchStage = { $match: match };

    const groupStage = {
      $group: {
        _id: '$invoice_item_info.product_id',
        product_code: { $first: '$invoice_item_info.product_code' },
        product_name: { $first: '$invoice_item_info.product_name' },
        total_net_amount_with_tax: {
          $sum: {
            $toDouble: '$invoice_item_info.net_amount_with_tax',
          },
        },
        total_quantity: {
          $sum: {
            $toDouble: '$invoice_item_info.total_quantity',
          },
        },
        count: { $sum: 1 },
      },
    };

    const result = await this.invoiceModel.aggregate([
      ...invoiceItemLookup(req, {
        ...params,
        localField: '_id',
        foreignField: 'invoice_id',
      }),
      matchStage,
      groupStage,
    ]);

    return result;
  }
}
