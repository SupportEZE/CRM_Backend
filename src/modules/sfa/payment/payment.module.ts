import { Module } from '@nestjs/common';
import { PaymentController } from './web/payment.controller';
import { PaymentService } from './web/payment.service';
import { AppPaymentController } from './app/app-payment.controller';
import { AppPaymentService } from './app/app-payment.service';
import { MongooseModule } from '@nestjs/mongoose';
import { PaymentModel, PaymentSchema } from './models/payment.model';
import {
  PaymentDocsModel,
  PaymentDocsSchema,
} from './models/payment-docs.model';
import { ResponseService } from 'src/services/response.service';
import {
  CustomerModel,
  CustomerSchema,
} from 'src/modules/master/customer/default/models/customer.model';
import { S3Service } from 'src/shared/rpc/s3.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: PaymentModel.name, schema: PaymentSchema },
      { name: CustomerModel.name, schema: CustomerSchema },
      { name: PaymentDocsModel.name, schema: PaymentDocsSchema },
    ]),
  ],
  controllers: [PaymentController, AppPaymentController],
  providers: [PaymentService, AppPaymentService, ResponseService, S3Service],
})
export class PaymentModule {}
