import { Module } from '@nestjs/common';
import { GiftGalleryController } from './web/gift-gallery.controller';
import { GiftGalleryService } from './web/gift-gallery.service';
import { AppGiftGalleryController } from './app/app-giftgallery.controller';
import { AppGiftGalleryService } from './app/app-giftgallery.service';
import { MongooseModule } from '@nestjs/mongoose';
import {
  GiftGalleryModel,
  GiftGallerySchema,
} from './models/gift-gallery.model';
import { ResponseService } from 'src/services/response.service';
import {
  CustomerModel,
  CustomerSchema,
} from 'src/modules/master/customer/default/models/customer.model';
import {
  GiftGalleryLikeModel,
  GiftGalleryLikeSchema,
} from './models/gift-gallery-like-model';
import {
  CustomerTypeModel,
  CustomerTypeSchema,
} from 'src/modules/master/customer-type/models/customer-type.model';
import { CryptoService } from 'src/services/crypto.service';
import { cryptoHook } from 'src/common/hooks/crypto-hook';
import { AllConfigType } from 'src/config/config.type';
import { ConfigService } from '@nestjs/config';
import {
  GiftGalleryDocsModel,
  GiftGalleryDocsSchema,
} from './models/gift-gallery-docs.model';
import { S3Service } from 'src/shared/rpc/s3.service';
import {
  GiftGalleryVoucherModel,
  GiftGalleryVoucherSchema,
} from './models/gift-gallery-vouchers.model';
import { GiftGalleryVoucherCryptoFields } from './models/gift-gallery-vouchers.model';
import { VoucherModel, VoucherSchema } from './models/voucher-types.model';
import { InsideBannerModule } from 'src/shared/inside-banner/inside-banner.module';

@Module({
  imports: [
    MongooseModule.forFeatureAsync([
      {
        name: GiftGalleryVoucherModel.name,
        useFactory: async (configService: ConfigService<AllConfigType>) => {
          const cryptoService = new CryptoService(configService);
          cryptoHook(
            GiftGalleryVoucherSchema,
            GiftGalleryVoucherCryptoFields,
            cryptoService,
          );
          return GiftGalleryVoucherSchema;
        },
        inject: [ConfigService],
      },
    ]),
    MongooseModule.forFeature([
      { name: GiftGalleryDocsModel.name, schema: GiftGalleryDocsSchema },
      { name: GiftGalleryModel.name, schema: GiftGallerySchema },
      { name: CustomerModel.name, schema: CustomerSchema },
      { name: GiftGalleryLikeModel.name, schema: GiftGalleryLikeSchema },
      { name: CustomerTypeModel.name, schema: CustomerTypeSchema },
      { name: VoucherModel.name, schema: VoucherSchema },
    ]),
    InsideBannerModule,
  ],
  controllers: [GiftGalleryController, AppGiftGalleryController],
  providers: [
    GiftGalleryService,
    AppGiftGalleryService,
    ResponseService,
    S3Service,
    CryptoService,
  ],
  exports: [GiftGalleryService],
})
export class GiftGalleryModule {}
