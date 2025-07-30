import { Module, forwardRef } from '@nestjs/common';
import { ProductController } from './web/product.controller';
import { ProductService } from './web/product.service';
import { AppProductController } from './app/app-product.controller';
import { AppProductService } from './app/app-product.service';
import { ResponseService } from 'src/services/response.service';
import { MongooseModule } from '@nestjs/mongoose';
import { ProductModel, ProductSchema } from './models/product.model';
import { CsvModule } from 'src/shared/csv/csv.module';
import { FormBuilderModule } from 'src/shared/form-builder/form-builder.module';
import {
  ProductDocsModel,
  ProductDocsSchema,
} from './models/product-docs.model';
import {
  PointCategoryMapModel,
  PointCategoryMapSchema,
} from '../point-category/models/point-category-map.model';
import {
  PointCategoryModel,
  PointCategorySchema,
} from '../point-category/models/point-category.model';
import { S3Service } from 'src/shared/rpc/s3.service';
import { ProductUploadService } from './product-upload.service';
import { CustomerTypeModule } from '../customer-type/customer-type.module';
import { ZoneMasterModule } from '../location-master/zone-master/zone-master.module';
import {
  ProductPriceModel,
  ProductPriceSchema,
} from './models/product-price.model';
import {
  OptionModel,
  OptionSchema,
} from '../dropdown/models/dropdown-options.model';
import { DropdownModule } from '../dropdown/dropdown.module';
import { DiscountModel, DiscountSchema } from './models/discount.model';
import { SharedProductService } from './shared-product-service';
import {
  CustomerModel,
  CustomerSchema,
} from '../customer/default/models/customer.model';
import {
  ZoneMasterModel,
  ZoneMasterSchema,
} from '../location-master/zone-master/models/zone-master.model';
import {
  OrderSchemeModel,
  OrderSchemeSchema,
} from 'src/modules/sfa/order/models/order-scheme.model';
import {
  ProductDispatchModel,
  ProductDispatchSchema,
} from './models/product-dispatch.model';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: ProductModel.name, schema: ProductSchema },
      { name: ProductDocsModel.name, schema: ProductDocsSchema },
      { name: PointCategoryMapModel.name, schema: PointCategoryMapSchema },
      { name: PointCategoryModel.name, schema: PointCategorySchema },
      { name: ProductPriceModel.name, schema: ProductPriceSchema },
      { name: DiscountModel.name, schema: DiscountSchema },
      { name: OptionModel.name, schema: OptionSchema },
      { name: CustomerModel.name, schema: CustomerSchema },
      { name: OrderSchemeModel.name, schema: OrderSchemeSchema },
      { name: ProductDispatchModel.name, schema: ProductDispatchSchema },
    ]),
    forwardRef(() => CsvModule),
    FormBuilderModule,
    CustomerTypeModule,
    ZoneMasterModule,
    DropdownModule,
  ],
  controllers: [ProductController, AppProductController],
  providers: [
    ProductService,
    AppProductService,
    ResponseService,
    S3Service,
    SharedProductService,
    ProductUploadService,
  ],
  exports: [SharedProductService, ProductService, ProductUploadService],
})
export class ProductModule {}
