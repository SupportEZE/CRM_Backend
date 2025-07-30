import { forwardRef, Module } from '@nestjs/common';
import { CustomerController } from './customer.controller';
import { CustomerService } from './default/web/customer.service';
import { AppCustomerService } from './default/app/app-customer.service';
import { MongooseModule } from '@nestjs/mongoose';
import { CustomerModel, CustomerSchema } from './default/models/customer.model';
import { ResponseService } from 'src/services/response.service';
import { UserModel, UserSchema } from '../user/models/user.model';
import {
  CustomerBankDetailCryptoFields,
  CustomerBankDetailModel,
  CustomerBankDetailSchema,
} from './default/models/customer-bank-detail.model';
import {
  CustomerContactPersonCryptoFields,
  CustomerContactPersonModel,
  CustomerContactPersonSchema,
} from './default/models/customer-contact-person.model';
import {
  CustomerDocsModel,
  CustomerDocsSchema,
} from './default/models/customer-docs.model';
import {
  CustomerOtherDetailModel,
  CustomerOtherDetailSchema,
} from './default/models/customer-other-detail.model';
import {
  CustomerShopGalleryModel,
  CustomerShopGallerySchema,
} from './default/models/customer-shop-gallery.model';
import {
  CustomerTypeModel,
  CustomerTypeSchema,
} from '../customer-type/models/customer-type.model';
import {
  LoginTypeModel,
  LoginTypeSchema,
} from '../rbac/models/login-type.model';
import {
  UserToCustomerMappingModel,
  UserToCustomerMappingSchema,
} from './default/models/user-to-customer-mapping.model';
import {
  CustomerToCustomerMappingModel,
  CustomerToCustomerMappingSchema,
} from './default/models/customer-to-customer-mapping.dto';
import {
  CustomerShippingAddressModel,
  CustomerShippingAddressSchema,
} from './default/models/customer-shipping-address.model';
import {
  CustomerKycDetailModel,
  CustomerKycDetailSchema,
} from './default/models/customer-kyc-details.model';
import { RbacModule } from '../rbac/rbac.module';
import { CryptoService } from 'src/services/crypto.service';
import { ConfigService } from '@nestjs/config';
import { QrcodeModule } from 'src/modules/loyalty/qr-code/qr-code.module';
import {
  BadgesModel,
  BadgesSchema,
} from 'src/modules/loyalty/badges/models/badges.model';
import { AuthService } from 'src/shared/rpc/auth.service';
import { AllConfigType } from 'src/config/config.type';
import { cryptoHook } from 'src/common/hooks/crypto-hook';
import { LedgerModule } from 'src/modules/loyalty/ledger/ledger.module';
import {
  ReferralBonusModel,
  ReferralBonusSchema,
} from '../referral-bonus/models/referral-bonus.model';
import {
  CustomerMarkaModel,
  CustomerMarkaSchema,
} from './default/models/customer-marka.model';
import { NotificationService } from 'src/shared/rpc/notification.service';
import { S3Service } from 'src/shared/rpc/s3.service';
import { UserRoleModel, UserRoleSchema } from '../rbac/models/user-role.model';
import { CustomerTypeModule } from '../customer-type/customer-type.module';
import { AttendanceModule } from 'src/modules/sfa/attendance/attendance.module';
import { LocationService } from 'src/services/location.service';
import { ActivityModule } from 'src/modules/sfa/activity/activity.module';
import { SharedCustomerService } from './shared-customer.service';
import { BeatPlanModule } from 'src/modules/sfa/beat-plan/beat-plan.module';
import { ProductModule } from '../product/product.module';
import { DashboardService } from './dashboard.service';
import { TicketModule } from '../ticket/ticket.module';
import { SpinWinModule } from 'src/modules/loyalty/spin-win/spin-win-module';
import { RedisService } from 'src/services/redis.service';
import {
  DefaultFormModel,
  DefaultFormSchema,
} from 'src/shared/form-builder/models/default-form.model';
import { UserModule } from '../user/user.module';
import { CustomerUploadService } from './customer-upload.service';
import { DB_NAMES } from 'src/config/db.constant';
import {
  CustomerToStateAssigningModel,
  CustomerToStateMappingSchema,
} from './default/models/customer-state-assigning.model';
import {
  OzoneProspectStageModel,
  OzoneProspectStageSchema,
} from './default/models/ozone-customer-stage.model';

