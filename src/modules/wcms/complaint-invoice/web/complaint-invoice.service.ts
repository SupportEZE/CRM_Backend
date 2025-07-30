import { HttpStatus, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { ResponseService } from 'src/services/response.service';
import { ComplaintInvoiceModel } from '../models/complaint-invoice.model';
import { ComplaintInvoiceItemModel } from '../models/complaint-invoice-item.model';
import { commonFilters, nextSeq, toObjectId } from 'src/common/utils/common.utils';
import { ComplaintModel } from '../../complaint/models/complaint.model';
@Injectable()
export class ComplaintInvoiceService {
    constructor
        (
            @InjectModel(ComplaintInvoiceModel.name) private complaintInvoiceModel: Model<ComplaintInvoiceModel>,
            @InjectModel(ComplaintInvoiceItemModel.name) private complaintInvoiceItemModel: Model<ComplaintInvoiceItemModel>,
            @InjectModel(ComplaintModel.name) private ComplaintModel: Model<ComplaintModel>,
            private readonly res: ResponseService
        ) { }
    async create(req: any, params: any): Promise<any> {
        try {
            const complaintExist: Record<string, any> = await this.ComplaintModel.findOne({ _id: toObjectId(params.complaint_id) }).exec();
            if (!complaintExist) return this.res.error(HttpStatus.BAD_REQUEST, 'WARNING.DATA_NOT_FOUND');

            const seq = {
                modelName: this.complaintInvoiceModel,
                idKey: 'invoice_no',
                prefix: '#INV'
            }
            const newInvoiceNumber = await nextSeq(req, seq)

            params.invoice_date = new Date()
            params.customer_id = toObjectId(complaintExist.customer_id);
            params.customer_name = complaintExist.customer_name;
            params.customer_mobile = complaintExist.customer_mobile;
            params.customer_address = complaintExist.address;
            params.service_engineer_id = toObjectId(complaintExist.service_engineer_id);
            params.service_engineer_name = complaintExist.service_engineer_name;
            params.complaint_id = toObjectId(params.complaint_id);
            params.complaint_no = complaintExist.complaint_no;

            const items = params.item || [];
            const saveObj: Record<string, any> = {
                ...req['createObj'],
                ...params,
                invoice_no: newInvoiceNumber
            };
            const document = new this.complaintInvoiceModel(saveObj);
            const insert = await document.save();
            if (!insert._id) return this.res.error(HttpStatus.BAD_REQUEST, 'WARNING.INSERT_FAILED');
            if (items.length > 0) {
                const invoiceItems = items.map((item: any) => ({
                    ...req['createObj'],
                    ...item,
                    product_id: toObjectId(item.product_id),
                    invoice_id: insert._id
                }));
                await this.complaintInvoiceItemModel.insertMany(invoiceItems);
            }
            return this.res.success('SUCCESS.CREATE');
        } catch (error) {
            return this.res.error(HttpStatus.BAD_REQUEST, 'ERROR.BAD_REQ', error);
        }
    }

    async read(req: Request, params: any): Promise<any> {
        try {
            let match: Record<string, any> = {
                is_delete: 0,
                org_id: req['user']['org_id']
            };

            if (req?.url.includes(global.MODULE_ROUTES[28])) {
                match.service_engineer_id = req['user']['_id']
            }

            Object.assign(match, commonFilters(params?.filters));

            const page: number = params?.page || global.PAGE;
            const limit: number = params?.limit || global.LIMIT;
            const skip: number = (page - 1) * limit;

            const data: Record<string, any>[] = await this.complaintInvoiceModel.find(match)
                .skip(skip)
                .limit(limit)

            const total: number = await this.complaintInvoiceModel.countDocuments(match);
            return this.res.pagination(data, total, page, limit);
        } catch (error) {
            return this.res.error(HttpStatus.BAD_REQUEST, 'ERROR.BAD_REQ', error);
        }
    }

    async detail(req: Request, params: any): Promise<any> {
        try {
            const result: Record<string, any> = await this.complaintInvoiceModel.findOne({ _id: toObjectId(params._id) }).lean().exec()
            if (!result) return this.res.error(HttpStatus.NOT_FOUND, 'ERROR.NOT_FOUND');

            let match: Record<string, any> = { is_delete: 0, org_id: req['user']['org_id'], invoice_id: toObjectId(params._id) };
            let item: Record<string, any> = await this.complaintInvoiceItemModel.find(match).sort({ _id: -1 }).lean();

            result.item = item;
            return this.res.success('SUCCESS.FETCH', result);
        } catch (error) {
            return this.res.error(HttpStatus.BAD_REQUEST, 'ERROR.BAD_REQ', error);
        }
    }
}

