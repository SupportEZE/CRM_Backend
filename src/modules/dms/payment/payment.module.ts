import { Module } from '@nestjs/common';
import { PaymentController } from './web/payment.controller';
import { PaymentService } from './web/payment.service';
import { AppPaymentController } from './app/app-payment.controller';
import { AppPaymentService } from './app/app-payment.service';
import { MongooseModule } from '@nestjs/mongoose';
import { InvoicePaymentModel, InvoicePaymentSchema } from './models/invoice-payment.model';
import { ResponseService } from 'src/services/response.service';

@Module({
    imports: [
        MongooseModule.forFeature([
            { name: InvoicePaymentModel.name, schema: InvoicePaymentSchema },

        ]),
    ],
    controllers: [PaymentController, AppPaymentController],
    providers: [PaymentService, AppPaymentService, ResponseService],
})
export class InvoicePaymentModule { }
