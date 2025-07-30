import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ResponseService } from 'src/services/response.service';
import { PurchaseModel, PurchaseSchema } from './models/purchase.model';
import { PurchaseItemModel, PurchaseItemSchema } from './models/purchase-item.model';
import { PurchaseController } from './web/purchase.controller';
import { PurchaseService } from './web/purchase.service';
import { AppPurchaseController } from './app/app-purchase.controller';
import { AppPurchaseService } from './app/app-purchase.service';
import { ProductModule } from 'src/modules/master/product/product.module';
import { LedgerModule } from '../ledger/ledger.module';
import { PurchaseDocsModel, PurchaseDocsSchema } from './models/purchase-doc.model';
import { S3Service } from 'src/shared/rpc/s3.service';
@Module({
  imports: [
    MongooseModule.forFeature([
      { name: PurchaseModel.name, schema: PurchaseSchema },
      { name: PurchaseItemModel.name, schema: PurchaseItemSchema },
      { name: PurchaseDocsModel.name, schema: PurchaseDocsSchema }
    ]),
    ProductModule,
    LedgerModule
  ],
  controllers: [PurchaseController, AppPurchaseController],
  providers: [PurchaseService, AppPurchaseService, ResponseService, S3Service],
})
export class PurchaseModule { }
