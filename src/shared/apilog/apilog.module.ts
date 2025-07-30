import { Module } from '@nestjs/common';
import { ApilogService } from './apilog.service';
import { MongooseModule } from '@nestjs/mongoose';
import { InternalApiLogModel,InternalApiLogSchema } from './models/internal-api-log.model';
import { ExternalApiLogsModel,ExternalApiLogsSchema } from './models/external-api-log.model';
import { DB_NAMES } from 'src/config/db.constant';
@Module({
    imports:
    [
        MongooseModule.forFeature([
            { name: InternalApiLogModel.name, schema: InternalApiLogSchema },
            { name: ExternalApiLogsModel.name, schema: ExternalApiLogsSchema },
        ],
        DB_NAMES().SUPPORT_DB
    )
    ],
    providers: [ApilogService],
    exports:[ApilogService]
})
export class ApilogModule {}
