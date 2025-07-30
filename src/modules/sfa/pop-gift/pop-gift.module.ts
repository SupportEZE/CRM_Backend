import { Module } from '@nestjs/common';
import { PopGiftController } from './web/pop-gift.controller';
import { AppPopGiftController } from './app/app-pop-gift.controller';
import { PopGiftService } from './web/pop-gift.service';
import { AppPopGiftService } from './app/app-pop-gift.service';
import { MongooseModule } from '@nestjs/mongoose';
import {
  PopGiftTransactionModel,
  PopGiftTransactionSchema,
} from './models/pop-gift-transaction.model';
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
import { PopGiftModel, PopGiftSchema } from './models/pop-gift.model';
import {
  PopStockManageModel,
  PopStockManageSchema,
} from './models/pop-stock-manage.model';
import {
  PopGiftDocsModel,
  PopGiftDocsSchema,
} from './models/pop-gift-docs.model';
import { S3Service } from 'src/shared/rpc/s3.service';
import { CustomerTypeModule } from 'src/modules/master/customer-type/customer-type.module';
import { CustomerModule } from 'src/modules/master/customer/customer.module';
import { RedisService } from 'src/services/redis.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: PopGiftTransactionModel.name, schema: PopGiftTransactionSchema },
      { name: UserModel.name, schema: UserSchema },
      { name: CustomerModel.name, schema: CustomerSchema },
      { name: PopGiftModel.name, schema: PopGiftSchema },
      { name: PopStockManageModel.name, schema: PopStockManageSchema },
      { name: PopGiftDocsModel.name, schema: PopGiftDocsSchema },
    ]),
    FormBuilderModule,
    CustomerTypeModule,
    CustomerModule,
  ],
  controllers: [PopGiftController, AppPopGiftController],
  providers: [
    PopGiftService,
    ResponseService,
    DateTimeService,
    LocationService,
    AppPopGiftService,
    S3Service,
    RedisService,
  ],
})
export class PopGiftModule {}
