import { Module } from '@nestjs/common';
import { BannerController } from './web/banner.controller';
import { BannerService } from './web/banner.service';
import { AppBannerController } from './app/app-banner.controller';
import { AppBannerService } from './app/app-banner.service';
import { MongooseModule } from '@nestjs/mongoose';
import { BannerModel, BannerSchema } from './models/banner.model';
import { ResponseService } from 'src/services/response.service';
import { LoginTypeModel } from '../../rbac/models/login-type.model';
import { BannerDocsModel, BannerDocsSchema } from './models/banner-docs.model';
import { S3Service } from 'src/shared/rpc/s3.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: BannerDocsModel.name, schema: BannerDocsSchema },
      { name: BannerModel.name, schema: BannerSchema },
      { name: LoginTypeModel.name, schema: LoginTypeModel }
    ]),
  ],
  controllers: [BannerController, AppBannerController],
  providers: [BannerService, AppBannerService, ResponseService, S3Service],
  exports: [BannerService]
})
export class BannerModule { }
