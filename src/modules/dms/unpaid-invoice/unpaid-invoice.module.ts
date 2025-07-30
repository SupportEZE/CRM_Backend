import { Module } from '@nestjs/common';
import { UnpaidInvoiceController } from './web/unpaid-invoice.controller';
import { UnpaidInvoiceService } from './web/unpaid-invoice.service';
import { AppUnpaidInvoiceController } from './app/app-unpaid-invoice.controller';
import { AppUnpaidInvoiceService } from './app/app-unpaid-invoice.service';
import { MongooseModule } from '@nestjs/mongoose';
import {
  UnpaidInvoiceModel,
  UnpaidInvoiceBillingSchema,
} from './models/unpaid-invoice.model';
import { ResponseService } from 'src/services/response.service';
import {
  CustomerOtherDetailModel,
  CustomerOtherDetailSchema,
} from 'src/modules/master/customer/default/models/customer-other-detail.model';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: UnpaidInvoiceModel.name, schema: UnpaidInvoiceBillingSchema },
      {
        name: CustomerOtherDetailModel.name,
        schema: CustomerOtherDetailSchema,
      },
    ]),
  ],
  controllers: [UnpaidInvoiceController, AppUnpaidInvoiceController],
  providers: [UnpaidInvoiceService, AppUnpaidInvoiceService, ResponseService],
})
export class UnpaidInvoiceModule {}
