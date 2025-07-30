import { Module } from '@nestjs/common';
import { GatepassController } from './gatepass.controller';
import { GatepassService } from './gatepass.service';
import { MongooseModule } from '@nestjs/mongoose';
import { ResponseService } from 'src/services/response.service';
import { DispatchGatepassModel, DispatchGatepassSchema } from './model/gatepass.model';
import { DispatchModel, DispatchSchema } from '../dispatch/model/dispatch.model';
import { DispatchItemsModel, DispatchItemsSchema } from '../dispatch/model/dispatch-items.model';
import { QrcodeModule } from 'src/modules/loyalty/qr-code/qr-code.module';

@Module({
    imports: [
        MongooseModule.forFeature([
            { name: DispatchGatepassModel.name, schema: DispatchGatepassSchema },
            { name: DispatchModel.name, schema: DispatchSchema },
            { name: DispatchItemsModel.name, schema: DispatchItemsSchema },
        ]),
        QrcodeModule
    ],
    controllers: [GatepassController],
    providers: [GatepassService, ResponseService],
})
export class GatepassModule { }