import { FormBuilderModule } from 'src/shared/form-builder/form-builder.module';
import { CsvModule } from 'src/shared/csv/csv.module';
import { DropdownModule } from '../dropdown/dropdown.module';
import { AppCustomerController } from './app-customer.controller';
import { CustomerStrategyFactory } from './customer-strategy.factory';
import { OzoneCustomerService } from './ozone/web/ozone-customer.service';
import { AppOzoneCustomerService } from './ozone/app/app-ozone-customer.service';
import { FollowupModule } from 'src/modules/sfa/followup/followup.module';
import { CentralDynamicModelResolver } from 'src/common/resolvers/dynamic-model.resolver';
import { MultiClientRoutingService } from 'src/services/multi-client.service';
import { MultiClientRoutingModule } from 'src/modules/multi-client-routing/multi-client.module';
import { CommentModule } from 'src/modules/sfa/comment/comment.module';

@Module({
  imports: [
    MongooseModule.forFeatureAsync([
      {
        name: CustomerBankDetailModel.name,
        useFactory: async (configService: ConfigService<AllConfigType>) => {
          const cryptoService = new CryptoService(configService);
          cryptoHook(
            CustomerBankDetailSchema,
            CustomerBankDetailCryptoFields,
            cryptoService,
          );
          return CustomerBankDetailSchema;
        },
        inject: [ConfigService],
      },
      {
        name: CustomerContactPersonModel.name,
        useFactory: async (configService: ConfigService<AllConfigType>) => {
          const cryptoService = new CryptoService(configService);
          cryptoHook(
            CustomerContactPersonSchema,
            CustomerContactPersonCryptoFields,
            cryptoService,
          );
          return CustomerContactPersonSchema;
        },
        inject: [ConfigService],
      },
    ]),
    MongooseModule.forFeature([
      { name: CustomerModel.name, schema: CustomerSchema },
      { name: UserModel.name, schema: UserSchema },
      { name: CustomerDocsModel.name, schema: CustomerDocsSchema },
      {
        name: CustomerOtherDetailModel.name,
        schema: CustomerOtherDetailSchema,
      },
      {
        name: CustomerShopGalleryModel.name,
        schema: CustomerShopGallerySchema,
      },
      { name: CustomerTypeModel.name, schema: CustomerTypeSchema },
      { name: LoginTypeModel.name, schema: LoginTypeSchema },
      {
        name: UserToCustomerMappingModel.name,
        schema: UserToCustomerMappingSchema,
      },
      {
        name: CustomerToCustomerMappingModel.name,
        schema: CustomerToCustomerMappingSchema,
      },
      {
        name: CustomerShippingAddressModel.name,
        schema: CustomerShippingAddressSchema,
      },
      { name: CustomerKycDetailModel.name, schema: CustomerKycDetailSchema },
      { name: ReferralBonusModel.name, schema: ReferralBonusSchema },
      { name: BadgesModel.name, schema: BadgesSchema },
      { name: UserRoleModel.name, schema: UserRoleSchema },
      { name: CustomerMarkaModel.name, schema: CustomerMarkaSchema },
      {
        name: CustomerToStateAssigningModel.name,
        schema: CustomerToStateMappingSchema,
      },
      { name: OzoneProspectStageModel.name, schema: OzoneProspectStageSchema },
    ]),
    MongooseModule.forFeature(
      [{ name: DefaultFormModel.name, schema: DefaultFormSchema }],
      DB_NAMES().CORE_DB,
    ),
    FormBuilderModule,
    RbacModule,
    QrcodeModule,
    LedgerModule,
    SpinWinModule,
    CustomerTypeModule,
    TicketModule,
    forwardRef(() => AttendanceModule),
    forwardRef(() => ActivityModule),
    forwardRef(() => BeatPlanModule),
    ProductModule,
    UserModule,
    RbacModule,
    CsvModule,
    DropdownModule,
    FollowupModule,
    MultiClientRoutingModule,
    CommentModule
  ],
  controllers: [CustomerController, AppCustomerController],
  providers: [
    CustomerStrategyFactory,
    CustomerService,
    AppCustomerService,
    ResponseService,
    CryptoService,
    AuthService,
    NotificationService,
    S3Service,
    LocationService,
    SharedCustomerService,
    DashboardService,
    RedisService,
    CustomerUploadService,
    OzoneCustomerService,
    AppOzoneCustomerService,
    CentralDynamicModelResolver,
  ],
  exports: [
    CustomerService,
    SharedCustomerService,
    DashboardService,
    CustomerStrategyFactory,
    CentralDynamicModelResolver,
  ],
})
export class CustomerModule {}
