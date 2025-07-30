import { HttpStatus, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { UnpaidInvoiceModel } from '../models/unpaid-invoice.model';
import mongoose, { Model, Types } from 'mongoose';
import { ResponseService } from 'src/services/response.service';
import {
  toObjectId,
  commonFilters,
  appCommonFilters,
} from 'src/common/utils/common.utils';
import { CustomerOtherDetailModel } from 'src/modules/master/customer/default/models/customer-other-detail.model';

@Injectable()
export class AppUnpaidInvoiceService {
  constructor(
    @InjectModel(UnpaidInvoiceModel.name)
    private unpaidInvoiceModel: Model<UnpaidInvoiceModel>,
    @InjectModel(CustomerOtherDetailModel.name)
    private customerOtherDetailModel: Model<CustomerOtherDetailModel>,

    private readonly res: ResponseService,
  ) {}

  async read(req: Request, params: any): Promise<any> {
    try {
      const orgId = req['user']['org_id'];

      const baseMatch: Record<string, any> = {
        org_id: orgId,
        is_delete: 0,
      };

      let credit_days = 30;
      let credit_limit = 0;

      if (params.customer_id) {
        baseMatch.customer_id = toObjectId(params.customer_id);

        const customerData = await this.customerOtherDetailModel
          .findOne({
            org_id: orgId,
            customer_id: toObjectId(params.customer_id),
            is_delete: 0,
          })
          .sort({ _id: -1 })
          .lean();

        credit_days = customerData?.credit_days ?? credit_days;
        credit_limit = customerData?.credit_limit ?? credit_limit;
      }

      const page = Math.max(1, parseInt(params?.page, 10) || global.PAGE);
      const limit = Math.max(1, parseInt(params?.limit, 10) || global.LIMIT);
      const skip = (page - 1) * limit;

      const unpaid_invoices = await this.unpaidInvoiceModel
        .find(baseMatch)
        .skip(skip)
        .limit(limit)
        .lean();

      const allUnpaid = await this.unpaidInvoiceModel.find(baseMatch).lean();
      const total = allUnpaid.length;

      let outstanding = 0;
      let overdue = 0;
      let total_outstanding_count = 0;
      let total_overdue_count = 0;
      const today = new Date();

      for (const invoice of allUnpaid) {
        const net = invoice.net_amount || 0;
        const received = invoice.received_amount || 0;
        const pending = net - received;

        if (pending > 0) {
          outstanding += pending;
          total_outstanding_count++;

          if (invoice.billing_date) {
            const dueDate = new Date(invoice.billing_date);
            dueDate.setDate(dueDate.getDate() + credit_days);

            if (today > dueDate) {
              overdue += pending;
              total_overdue_count++;
            }
          }
        }
      }

      const credit_utilization =
        credit_limit > 0 ? (outstanding / credit_limit) * 100 : 0;
      const overdue_percentage =
        outstanding > 0 ? (overdue / outstanding) * 100 : 0;

      const unpaid_invoices_data: any = {
        unpaid_invoices,
        unpaid_invoices_data: {
          credit_limit,
          credit_days,
          outstanding,
          overdue,
          total_outstanding_count,
          total_overdue_count,
          credit_utilization: Math.round(credit_utilization),
          overdue_percentage: Math.round(overdue_percentage),
        },
      };

      return this.res.pagination(unpaid_invoices_data, total, page, limit);
    } catch (error) {
      return this.res.error(HttpStatus.BAD_REQUEST, 'ERROR.BAD_REQ', error);
    }
  }
}
