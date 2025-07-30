import { Module } from '@nestjs/common';
import { ResponseService } from 'src/services/response.service';
import { S3Service } from 'src/shared/rpc/s3.service';
import { MongooseModule } from '@nestjs/mongoose';
import { DropdownModule } from 'src/modules/master/dropdown/dropdown.module';
import { UserModule } from 'src/modules/master/user/user.module';
import { CustomerModule } from 'src/modules/master/customer/customer.module';
import { UserHierarchyModel, UserHierarchySchema } from 'src/modules/master/user/models/user-hierarchy.model';
import { OzoneEnquiryStageModel, OzoneEnquiryStageSchema } from './ozone/models/ozone-enquiry-stage.model';
import { DB_NAMES } from 'src/config/db.constant';
import { FollowupModel, FollowupSchema } from '../followup/models/followup.model';
import { ActivityModule } from '../activity/activity.module';
import { CommentModule } from '../comment/comment.module';
import { EnquiryStrategyFactory } from './enquiry-strategy.factory';
import { DefaultEnquiryService } from './default/web/default-enquiry.service';
import { AppOzoneEnquiryService } from './ozone/app/app-ozone-enquiry.service';
import { EnquiryModel, EnquirySchema } from './default/models/enquiry.model';
import { EnquiryDocsModel, EnquiryDocsSchema } from './default/models/enquiry-docs.model';
import { EnquiryStageModel, EnquiryStageSchema } from './default/models/enquiry-stage.model';
import { OzoneEnquiryModel, OzoneEnquirySchema } from './ozone/models/ozone-enquiry.model';
import { OzoneEnquiryDocsModel, OzoneEnquiryDocsSchema } from './ozone/models/ozone-enquiry-docs.model';
import { OzoneEnquiryService } from './ozone/web/ozone-enquiry.service';
import { AppDefaultEnquiryService } from './default/app/app-default-enquiry.service';
import { EnquiryController } from './enquiry-controller.';
import { AppEnquiryController } from './app-enquiry-controller';
import { PostalCodeModule } from 'src/modules/master/location-master/postal-code/postal-code.module';
import { OzoneQuotationModel,OzoneQuotationSchema } from '../quotation/ozone/models/ozone-quotation.model';
@Module({
    imports: [
        // Default connection
        MongooseModule.forFeature([
            { name: EnquiryModel.name, schema: EnquirySchema },
            { name: EnquiryDocsModel.name, schema: EnquiryDocsSchema },
            { name: EnquiryStageModel.name, schema: EnquiryStageSchema },
            { name: FollowupModel.name, schema: FollowupSchema },
            { name: UserHierarchyModel.name, schema: UserHierarchySchema }
        ]),

        // Ozone Custom connection
        MongooseModule.forFeature(
            [
                { name: OzoneEnquiryModel.name, schema: OzoneEnquirySchema },
                { name: OzoneEnquiryDocsModel.name, schema: OzoneEnquiryDocsSchema },
                { name: OzoneEnquiryStageModel.name, schema: OzoneEnquiryStageSchema },
                { name: OzoneQuotationModel.name, schema: OzoneQuotationSchema }

            ],
            DB_NAMES().CUSTOM_DB,
        ),

        DropdownModule,
        ActivityModule,
        UserModule,
        CustomerModule,
        CommentModule,
        PostalCodeModule
    ],
    providers: [
        EnquiryStrategyFactory,
        DefaultEnquiryService,
        OzoneEnquiryService,
        AppDefaultEnquiryService,
        AppOzoneEnquiryService,
        ResponseService,
        S3Service],
    controllers: [EnquiryController, AppEnquiryController],
    exports: [DefaultEnquiryService, AppDefaultEnquiryService, OzoneEnquiryService, AppOzoneEnquiryService, EnquiryStrategyFactory]
})
export class EnquiryModule { }
