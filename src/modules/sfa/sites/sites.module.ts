import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { SitesModel, SitesSchema } from './models/sites.model';
import { SitesStageModel, SitesStageSchema } from './models/sites-stage.model';
import { SitesController } from './web/sites.controller';
import { SitesService } from './web/sites.service';
import { AppSitesController } from './app/app-sites.controller';
import { AppSitesService } from './app/app-sites.service';
import { ResponseService } from 'src/services/response.service';
import { DropdownModule } from 'src/modules/master/dropdown/dropdown.module';
import {
  VisitActivityModel,
  VisitActivitySchema,
} from '../activity/models/visit-activity.model';
import {
  CallActivityModel,
  CallActivitySchema,
} from '../activity/models/call-activity.model';
import {
  FollowupModel,
  FollowupSchema,
} from '../followup/models/followup.model';
import { S3Service } from 'src/shared/rpc/s3.service';
import { SitesDocsModel, SitesDocsSchema } from './models/sites-docs.model';
import {
  SitesCompetetorSchema,
  SitesComptetorModel,
} from './models/sites-competitor.model';
import {
  SitesContactModel,
  SitesContactSchema,
} from './models/sites-contact.model';
import {
  QuotationModel,
  QuotationSchema,
} from '../quotation/default/models/quotation.model';
import { LocationService } from 'src/services/location.service';
import { CommentModule } from '../comment/comment.module';
import { UserModule } from 'src/modules/master/user/user.module';
@Module({
  imports: [
    MongooseModule.forFeature([
      { name: SitesModel.name, schema: SitesSchema },
      { name: SitesStageModel.name, schema: SitesStageSchema },
      { name: CallActivityModel.name, schema: CallActivitySchema },
      { name: VisitActivityModel.name, schema: VisitActivitySchema },
      { name: FollowupModel.name, schema: FollowupSchema },
      { name: SitesDocsModel.name, schema: SitesDocsSchema },
      { name: SitesContactModel.name, schema: SitesContactSchema },
      { name: SitesComptetorModel.name, schema: SitesCompetetorSchema },
      { name: QuotationModel.name, schema: QuotationSchema },
    ]),
    DropdownModule,
    CommentModule,
    UserModule,
  ],

  providers: [
    SitesService,
    AppSitesService,
    ResponseService,
    S3Service,
    LocationService,
  ],
  controllers: [SitesController, AppSitesController],
  exports: [SitesService],
})
export class SitesModule {}
