import { forwardRef, Module } from '@nestjs/common';
import { UserController } from './web/user.controller';
import { UserService } from './web/user.service';
import { MongooseModule } from '@nestjs/mongoose';
import { UserModel, UserSchema } from './models/user.model';
import { ResponseService } from 'src/services/response.service';
import {
  UserHierarchyModel,
  UserHierarchySchema,
} from './models/user-hierarchy.model';
import { Lts } from 'src/shared/translate/translate.service';
import {
  CustomerModel,
  CustomerSchema,
} from '../customer/default/models/customer.model';
import { UserDocsModel, UserDocsSchema } from './models/user-docs.model';
import { S3Service } from 'src/shared/rpc/s3.service';
import { SharedUserService } from './shared-user.service';
import { UserUploadService } from './user-upload.service';
import {
  UserToCustomerMappingModel,
  UserToCustomerMappingSchema,
} from '../customer/default/models/user-to-customer-mapping.model';
import {
  UserWorkingActivityModel,
  UserWorkingActivitySchema,
} from './models/user-working-activity.model';
import { AppUserService } from './app/app-user.service';
import { AppUserController } from './app/app-user.controller';
import {
  UserToStateMappingModel,
  UserToStateMappingSchema,
} from './models/user-state-mapping.model';
import { DropdownModule } from '../dropdown/dropdown.module';
import { FormBuilderModule } from 'src/shared/form-builder/form-builder.module';
import { CsvModule } from 'src/shared/csv/csv.module';
import { PostalCodeModule } from '../location-master/postal-code/postal-code.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: UserDocsModel.name, schema: UserDocsSchema },
      { name: UserModel.name, schema: UserSchema },
      { name: UserHierarchyModel.name, schema: UserHierarchySchema },
      { name: CustomerModel.name, schema: CustomerSchema },
      {
        name: UserToCustomerMappingModel.name,
        schema: UserToCustomerMappingSchema,
      },
      {
        name: UserWorkingActivityModel.name,
        schema: UserWorkingActivitySchema,
      },
      { name: UserToStateMappingModel.name, schema: UserToStateMappingSchema },
    ]),
    DropdownModule,
    FormBuilderModule,
    forwardRef(() => CsvModule),
    PostalCodeModule,
  ],
  controllers: [UserController, AppUserController],
  providers: [
    UserService,
    ResponseService,
    Lts,
    S3Service,
    SharedUserService,
    UserUploadService,
    AppUserService,
  ],
  exports: [UserService, SharedUserService],
})
export class UserModule {}
