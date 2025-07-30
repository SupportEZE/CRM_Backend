import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ResponseService } from 'src/services/response.service';
import { AppOrderController } from './app/app-order.controller';
import { OrderController } from './web/order.controller';
import { AppOrderService } from './app/app-order.service';
import { OrderService } from './web/order.service';
import {
  PrimaryOrderModel,
  PrimaryOrderSchema,
} from './models/primary-order.model';
import { CustomerTypeModule } from 'src/modules/master/customer-type/customer-type.module';
import { CustomerModule } from 'src/modules/master/customer/customer.module';
import {
  CustomerShippingAddressModel,
  CustomerShippingAddressSchema,
} from 'src/modules/master/customer/default/models/customer-shipping-address.model';
import { DropdownModule } from 'src/modules/master/dropdown/dropdown.module';
import { FormBuilderModule } from 'src/shared/form-builder/form-builder.module';
import { ProductModule } from 'src/modules/master/product/product.module';
import {
  OrderSchemeModel,
  OrderSchemeSchema,
} from './models/order-scheme.model';
import {
  PrimaryOrderItemModel,
  PrimaryOrderItemSchema,
} from './models/primary-order-item.model';
import { S3Service } from 'src/shared/rpc/s3.service';
import {
  OrderSchemeDocsModel,
  OrderSchemeDocsSchema,
} from './models/order-scheme-docs.model';
import {
  PrimaryOrderCartModel,
  PrimaryOrderCartSchema,
} from './models/primary-order-cart.model';
import {
  PrimaryOrderCartItemModel,
  PrimaryOrderCartItemSchema,
} from './models/primary-order-cart-item.model';
import { UserModule } from 'src/modules/master/user/user.module';
import { PdfService } from 'src/shared/rpc/pdf.service';
@Module({
  imports: [
    MongooseModule.forFeature([
      { name: PrimaryOrderModel.name, schema: PrimaryOrderSchema },
      { name: PrimaryOrderItemModel.name, schema: PrimaryOrderItemSchema },
      { name: OrderSchemeDocsModel.name, schema: OrderSchemeDocsSchema },
      { name: OrderSchemeModel.name, schema: OrderSchemeSchema },
      {
        name: CustomerShippingAddressModel.name,
        schema: CustomerShippingAddressSchema,
      },
      { name: PrimaryOrderCartModel.name, schema: PrimaryOrderCartSchema },
      {
        name: PrimaryOrderCartItemModel.name,
        schema: PrimaryOrderCartItemSchema,
      },
    ]),
    CustomerTypeModule,
    CustomerModule,
    DropdownModule,
    FormBuilderModule,
    ProductModule,
    CustomerModule,
    UserModule,
  ],
  controllers: [AppOrderController, OrderController],
  providers: [
    AppOrderService,
    OrderService,
    ResponseService,
    S3Service,
    PdfService,
  ],
  exports: [OrderService],
})
export class OrderModule {}
