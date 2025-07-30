import { Module } from '@nestjs/common';
import { DropdownController } from './web/dropdown.controller';
import { DropdownService } from './web/dropdown.service';
import { AppDropdownController } from './app/app-dropdown.controller';
import { AppDropdownService } from './app/app-dropdown.service';
import { MongooseModule } from '@nestjs/mongoose';
import { DropdownModel, DropdownSchema } from './models/dropdown.model';
import { OptionModel, OptionSchema } from './models/dropdown-options.model';
import { ResponseService } from 'src/services/response.service';
import { PostalCodeModel, PostalCodeSchema } from './../location-master/postal-code/models/postal-code.model';
import { ProductModel, ProductSchema } from '../product/models/product.model';
import { OrgModel, OrgSchema } from '../org/models/org.model';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: DropdownModel.name, schema: DropdownSchema },
      { name: OptionModel.name, schema: OptionSchema },
      { name: PostalCodeModel.name, schema: PostalCodeSchema },
      { name: ProductModel.name, schema: ProductSchema },
      { name: OrgModel.name, schema: OrgSchema }
    ]),

  ],
  controllers: [DropdownController, AppDropdownController],
  providers: [DropdownService, AppDropdownService, ResponseService],
  exports: [DropdownService]
})
export class DropdownModule { }
