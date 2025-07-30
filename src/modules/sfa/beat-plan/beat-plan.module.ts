import { forwardRef, Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { BeatPlanModel, BeatPlanSchema } from './models/beat-plan.model';
import { BeatPlanController } from './web/beat-plan.controller';
import { BeatPlanService } from './web/beat-plan.service';
import { ResponseService } from 'src/services/response.service';
import { AppBeatPlanController } from './app/app-beat-plan.controller';
import { AppBeatPlanService } from './app/app-beat-plan.service';
import {
  UserModel,
  UserSchema,
} from 'src/modules/master/user/models/user.model';
import {
  BeatRouteModel,
  BeatRouteSchema,
} from 'src/modules/master/location-master/beat-route/models/beat-route.model';
import {
  CustomerModel,
  CustomerSchema,
} from 'src/modules/master/customer/default/models/customer.model';
import {
  CustomerOtherDetailModel,
  CustomerOtherDetailSchema,
} from 'src/modules/master/customer/default/models/customer-other-detail.model';
import { DateTimeService } from 'src/services/date-time.service';
import {
  VisitActivityModel,
  VisitActivitySchema,
} from '../activity/models/visit-activity.model';
import { CustomerModule } from 'src/modules/master/customer/customer.module';
import { UserModule } from 'src/modules/master/user/user.module';
import {
  BeatPlanTargetModel,
  BeatPlanTargetSchema,
} from './models/beat-plan-target.model';
@Module({
  imports: [
    MongooseModule.forFeature([
      { name: BeatPlanModel.name, schema: BeatPlanSchema },
      { name: UserModel.name, schema: UserSchema },
      { name: BeatRouteModel.name, schema: BeatRouteSchema },
      { name: CustomerModel.name, schema: CustomerSchema },
      {
        name: CustomerOtherDetailModel.name,
        schema: CustomerOtherDetailSchema,
      },
      { name: BeatPlanTargetModel.name, schema: BeatPlanTargetSchema },
      { name: VisitActivityModel.name, schema: VisitActivitySchema },
    ]),
    forwardRef(() => CustomerModule),
    UserModule,
  ],
  providers: [
    BeatPlanService,
    ResponseService,
    AppBeatPlanService,
    DateTimeService,
  ],
  controllers: [BeatPlanController, AppBeatPlanController],
  exports: [BeatPlanService],
})
export class BeatPlanModule {}
