import { forwardRef, Module } from '@nestjs/common';
import { ComplaintController } from './web/complaint.controller';
import { AppComplaintController } from './app/app-complaint.controller';
import { ComplaintService } from './web/complaint.service';
import { AppComplaintService } from './app/app-complaint.service';
import { MongooseModule } from '@nestjs/mongoose';
import { ResponseService } from 'src/services/response.service';
import { DateTimeService } from 'src/services/date-time.service';
import { LocationService } from 'src/services/location.service';
import {
  UserModel,
  UserSchema,
} from 'src/modules/master/user/models/user.model';

import {
  CustomerTypeModel,
  CustomerTypeSchema,
} from 'src/modules/master/customer-type/models/customer-type.model';
import {
  SpareStockManageModel,
  SpareStockManageSchema,
} from 'src/modules/wcms/spare-part/models/spare-stock-manage.model';
import {
  SparePartModel,
  SparePartSchema,
} from 'src/modules/wcms/spare-part/models/spare-part.model';
import { FormBuilderModule } from 'src/shared/form-builder/form-builder.module';
import { ComplaintModel, ComplaintSchema } from './models/complaint.model';
import {
  ComplaintDocsModel,
  ComplaintDocsSchema,
} from './models/complaint-docs.model';
import {
  ComplaintInspectionModel,
  ComplaintInspectionSchema,
} from './models/complaint-inspection.model';
import {
  ComplaintVisitModel,
  ComplaintVisitSchema,
} from './models/complaint-visit.model';
import {
  CustomerModel,
  CustomerSchema,
} from 'src/modules/master/customer/default/models/customer.model';
import {
  ComplaintSparePartModel,
  ComplaintSparePartSchema,
} from './models/complaint-spare-part.model';
import { S3Service } from 'src/shared/rpc/s3.service';
import { CustomerTypeModule } from 'src/modules/master/customer-type/customer-type.module';
import { CustomerModule } from 'src/modules/master/customer/customer.module';
import { RedisService } from 'src/services/redis.service';
import { UserModule } from 'src/modules/master/user/user.module';
import { ActivityModule } from 'src/modules/sfa/activity/activity.module';
import { CommentModule } from 'src/modules/sfa/comment/comment.module';

import {
  ComplaintInvoiceModel,
  ComplaintInvoiceSchema,
} from '../complaint-invoice/models/complaint-invoice.model';
import {
  ComplaintInvoiceItemModel,
  ComplaintInvoiceItemSchema,
} from '../complaint-invoice/models/complaint-invoice-item.model';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: ComplaintModel.name, schema: ComplaintSchema },
      {
        name: ComplaintInspectionModel.name,
        schema: ComplaintInspectionSchema,
      },
      { name: ComplaintVisitModel.name, schema: ComplaintVisitSchema },
      { name: ComplaintDocsModel.name, schema: ComplaintDocsSchema },
      { name: ComplaintSparePartModel.name, schema: ComplaintSparePartSchema },
      { name: SpareStockManageModel.name, schema: SpareStockManageSchema },
      { name: SparePartModel.name, schema: SparePartSchema },
      { name: ComplaintInvoiceModel.name, schema: ComplaintInvoiceSchema },
      { name: CustomerModel.name, schema: CustomerSchema },
      {
        name: ComplaintInvoiceItemModel.name,
        schema: ComplaintInvoiceItemSchema,
      },
    ]),
    FormBuilderModule,
    CustomerTypeModule,
    CustomerModule,
    UserModule,
    ActivityModule,CommentModule
  ],
  controllers: [ComplaintController, AppComplaintController],
  providers: [
    ComplaintService,
    ResponseService,
    DateTimeService,
    LocationService,
    AppComplaintService,
    S3Service,
    RedisService,
  ],
})
export class ComplaintModule {}
