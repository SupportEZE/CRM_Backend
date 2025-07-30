import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { NewQuotationController } from './quotation-controller';
import { QuotationService } from './default/web/quotation.service';
import { AppQuotationService } from './default/app/app-quotation.service';
import { OzoneQuotationService } from './ozone/web/ozone-quotation.service';
import { OzoneAppQuotationService } from './ozone/app/app-ozone-quotation.service';
import { ResponseService } from 'src/services/response.service';
import { PdfService } from 'src/shared/rpc/pdf.service';
import {
  QuotationModel,
  QuotationSchema,
} from './default/models/quotation.model';
import {
  OzoneQuotationModel,
  OzoneQuotationSchema,
} from './ozone/models/ozone-quotation.model';
import {
  newOzoneQuotationDocsModel,
  OzoneQuotationDocsSchema,
} from './ozone/models/ozone-quotation-docs.mode';
import {
  OzoneEnquiryModel,
  OzoneEnquirySchema,
} from '../enquiry/ozone/models/ozone-enquiry.model';
import {
  CustomerTypeModel,
  CustomerTypeSchema,
} from 'src/modules/master/customer-type/models/customer-type.model';
import { UserModule } from 'src/modules/master/user/user.module';
import { CustomerModule } from 'src/modules/master/customer/customer.module';
import { SitesModule } from '../sites/sites.module';
import { DropdownModule } from 'src/modules/master/dropdown/dropdown.module';
import { CustomerTypeModule } from 'src/modules/master/customer-type/customer-type.module';
import { EnquiryModule } from '../enquiry/enquiry-module';
import { QuotationStrategyFactory } from './quotation-strategy.factory';
import { DB_NAMES } from 'src/config/db.constant';
import { S3Service } from 'src/shared/rpc/s3.service';
import { AppNewQuotationController } from './app-quotation.controller';
@Module({
  imports: [
    MongooseModule.forFeature([
      { name: QuotationModel.name, schema: QuotationSchema },
      { name: CustomerTypeModel.name, schema: CustomerTypeSchema },
    ]),

    MongooseModule.forFeature(
      [
        { name: OzoneQuotationModel.name, schema: OzoneQuotationSchema },
        {
          name: newOzoneQuotationDocsModel.name,
          schema: OzoneQuotationDocsSchema,
        },
        { name: OzoneEnquiryModel.name, schema: OzoneEnquirySchema }, // ✅ THIS LINE
      ],
      DB_NAMES().CUSTOM_DB,
    ),

    UserModule,
    CustomerModule,
    EnquiryModule,
    SitesModule,
    DropdownModule,
    CustomerTypeModule,
  ],
  providers: [
    QuotationService,
    AppQuotationService,
    OzoneQuotationService,
    OzoneAppQuotationService,
    ResponseService,
    PdfService,
    QuotationStrategyFactory,
    S3Service,
  ],
  controllers: [NewQuotationController, AppNewQuotationController],
})
export class QuotationModule {}
