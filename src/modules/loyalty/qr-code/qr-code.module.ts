import { Module } from '@nestjs/common';
import { CouponController } from './web/qr-code.controller';
import { QrcodeService } from './web/qr-code.service';
import { AppQrcodeController } from './app/app-qrcode.controller';
import { AppQrcodeService } from './app/app-qrcode.service';
import { MongooseModule } from '@nestjs/mongoose';
import { ResponseService } from 'src/services/response.service';
import { ItemQrcodeModel, ItemQrcodeSchema } from './models/item-qrcode.model';
import { BoxQrcodeModel, BoxQrcodeSchema } from './models/box-qrcode.model';
import {
  PointCatQrcodeModel,
  PointCatQrcodeSchema,
} from './models/point-cat-qrcode.model';
import {
  MasterBoxQrcodeModel,
  MasterBoxQrcodeSchema,
} from './models/master-box-qrcode.model';
import {
  QrcodeGeneratorModel,
  QrcodeGeneratorSchema,
} from './models/qrcode-generator.model';
import {
  ProductModel,
  ProductSchema,
} from 'src/modules/master/product/models/product.model';
import {
  ProductDispatchModel,
  ProductDispatchSchema,
} from 'src/modules/master/product/models/product-dispatch.model';
import {
  ProductPriceModel,
  ProductPriceSchema,
} from 'src/modules/master/product/models/product-price.model';
import {
  DispatchModel,
  DispatchSchema,
} from 'src/modules/wms/dispatch/model/dispatch.model';
import {
  PointCategoryModel,
  PointCategorySchema,
} from 'src/modules/master/point-category/models/point-category.model';
import {
  PointCategoryMapModel,
  PointCategoryMapSchema,
} from 'src/modules/master/point-category/models/point-category-map.model';
import { ScanQrcodeModel, ScanQrcodeSchema } from './models/scan-qrcode.model';
import {
  CustomerModel,
  CustomerSchema,
} from 'src/modules/master/customer/default/models/customer.model';
import {
  CustomerTypeModel,
  CustomerTypeSchema,
} from 'src/modules/master/customer-type/models/customer-type.model';
import { LedgerModule } from '../ledger/ledger.module';
import {
  QrcodeRuleModel,
  QrcodeRuleSchema,
} from './models/scan-qrcode-rules.model';
import { BonusModel, BonusSchema } from '../bonus/models/bonus.model';
import {
  BonusPointCategoryModel,
  BonusPointCategorySchema,
} from '../bonus/models/bonu-point-category.model';
import { NotificationService } from 'src/shared/rpc/notification.service';
import { InsideBannerModule } from 'src/shared/inside-banner/inside-banner.module';
import {
  ReferralBonusModel,
  ReferralBonusSchema,
} from 'src/modules/master/referral-bonus/models/referral-bonus.model';

import {
  DispatchGatepassModel,
  DispatchGatepassSchema,
} from 'src/modules/wms/gate-pass/model/gatepass.model';
import {
  ManualDispatchModel,
  ManualDispatchSchema,
} from 'src/modules/wms/dispatch/model/manual-dispatch.model';
import { DB_NAMES } from 'src/config/db.constant';
import { ProductModule } from 'src/modules/master/product/product.module';
@Module({
  imports: [
    MongooseModule.forFeature(
      [
        { name: QrcodeGeneratorModel.name, schema: QrcodeGeneratorSchema },
        { name: BoxQrcodeModel.name, schema: BoxQrcodeSchema },
        { name: ItemQrcodeModel.name, schema: ItemQrcodeSchema },
        { name: PointCatQrcodeModel.name, schema: PointCatQrcodeSchema },
        { name: ScanQrcodeModel.name, schema: ScanQrcodeSchema },
        { name: MasterBoxQrcodeModel.name, schema: MasterBoxQrcodeSchema },
      ],
      DB_NAMES().COUPON_DB,
    ),
    MongooseModule.forFeature([
      { name: QrcodeRuleModel.name, schema: QrcodeRuleSchema },
      { name: ProductModel.name, schema: ProductSchema },
      { name: ProductDispatchModel.name, schema: ProductDispatchSchema },
      { name: DispatchModel.name, schema: DispatchSchema },
      { name: PointCategoryModel.name, schema: PointCategorySchema },
      { name: CustomerModel.name, schema: CustomerSchema },
      { name: CustomerTypeModel.name, schema: CustomerTypeSchema },
      { name: ManualDispatchModel.name, schema: ManualDispatchSchema },
      { name: DispatchGatepassModel.name, schema: DispatchGatepassSchema },
      { name: PointCategoryMapModel.name, schema: PointCategoryMapSchema },
      { name: BonusModel.name, schema: BonusSchema },
      { name: BonusPointCategoryModel.name, schema: BonusPointCategorySchema },
      { name: ReferralBonusModel.name, schema: ReferralBonusSchema },
      { name: ProductPriceModel.name, schema: ProductPriceSchema },
    ]),
    LedgerModule,
    InsideBannerModule,
    ProductModule,
  ],
  controllers: [CouponController, AppQrcodeController],
  providers: [
    QrcodeService,
    NotificationService,
    AppQrcodeService,
    ResponseService,
  ],
  exports: [QrcodeService],
})
export class QrcodeModule {}
