import { Module } from '@nestjs/common';
import { StockController } from './web/stock.controller';
import { StockService } from './web/stock.service';
import { AppStockController } from './app/app-stock.controller';
import { AppStockService } from './app/app-stock.service';
import { MongooseModule } from '@nestjs/mongoose';
import { StockAuditModel, StockAuditSchema } from './models/stock-audit.model';
import { ResponseService } from 'src/services/response.service';
import { S3Service } from 'src/shared/rpc/s3.service';
import { CustomerModule } from 'src/modules/master/customer/customer.module';
import { UserModule } from 'src/modules/master/user/user.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: StockAuditModel.name, schema: StockAuditSchema },
    ]),
    CustomerModule,
    UserModule
  ],
  controllers: [StockController, AppStockController],
  providers: [StockService, AppStockService, ResponseService, S3Service],
})
export class StockModule { }
