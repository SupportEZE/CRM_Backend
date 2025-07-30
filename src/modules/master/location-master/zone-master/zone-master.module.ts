import { Module } from '@nestjs/common';
import { ZoneMasterController } from './web/zone-master.controller';
import { ZoneMasterService } from './web/zone-master.service';
import { MongooseModule } from '@nestjs/mongoose';
import { ZoneMasterModel, ZoneMasterSchema } from './models/zone-master.model';
import { ResponseService } from 'src/services/response.service';
import { ApilogModule } from 'src/shared/apilog/apilog.module';

@Module({
    imports: [
        MongooseModule.forFeature([
            { name: ZoneMasterModel.name, schema: ZoneMasterSchema },
        ]),
        ApilogModule
    ],
    controllers: [ZoneMasterController],
    providers: [ZoneMasterService, ResponseService],
    exports: [ZoneMasterService],
})
export class ZoneMasterModule { }
