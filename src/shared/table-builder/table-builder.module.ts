import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { TableBuilderService } from './table-builder.service';
import { TableBuildeController } from './table-builder.controller';
import { ResponseService } from 'src/services/response.service';
import { RedisService } from 'src/services/redis.service';
import { HeadersModel, HeadersSchema } from './models/headers.model';
import { DefaultTableModel, DefaultTableSchema } from './models/default-table.model';
import { CustomTableModel, CustomTableSchema } from './models/custom-table.model';
import { FormBuilderModule } from '../form-builder/form-builder.module';
import { CustomFormModel, CustomFormSchema } from '../form-builder/models/custom-form.model';
import { DB_NAMES } from 'src/config/db.constant';

@Module({
    imports:
        [
            MongooseModule.forFeature([
                { name: CustomTableModel.name, schema: CustomTableSchema },
                { name: DefaultTableModel.name, schema: DefaultTableSchema },
                { name: HeadersModel.name, schema: HeadersSchema },
                { name: CustomFormModel.name, schema: CustomFormSchema },

            ],
                DB_NAMES().CORE_DB
            ),
            FormBuilderModule
        ],
    controllers: [TableBuildeController],
    providers: [TableBuilderService, ResponseService, RedisService],
    exports: [TableBuilderService]
})
export class TableBuilderModule { }
