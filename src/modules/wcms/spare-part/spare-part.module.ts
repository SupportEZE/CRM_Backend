import { Module } from '@nestjs/common';
import { SparePartController } from './web/spare-part.controller';
import { AppSparePartController } from './app/app-spare-part.controller';
import { SparePartService } from './web/spare-part.service';
import { AppSparePartService } from './app/app-spare-part.service';
import { MongooseModule } from '@nestjs/mongoose';
import {
  SparePartTransactionModel,
  SparePartTransactionSchema,
} from './models/spare-part-transaction.model';
import { ResponseService } from 'src/services/response.service';
import { DateTimeService } from 'src/services/date-time.service';
import { LocationService } from 'src/services/location.service';
import {
  UserModel,
  UserSchema,
} from 'src/modules/master/user/models/user.model';
import {
  CustomerModel,
  CustomerSchema,
} from 'src/modules/master/customer/default/models/customer.model';
import { FormBuilderModule } from 'src/shared/form-builder/form-builder.module';
import { SparePartModel, SparePartSchema } from './models/spare-part.model';
import {
  SpareStockManageModel,
  SpareStockManageSchema,
} from './models/spare-stock-manage.model';
import {
  SparePartDocsModel,
  SparePartDocsSchema,
} from './models/spare-part-docs.model';
import { S3Service } from 'src/shared/rpc/s3.service';
import { CustomerTypeModule } from 'src/modules/master/customer-type/customer-type.module';
import { CustomerModule } from 'src/modules/master/customer/customer.module';
import { RedisService } from 'src/services/redis.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      {
        name: SparePartTransactionModel.name,
        schema: SparePartTransactionSchema,
      },
      { name: UserModel.name, schema: UserSchema },
      { name: CustomerModel.name, schema: CustomerSchema },
      { name: SparePartModel.name, schema: SparePartSchema },
      { name: SpareStockManageModel.name, schema: SpareStockManageSchema },
      { name: SparePartDocsModel.name, schema: SparePartDocsSchema },
    ]),
    FormBuilderModule,
    CustomerTypeModule,
    CustomerModule,
  ],
  controllers: [SparePartController, AppSparePartController],
  providers: [
    SparePartService,
    ResponseService,
    DateTimeService,
    LocationService,
    AppSparePartService,
    S3Service,
    RedisService,
  ],
})
export class SparePartModule {}
