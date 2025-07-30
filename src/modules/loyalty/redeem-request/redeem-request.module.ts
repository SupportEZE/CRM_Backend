import { Module } from '@nestjs/common';
import { RedeemRequestController } from './web/redeem-request.controller';
import { RedeemRequestService } from './web/redeem-request.service';
import { AppRedeemRequestController } from './app/app-redeem-request.controller';
import { AppRedeemRequestService } from './app/app-redeem-request.service';
import { MongooseModule } from '@nestjs/mongoose';
import {
  RedeemRequestModel,
  RedeemRequestSchema,
} from './models/redeem-request.model';
import { ResponseService } from 'src/services/response.service';
import {
  CustomerKycDetailModel,
  CustomerKycDetailSchema,
} from 'src/modules/master/customer/default/models/customer-kyc-details.model';
import {
  CustomerBankDetailModel,
  CustomerBankDetailSchema,
} from 'src/modules/master/customer/default/models/customer-bank-detail.model';
import {
  GiftGalleryModel,
  GiftGallerySchema,
} from './../gift-gallery/models/gift-gallery.model';
import { LedgerModule } from '../ledger/ledger.module';
import { NotificationService } from 'src/shared/rpc/notification.service';
import {
  GiftGalleryVoucherModel,
  GiftGalleryVoucherSchema,
} from '../gift-gallery/models/gift-gallery-vouchers.model';
import { GiftGalleryModule } from '../gift-gallery/gift-gallery.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: RedeemRequestModel.name, schema: RedeemRequestSchema },
      { name: CustomerKycDetailModel.name, schema: CustomerKycDetailSchema },
      { name: CustomerBankDetailModel.name, schema: CustomerBankDetailSchema },
      { name: GiftGalleryModel.name, schema: GiftGallerySchema },
      { name: GiftGalleryVoucherModel.name, schema: GiftGalleryVoucherSchema },
    ]),
    LedgerModule,
    GiftGalleryModule,
  ],
  controllers: [RedeemRequestController, AppRedeemRequestController],
  providers: [
    RedeemRequestService,
    AppRedeemRequestService,
    ResponseService,
    NotificationService,
  ],
})
export class RedeemRequestModule {}
