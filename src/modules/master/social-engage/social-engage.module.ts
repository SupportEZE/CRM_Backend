import { Module } from '@nestjs/common';
import { SocialEngageController } from './web/social-engage.controller';
import { SocialEngageService } from './web/social-engage.service';
import { AppSocialEngagementController } from './app/app-social-engage.controller';
import { AppSocialEngageCustomerService } from './app/app-social-engage.service';
import { MongooseModule } from '@nestjs/mongoose';
import {
  SocialEngageDefaultModel,
  SocialEngageDefaultSchema,
} from './models/social-engage-default.model';
import {
  SocialEngageModel,
  SocialEngageSchema,
} from './models/social-engage.model';
import { LedgerService } from 'src/modules/loyalty/ledger/web/ledger.service';
import {
  CustomerModel,
  CustomerSchema,
} from '../customer/default/models/customer.model';
import {
  SocialEngageCustomersModel,
  SocialEngageCustomersSchema,
} from './models/social-engage-customer.model';
import { ResponseService } from 'src/services/response.service';
import { LedgerModule } from 'src/modules/loyalty/ledger/ledger.module';
import { S3Service } from 'src/shared/rpc/s3.service';
import { CustomerModule } from '../customer/customer.module';
import {
  SocialEngageDocsModel,
  SocialEngageDocsSchema,
} from './models/social-engage-docs.model';
import { CustomerService } from '../customer/default/web/customer.service';
import { NotificationService } from 'src/shared/rpc/notification.service';
import { InsideBannerModule } from 'src/shared/inside-banner/inside-banner.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: SocialEngageDocsModel.name, schema: SocialEngageDocsSchema },
      {
        name: SocialEngageDefaultModel.name,
        schema: SocialEngageDefaultSchema,
      },
      { name: SocialEngageModel.name, schema: SocialEngageSchema },
      {
        name: SocialEngageCustomersModel.name,
        schema: SocialEngageCustomersSchema,
      },
      { name: CustomerModel.name, schema: CustomerSchema },
    ]),
    LedgerModule,
    CustomerModule,
    InsideBannerModule,
  ],
  controllers: [SocialEngageController, AppSocialEngagementController],
  providers: [
    SocialEngageService,
    NotificationService,
    AppSocialEngageCustomerService,
    ResponseService,
    S3Service,
  ],
})
export class SocialEngageModule {}
