import { Module } from '@nestjs/common';
import { TermsConditionsController } from './web/terms-conditions.controller';
import { TermsConditionsService } from './web/terms-conditions.service';
import { AppTermsConditionsController } from './app/app-terms-conditions.controller';
import { AppTermsConditionsService } from './app/app-terms-conditions.service';
import { MongooseModule } from '@nestjs/mongoose';
import { TermsConditionsModel, TermsConditionsSchema } from './models/terms-conditions.model';
import { OrgModel, OrgSchema } from '../../org/models/org.model';
import { ResponseService } from 'src/services/response.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: OrgModel.name, schema: OrgSchema },
      { name: TermsConditionsModel.name, schema: TermsConditionsSchema },
    ]),
  ],
  controllers: [TermsConditionsController, AppTermsConditionsController],
  providers: [TermsConditionsService, AppTermsConditionsService, ResponseService],
})
export class TermsConditionsModule { }