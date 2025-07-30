import { Injectable } from '@nestjs/common';
import { ResponseService } from 'src/services/response.service';
import { CustomerTypeModel } from '../models/customer-type.model';
import { Model } from 'mongoose';
import { InjectModel } from '@nestjs/mongoose';

@Injectable()
export class AppCustomerTypeService {
  constructor(
    @InjectModel(CustomerTypeModel.name) private customerTypeModel: Model<CustomerTypeModel>,
      private readonly res:ResponseService
  ) {}
}
