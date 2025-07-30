import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ResponseService } from 'src/services/response.service';
import { CustomerTypeModule } from 'src/modules/master/customer-type/customer-type.module';
import { CustomerModule } from 'src/modules/master/customer/customer.module';
import { DropdownModule } from 'src/modules/master/dropdown/dropdown.module';
import { FormBuilderModule } from 'src/shared/form-builder/form-builder.module';
import { ProductModule } from 'src/modules/master/product/product.module';
import { S3Service } from 'src/shared/rpc/s3.service';
import { UserModule } from 'src/modules/master/user/user.module';
import { PdfService } from 'src/shared/rpc/pdf.service';
import { SecondaryOrderController } from './web/secondary-order..controller';
import { SecondaryOrderService } from './web/secondary-order.service';
import { AppSecondaryOrderController } from './app/app-secondary-order.controller';
import { AppSecondaryOrderService } from './app/app-secondary-order.service';
import { SecondaryOrderCartModel, SecondaryOrderCartSchema } from './models/secondary-order-cart.model';
import { SecondaryOrderCartItemModel, SecondaryOrderCartItemSchema } from './models/secondary-order-cart-item.model';
import { SecondaryOrderItemModel, SecondaryOrderItemSchema } from './models/secondary-order-item.model';
import { SecondaryOrderModel, SecondaryOrderSchema } from './models/secondary-order.model';
@Module({
    imports: [
        MongooseModule.forFeature([
            { name: SecondaryOrderCartModel.name, schema: SecondaryOrderCartSchema },
            { name: SecondaryOrderCartItemModel.name, schema: SecondaryOrderCartItemSchema },
            { name: SecondaryOrderModel.name, schema: SecondaryOrderSchema },
            { name: SecondaryOrderItemModel.name, schema: SecondaryOrderItemSchema }
        ]),
        CustomerTypeModule,
        CustomerModule,
        DropdownModule,
        FormBuilderModule,
        ProductModule,
        CustomerModule,
        UserModule
    ],
    controllers: [AppSecondaryOrderController, SecondaryOrderController],
    providers: [AppSecondaryOrderService, SecondaryOrderService, ResponseService, S3Service, PdfService],
    exports: [SecondaryOrderService, SecondaryOrderService]
})
export class SecondaryOrderModule { }
