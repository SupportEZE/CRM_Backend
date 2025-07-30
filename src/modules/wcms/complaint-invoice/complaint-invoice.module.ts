import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ResponseService } from 'src/services/response.service';
import { ComplaintInvoiceModel, ComplaintInvoiceSchema } from './models/complaint-invoice.model';
import { ComplaintInvoiceItemModel, ComplaintInvoiceItemSchema } from './models/complaint-invoice-item.model';
import { AppComplaintInvoiceService } from './app/app-complaint-invoice.service';
import { ComplaintInvoiceService } from './web/complaint-invoice.service';
import { AppComplaintInvoiceController } from './app/app-complaint-invoice.controller';
import { ComplaintInvoiceController } from './web/complaint-invoice.controller';
import { ComplaintModel, ComplaintSchema } from '../complaint/models/complaint.model';
@Module({
  imports: [
    MongooseModule.forFeature(
      [
        { name: ComplaintInvoiceModel.name, schema: ComplaintInvoiceSchema },
        { name: ComplaintInvoiceItemModel.name, schema: ComplaintInvoiceItemSchema },
        { name: ComplaintModel.name, schema: ComplaintSchema },
      ]
    ),
  ],
  providers: [ComplaintInvoiceService, AppComplaintInvoiceService, ResponseService],
  controllers: [ComplaintInvoiceController, AppComplaintInvoiceController],
})
export class ComplaintInvoiceModule { }
