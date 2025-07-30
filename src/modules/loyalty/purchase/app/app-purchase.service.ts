import { HttpStatus, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { ResponseService } from 'src/services/response.service';
import { PurchaseModel } from '../models/purchase.model';
import { PurchaseItemModel } from '../models/purchase-item.model';

@Injectable()
export class AppPurchaseService {
    constructor(
        @InjectModel(PurchaseModel.name) private purchaseModel: Model<PurchaseModel>,
        @InjectModel(PurchaseItemModel.name) private purchaseItemModel: Model<PurchaseItemModel>,
        private readonly res: ResponseService
    ) { }
}
