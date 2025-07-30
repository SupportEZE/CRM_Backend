import { Module } from '@nestjs/common';
import { InvoiceController } from './web/invoice.controller';
import { InvoiceService } from './web/invoice.service';
import { AppInvoiceController } from './app/app-invoice.controller';
import { AppInvoiceService } from './app/app-invoice.service';
import { MongooseModule } from '@nestjs/mongoose';
import { InvoiceModel, InvoiceBillingSchema } from './models/invoice.model';
import {
  InvoicePaymentModel,
  InvoicePaymentSchema,
} from '../payment/models/invoice-payment.model';
import {
  InvoiceItemModel,
  InvoiceItemSchema,
} from './models/invoice-item.model';
import {
  InvoiceDocsModel,
  InvoiceDocsSchema,
} from './models/invoice-docs.model';
import { ResponseService } from 'src/services/response.service';
import {
  CustomerModel,
  CustomerSchema,
} from 'src/modules/master/customer/default/models/customer.model';
import { S3Service } from 'src/shared/rpc/s3.service';
import { CustomerModule } from 'src/modules/master/customer/customer.module';
import {
  CustomerStockModel,
  CustomerStockSchema,
} from 'src/modules/dms/stock-transfer/models/company-customer-stock.model';
import {
  CustomerStockItemModel,
  CustomerStockItemSchema,
} from 'src/modules/dms/stock-transfer/models/company-customer-stock-item.model';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: InvoiceModel.name, schema: InvoiceBillingSchema },
      { name: InvoicePaymentModel.name, schema: InvoicePaymentSchema },
      { name: InvoiceItemModel.name, schema: InvoiceItemSchema },
      { name: InvoiceDocsModel.name, schema: InvoiceDocsSchema },
      { name: CustomerStockModel.name, schema: CustomerStockSchema },
      { name: CustomerStockItemModel.name, schema: CustomerStockItemSchema },
      { name: CustomerModel.name, schema: CustomerSchema },
    ]),
    CustomerModule,
  ],
  controllers: [InvoiceController, AppInvoiceController],
  providers: [InvoiceService, AppInvoiceService, ResponseService, S3Service],
  exports: [InvoiceService],
})
export class InvoiceModule {}
