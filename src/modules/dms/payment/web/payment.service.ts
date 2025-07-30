import { HttpStatus, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { InvoicePaymentModel } from '../models/invoice-payment.model';
import mongoose, { Model, Types } from 'mongoose';
import { ResponseService } from 'src/services/response.service';
import { toObjectId, commonFilters, Like } from 'src/common/utils/common.utils';
import { isObject } from 'class-validator';

@Injectable()
export class PaymentService {
    constructor(
        @InjectModel(InvoicePaymentModel.name) private invoicePaymentModel: Model<InvoicePaymentModel>,
        private readonly res: ResponseService,

    ) { }

    async read(req: Request, params: any): Promise<any> {
        try {
            let match: any = { is_delete: 0, org_id: req['user']['org_id'] };
            if (params._id) {
                match = { ...match, customer_id: toObjectId(params._id) }
            }
            let sorting: Record<string, 1 | -1> = { _id: -1 };

            const filters = params?.filters || {};
            params.match = commonFilters(filters);

            const page: number = Math.max(1, parseInt(params?.page, 10) || global.PAGE);
            const limit: number = Math.max(1, parseInt(params?.limit, 10) || global.LIMIT);
            const skip: number = (page - 1) * limit;

            const total = await this.invoicePaymentModel.countDocuments(match);
            const result = await this.invoicePaymentModel.find(match)
                .sort(sorting)
                .skip(skip)
                .limit(limit)
                .exec();

            return this.res.pagination(result, total, page, limit);

        } catch (error) {
            return this.res.error(HttpStatus.BAD_REQUEST, 'ERROR.BAD_REQ', error);
        }
    }

}

