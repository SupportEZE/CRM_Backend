import { Module } from '@nestjs/common';
import { DownloaderGatewayService } from './downloader-gateway-service';
import { DownloaderService } from './downloader.service';
import { MongooseModule } from '@nestjs/mongoose';
import {
  ProductModel,
  ProductSchema,
} from 'src/modules/master/product/models/product.model';
import { JwtService } from '@nestjs/jwt';
import { CsvModule } from 'src/shared/csv/csv.module';
import {
  UserModel,
  UserSchema,
} from 'src/modules/master/user/models/user.model';
import {
  CustomerModel,
  CustomerSchema,
} from 'src/modules/master/customer/default/models/customer.model';
@Module({
  imports: [
    MongooseModule.forFeature([
      { name: ProductModel.name, schema: ProductSchema },
      { name: UserModel.name, schema: UserSchema },
      { name: CustomerModel.name, schema: CustomerSchema },
    ]),
    CsvModule,
  ],
  providers: [DownloaderGatewayService, DownloaderService, JwtService],
  exports: [DownloaderGatewayService],
})
export class DownloaderModule {}
