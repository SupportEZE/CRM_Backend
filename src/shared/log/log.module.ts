import { Module } from '@nestjs/common';
import { LogService } from './log.service';
import { MongooseModule } from '@nestjs/mongoose';
import { FormBuilderLogModel,FormBuilderLogSchema } from './models/form-builder-logs.model';
import { ModuleTransactionLogModel,ModuleTransactionLogSchema } from './models/module-transactions-logs.model';
import { LogController } from './log.controller';
import { ResponseService } from 'src/services/response.service';
import { DB_NAMES } from 'src/config/db.constant';
import { AppLogController } from './app/app-log.controller';
import { AppLogService } from './app/app-log.service';

@Module({
    imports:
    [
        MongooseModule.forFeature(
            [
                { name: FormBuilderLogModel.name, schema: FormBuilderLogSchema },
                { name: ModuleTransactionLogModel.name, schema: ModuleTransactionLogSchema },
            ],
            DB_NAMES().SUPPORT_DB
        )
    ],
    controllers:[LogController,AppLogController],
    providers: [LogService,AppLogService,ResponseService],
    exports:[LogService]
})
export class LogModule {}
