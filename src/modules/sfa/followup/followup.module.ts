import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { FollowupModel, FollowupSchema } from './models/followup.model';
import { FollowupController } from './web/followup.controller';
import { FollowupService } from './web/followup.service';
import { AppFollowupController } from './app/app-followup.controller';
import { AppFollowupService } from './app/app-followup.service';
import { ResponseService } from 'src/services/response.service';
import { DropdownModule } from 'src/modules/master/dropdown/dropdown.module';
import { SitesModel, SitesSchema } from '../sites/models/sites.model';
import {
  CustomerModel,
  CustomerSchema,
} from 'src/modules/master/customer/default/models/customer.model';
import {
  UserModel,
  UserSchema,
} from 'src/modules/master/user/models/user.model';
import {
  VisitActivityModel,
  VisitActivitySchema,
} from 'src/modules/sfa/activity/models/visit-activity.model';
import {
  UserToCustomerMappingModel,
  UserToCustomerMappingSchema,
} from 'src/modules/master/customer/default/models/user-to-customer-mapping.model';
import {
  UserHierarchyModel,
  UserHierarchySchema,
} from 'src/modules/master/user/models/user-hierarchy.model';
import { UserModule } from 'src/modules/master/user/user.module';
import {
  EnquiryModel,
  EnquirySchema,
} from '../enquiry/default/models/enquiry.model';
@Module({
  imports: [
    MongooseModule.forFeature([
      { name: FollowupModel.name, schema: FollowupSchema },
      { name: SitesModel.name, schema: SitesSchema },
      { name: EnquiryModel.name, schema: EnquirySchema },
      { name: CustomerModel.name, schema: CustomerSchema },
      { name: VisitActivityModel.name, schema: VisitActivitySchema },
      { name: UserModel.name, schema: UserSchema },
      {
        name: UserToCustomerMappingModel.name,
        schema: UserToCustomerMappingSchema,
      },
      { name: UserHierarchyModel.name, schema: UserHierarchySchema },
    ]),
    UserModule
  ],

  providers: [FollowupService, AppFollowupService, ResponseService],
  controllers: [FollowupController, AppFollowupController],
  exports: [FollowupService],
})
export class FollowupModule { }
