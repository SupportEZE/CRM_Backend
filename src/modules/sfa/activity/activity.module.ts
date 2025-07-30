import { forwardRef, Module } from '@nestjs/common';
import { ActivityController } from './web/activity.controller';
import { AppActivityController } from './app/app-activity.controller';
import { ActivityService } from './web/activity.service';
import { AppActivityService } from './app/app-activity.service';
import { MongooseModule } from '@nestjs/mongoose';
import {
  VisitActivityModel,
  VisitActivitySchema,
} from './models/visit-activity.model';
import {
  CallActivityModel,
  CallActivitySchema,
} from './models/call-activity.model';
import {
  CustomerModel,
  CustomerSchema,
} from '../../master/customer/default/models/customer.model';
import {
  ActivityDocsModel,
  ActivityDocsSchema,
} from './models/activity-docs.model';
import { SitesModel, SitesSchema } from './../sites/models/sites.model';
import { ResponseService } from 'src/services/response.service';
import {
  UserModel,
  UserSchema,
} from 'src/modules/master/user/models/user.model';
import {
  UserToCustomerMappingModel,
  UserToCustomerMappingSchema,
} from 'src/modules/master/customer/default/models/user-to-customer-mapping.model';
import {
  CustomerOtherDetailModel,
  CustomerOtherDetailSchema,
} from 'src/modules/master/customer/default/models/customer-other-detail.model';
import { LocationService } from 'src/services/location.service';
import { BeatPlanModule } from '../beat-plan/beat-plan.module';
import { CustomerModule } from 'src/modules/master/customer/customer.module';
import { S3Service } from 'src/shared/rpc/s3.service';
import { CustomerTypeModule } from 'src/modules/master/customer-type/customer-type.module';
import { DropdownModule } from 'src/modules/master/dropdown/dropdown.module';
import { SharedActivityService } from './shared-activity.service';
import { UserModule } from 'src/modules/master/user/user.module';
import { AttendanceModule } from '../attendance/attendance.module';
import { GlobalModule } from 'src/shared/global/global.module';
import { TicketModule } from 'src/modules/master/ticket/ticket.module';
import {
  EnquiryModel,
  EnquirySchema,
} from '../enquiry/default/models/enquiry.model';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: ActivityDocsModel.name, schema: ActivityDocsSchema },
      { name: VisitActivityModel.name, schema: VisitActivitySchema },
      { name: CallActivityModel.name, schema: CallActivitySchema },
      { name: CustomerModel.name, schema: CustomerSchema },
      { name: SitesModel.name, schema: SitesSchema },
      { name: EnquiryModel.name, schema: EnquirySchema },
      { name: UserModel.name, schema: UserSchema },
      {
        name: UserToCustomerMappingModel.name,
        schema: UserToCustomerMappingSchema,
      },
      {
        name: CustomerOtherDetailModel.name,
        schema: CustomerOtherDetailSchema,
      },
    ]),
    BeatPlanModule,
    forwardRef(() => CustomerModule),
    CustomerTypeModule,
    DropdownModule,
    UserModule,
    forwardRef(() => AttendanceModule),
    GlobalModule,
    TicketModule,
  ],
  controllers: [ActivityController, AppActivityController],
  providers: [
    ActivityService,
    ResponseService,
    AppActivityService,
    LocationService,
    S3Service,
    SharedActivityService,
  ],
  exports: [ActivityService, AppActivityService, SharedActivityService],
})
export class ActivityModule {}
