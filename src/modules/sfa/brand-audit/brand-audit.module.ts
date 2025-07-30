import { Module } from '@nestjs/common';
import { BrandAuditController } from './web/brand-audit.controller';
import { AppBrandAuditController } from './app/app-brand-audit.controller';
import { BrandAuditService } from './web/brand-audit.service';
import { AppBrandAuditService } from './app/app-brand-audit.service';
import { MongooseModule } from '@nestjs/mongoose';
import { BrandAuditModel, BrandAuditSchema } from './models/brand-audit.model';
import {
  BrandRequestModel,
  BrandRequestModelSchema,
} from './models/brand-request.model';
import {
  BrandRequestDocsModel,
  BrandRequestDocsSchema,
} from './models/brand-request-docs.model';
import {
  VisitActivityModel,
  VisitActivitySchema,
} from '../activity/models/visit-activity.model';
import { ResponseService } from 'src/services/response.service';
import {
  CustomerModel,
  CustomerSchema,
} from 'src/modules/master/customer/default/models/customer.model';
import {
  UserHierarchyModel,
  UserHierarchySchema,
} from 'src/modules/master/user/models/user-hierarchy.model';
import { S3Service } from 'src/shared/rpc/s3.service';
import { CustomerModule } from 'src/modules/master/customer/customer.module';
import { UserModule } from 'src/modules/master/user/user.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: BrandAuditModel.name, schema: BrandAuditSchema },
      { name: BrandRequestModel.name, schema: BrandRequestModelSchema },
      { name: CustomerModel.name, schema: CustomerSchema },
      { name: BrandRequestDocsModel.name, schema: BrandRequestDocsSchema },
      { name: UserHierarchyModel.name, schema: UserHierarchySchema },
      { name: VisitActivityModel.name, schema: VisitActivitySchema },
    ]),
    CustomerModule,
    UserModule,
  ],
  controllers: [BrandAuditController, AppBrandAuditController],
  providers: [
    BrandAuditService,
    ResponseService,
    AppBrandAuditService,
    S3Service,
  ],
})
export class BrandAuditModule {}
