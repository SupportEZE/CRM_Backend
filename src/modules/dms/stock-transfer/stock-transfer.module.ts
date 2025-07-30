import { Module } from '@nestjs/common';
import { StockTransferController } from './web/stock-transfer.controller';
import { StockTransferService } from './web/stock-transfer.service';
import { AppStockTransferController } from './app/app-stock-transfer.controller';
import { AppStockTransferService } from './app/app-stock-transfer.service';
import { MongooseModule } from '@nestjs/mongoose';
import { CustomerStockItemModel, CustomerStockItemSchema } from './models/company-customer-stock-item.model';
import { CustomerStockModel, CustomerStockSchema } from './models/company-customer-stock.model';
import { ResponseService } from 'src/services/response.service';
import { CustomerToCustomerStockItemModel, CustomerToCustomerStockItemSchema } from './models/customer-customer-stock-item.model';
import { CustomerToCustomerStockModel, CustomerToCustomerStockSchema } from './models/customer-customer-stock.model';
import { StockTransferDocsModel, StockTransferDocsSchema } from './models/stock-transfer-docs.model';
import { S3Service } from 'src/shared/rpc/s3.service';
import { CustomerModule } from 'src/modules/master/customer/customer.module';
import { ProductModel, ProductSchema } from 'src/modules/master/product/models/product.model';
import { ProductModule } from 'src/modules/master/product/product.module';
import { LedgerModule } from 'src/modules/loyalty/ledger/ledger.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: CustomerStockModel.name, schema: CustomerStockSchema },
      { name: CustomerStockItemModel.name, schema: CustomerStockItemSchema },
      { name: CustomerToCustomerStockItemModel.name, schema: CustomerToCustomerStockItemSchema },
      { name: CustomerToCustomerStockModel.name, schema: CustomerToCustomerStockSchema },
      { name: StockTransferDocsModel.name, schema: StockTransferDocsSchema },
      { name: ProductModel.name, schema: ProductSchema },

    ]),
    CustomerModule,
    ProductModule,
    LedgerModule,
  ],
  controllers: [StockTransferController, AppStockTransferController],
  providers: [StockTransferService, AppStockTransferService, ResponseService, S3Service],
  exports: [MongooseModule],
})
export class StockTransferModule { }
