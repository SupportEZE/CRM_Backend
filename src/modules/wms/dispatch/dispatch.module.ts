import { Module } from '@nestjs/common';
import { DispatchController } from './web/dispatch.controller';
import { DispatchService } from './web/dispatch.service';
import { MongooseModule } from '@nestjs/mongoose';
import { ResponseService } from 'src/services/response.service';
import { QrcodeModule } from 'src/modules/loyalty/qr-code/qr-code.module';
import { DispatchModel, DispatchSchema } from './model/dispatch.model';
import { DispatchItemsModel, DispatchItemsSchema } from './model/dispatch-items.model';
import { PrimaryOrderModel, PrimaryOrderSchema } from 'src/modules/sfa/order/models/primary-order.model';
import { PrimaryOrderItemModel, PrimaryOrderItemSchema } from 'src/modules/sfa/order/models/primary-order-item.model';
import { OrderModule } from 'src/modules/sfa/order/order.module';
import { CustomerModule } from 'src/modules/master/customer/customer.module';

@Module({
    imports: [
        MongooseModule.forFeature([
            { name: DispatchModel.name, schema: DispatchSchema },
            { name: DispatchItemsModel.name, schema: DispatchItemsSchema },
            { name: PrimaryOrderModel.name, schema: PrimaryOrderSchema },
            { name: PrimaryOrderItemModel.name, schema: PrimaryOrderItemSchema },
        ]),
        QrcodeModule,
        OrderModule,
        CustomerModule
    ],
    controllers: [DispatchController],
    providers: [DispatchService, ResponseService],
    exports: [DispatchService]
})
export class DispatchModule { }
