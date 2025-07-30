import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ResponseService } from 'src/services/response.service';
import { CustomerTypeModel, CustomerTypeSchema } from './models/customer-type.model';
import { CustomerTypeController } from './web/customer-type.controller';
import { CustomerTypeService } from './web/customer-type.service';
import { AppCustomerTypeController } from './app/app-customer-type.controller';
import { AppCustomerTypeService } from './app/app-customer-type.service';


@Module({
  imports: [
    MongooseModule.forFeature([
      { name: CustomerTypeModel.name, schema: CustomerTypeSchema },
    ]),
  ],
  controllers: [CustomerTypeController,AppCustomerTypeController],
  providers: [CustomerTypeService,AppCustomerTypeService,ResponseService],
  exports:[CustomerTypeService]
})
export class CustomerTypeModule {}
