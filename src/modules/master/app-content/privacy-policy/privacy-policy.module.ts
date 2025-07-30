import { Module } from '@nestjs/common';
import { PrivacyPolicyController } from './web/privacy-policy.controller';
import { PrivacyPolicyService } from './web/privacy-policy.service';
import { AppPrivacyPolicyController } from './app/app-privacy-policy.controller';
import { AppPrivacyPolicyService } from './app/app-privacy-policy.service';
import { MongooseModule } from '@nestjs/mongoose';
import { PrivacyPolicyModel, PrivacyPolicySchema } from './models/privacy-policy.model';
import { ResponseService } from 'src/services/response.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: PrivacyPolicyModel.name, schema: PrivacyPolicySchema },
    ]),
  ],
  controllers: [PrivacyPolicyController, AppPrivacyPolicyController],
  providers: [PrivacyPolicyService, AppPrivacyPolicyService, ResponseService],
})
export class PrivacyPolicyModule {}