import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { CustomFormModel, CustomFormSchema } from './models/custom-form.model';
import { DefaultFormModel, DefaultFormSchema } from './models/default-form.model';
import { FormBuilderService } from './form-builder.service';
import { FormBuildeController } from './form-builder.controller';
import { ResponseService } from 'src/services/response.service';
import { RedisService } from 'src/services/redis.service';
import { StaticFormModel, StaticFormSchema } from './models/static-form.model';
import { DB_NAMES } from 'src/config/db.constant';
@Module({
    imports:
        [
            MongooseModule.forFeature(
                [
                    { name: CustomFormModel.name, schema: CustomFormSchema },
                    { name: DefaultFormModel.name, schema: DefaultFormSchema },
                    { name: StaticFormModel.name, schema: StaticFormSchema },
                ],
                DB_NAMES().CORE_DB
            )
        ],
    controllers: [FormBuildeController],
    providers: [FormBuilderService, ResponseService, RedisService],
    exports: [FormBuilderService]
})
export class FormBuilderModule { }
