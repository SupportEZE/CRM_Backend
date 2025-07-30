import { Module, Global, forwardRef } from '@nestjs/common';
import { GlobalService } from './global.service';
import { MongooseModule } from '@nestjs/mongoose';
import {
  FollowupModel,
  FollowupSchema,
} from 'src/modules/sfa/followup/models/followup.model';
import {
  TicketModel,
  TicketSchema,
} from 'src/modules/master/ticket/models/ticket.model';
import {
  StockAuditModel,
  StockAuditSchema,
} from 'src/modules/sfa/stock/models/stock-audit.model';
import {
  StaticFormModel,
  StaticFormSchema,
} from '../form-builder/models/static-form.model';
import {
  CustomFormModel,
  CustomFormSchema,
} from '../form-builder/models/custom-form.model';
import {
  DefaultFormModel,
  DefaultFormSchema,
} from '../form-builder/models/default-form.model';
import {
  PaymentModel,
  PaymentSchema,
} from 'src/modules/sfa/payment/models/payment.model';
import {
  BrandAuditModel,
  BrandAuditSchema,
} from 'src/modules/sfa/brand-audit/models/brand-audit.model';
import {
  PopGiftTransactionModel,
  PopGiftTransactionSchema,
} from 'src/modules/sfa/pop-gift/models/pop-gift-transaction.model';
import {
  EventPlanModel,
  EventPlanSchema,
} from 'src/modules/sfa/event-plan/models/event-plan.model';
import {
  SitesModel,
  SitesSchema,
} from 'src/modules/sfa/sites/models/sites.model';
import {
  SecondaryOrderModel,
  SecondaryOrderSchema,
} from 'src/modules/sfa/secondary-order/models/secondary-order.model';
import {
  CustomerModel,
  CustomerSchema,
} from 'src/modules/master/customer/default/models/customer.model';
import { GlobalAchievementService } from './achievement.service';
import {
  VisitActivityModel,
  VisitActivitySchema,
} from 'src/modules/sfa/activity/models/visit-activity.model';
import {
  InvoiceModel,
  InvoiceBillingSchema,
} from 'src/modules/dms/invoice/models/invoice.model';
import {
  PrimaryOrderModel,
  PrimaryOrderSchema,
} from 'src/modules/sfa/order/models/primary-order.model';
import {
  UnpaidInvoiceBillingSchema,
  UnpaidInvoiceModel,
} from 'src/modules/dms/unpaid-invoice/models/unpaid-invoice.model';
import {
  CustomerOtherDetailModel,
  CustomerOtherDetailSchema,
} from 'src/modules/master/customer/default/models/customer-other-detail.model';
import { TargetModule } from 'src/modules/sfa/target/target.module';
import {
  AttendanceModel,
  AttendanceSchema,
} from 'src/modules/sfa/attendance/models/attendance.model';
import {
  EnquiryModel,
  EnquirySchema,
} from 'src/modules/sfa/enquiry/default/models/enquiry.model';

@Global()
@Module({
  imports: [
    MongooseModule.forFeature([
      { name: FollowupModel.name, schema: FollowupSchema },
      { name: TicketModel.name, schema: TicketSchema },
      { name: StockAuditModel.name, schema: StockAuditSchema },
      { name: EnquiryModel.name, schema: EnquirySchema },
      { name: PaymentModel.name, schema: PaymentSchema },
      { name: StaticFormModel.name, schema: StaticFormSchema },
      { name: CustomFormModel.name, schema: CustomFormSchema },
      { name: DefaultFormModel.name, schema: DefaultFormSchema },
      { name: BrandAuditModel.name, schema: BrandAuditSchema },
      { name: PopGiftTransactionModel.name, schema: PopGiftTransactionSchema },
      { name: EventPlanModel.name, schema: EventPlanSchema },
      { name: SitesModel.name, schema: SitesSchema },
      { name: SecondaryOrderModel.name, schema: SecondaryOrderSchema },
      { name: CustomerModel.name, schema: CustomerSchema },
      { name: VisitActivityModel.name, schema: VisitActivitySchema },
      { name: InvoiceModel.name, schema: InvoiceBillingSchema },
      { name: PrimaryOrderModel.name, schema: PrimaryOrderSchema },
      { name: SecondaryOrderModel.name, schema: SecondaryOrderSchema },
      { name: UnpaidInvoiceModel.name, schema: UnpaidInvoiceBillingSchema },
      {
        name: CustomerOtherDetailModel.name,
        schema: CustomerOtherDetailSchema,
      },
      { name: AttendanceModel.name, schema: AttendanceSchema },
    ]),
    forwardRef(() => TargetModule),
  ],
  controllers: [],
  providers: [GlobalService, GlobalAchievementService],
  exports: [GlobalService, GlobalAchievementService],
})
export class GlobalModule {}
