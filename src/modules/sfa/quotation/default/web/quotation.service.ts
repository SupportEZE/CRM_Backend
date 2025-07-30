import { HttpStatus, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { QuotationModel } from '../models/quotation.model';
import { ResponseService } from 'src/services/response.service';
import { calculatePercentage, commonFilters, getCurrentYearMonthsRange, nextSeq, readTemplateFile, toObjectId } from 'src/common/utils/common.utils';
import { PdfService } from 'src/shared/rpc/pdf.service';
import { SharedUserService } from 'src/modules/master/user/shared-user.service';
import { SharedCustomerService } from 'src/modules/master/customer/shared-customer.service';
import { GlobalService } from 'src/shared/global/global.service';
import { QuotationType } from './dto/quotation.dto';
@Injectable()
export class QuotationService {
    constructor
        (
            @InjectModel(QuotationModel.name) private quotationModel: Model<QuotationModel>,
            private readonly res: ResponseService,
            private readonly pdfService: PdfService,
            private readonly sharedUserService: SharedUserService,
            private readonly sharedCustomerService: SharedCustomerService,
            private readonly globalService: GlobalService
        ) { }
    async create(req: any, params: any): Promise<any> {
        try {
            if (params.quotation_type === QuotationType.Enquiry || params.quotation_type === QuotationType.Site) {
                delete params.customer_type_name
                delete params.customer_type_id
            }
            const seq = {
                modelName: this.quotationModel,
                idKey: 'quotation_id',
                prefix: 'QUOT'
            }
            const newQuotationId = await nextSeq(req, seq)

            if (params.quotation_type === QuotationType.Customer) {
                params.customer_type_id = toObjectId(params.customer_type_id)
            }
            params.customer_id = toObjectId(params.customer_id)
            let saveObj: Record<string, any> = {
                ...req['createObj'],
                ...params,
                quotation_id: newQuotationId
            };
            saveObj.cart_item = saveObj.cart_item.map(item => ({
                ...item,
                product_id: toObjectId(item.product_id),
            }));
            const document = new this.quotationModel(saveObj);
            const insert = await document.save();
            if (!insert || !insert._id) {
                return this.res.error(HttpStatus.BAD_REQUEST, 'ERROR.BAD_REQ');
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

            const activeStatus = params.activeTab;
            if (![global.QUOTATION_STATUS[1], global.QUOTATION_STATUS[2], global.QUOTATION_STATUS[3]].includes(activeStatus)) {
                return this.res.error(HttpStatus.BAD_REQUEST, 'ERROR.BAD_REQ');
            }

            const filters: Record<string, any> = commonFilters(params?.filters);

            if (activeStatus === global.QUOTATION_STATUS[1]) {
                match = { ...match, status: global.QUOTATION_STATUS[1] };
            } else if (activeStatus === global.QUOTATION_STATUS[2]) {
                match = { ...match, status: global.QUOTATION_STATUS[2] };
            } else if (activeStatus === global.QUOTATION_STATUS[3]) {
                match = { ...match, status: global.QUOTATION_STATUS[3] };
            }

            if (global.LOGIN_TYPE_ID_PERMISSION?.includes(req['user']['login_type_id'])) {
                const userIds = await this.sharedUserService.getUsersIds(req, params);
                match.$or = [
                    { user_id: { $in: userIds } },
                    { created_id: { $in: userIds } }
                ];
            }

            match = { ...filters, ...match };

            const page: number = params?.page || global.PAGE;
            const limit: number = params?.limit || global.LIMIT;
            const skip: number = (page - 1) * limit;

            const res: Record<string, any>[] = await this.quotationModel.find(match)
                .sort({ created_at: -1 }) 
                .skip(skip)
                .limit(limit);

            const approvedCount: number = await this.quotationModel.countDocuments({ ...match, status: global.QUOTATION_STATUS[1] });
            const pendingCount: number = await this.quotationModel.countDocuments({ ...match, status: global.QUOTATION_STATUS[2] });
            const rejectCount: number = await this.quotationModel.countDocuments({ ...match, status: global.QUOTATION_STATUS[3] });

            const result: Record<string, any> = res.map(({ _doc, cart_item = [] }) => ({
                ..._doc,
                total_item: cart_item.length,
                total_qty: cart_item.reduce((sum, { qty = 0 }) => sum + qty, 0)
            }));

            const data: any = {
                result,
                activeTab: { approved_count: approvedCount, pending_count: pendingCount, reject_count: rejectCount },
            };

            let total = 0
            if (activeStatus === global.QUOTATION_STATUS[1]) {
                total = approvedCount
            } else if (activeStatus === global.QUOTATION_STATUS[2]) {
                total = pendingCount;
            } else if (activeStatus === global.QUOTATION_STATUS[3]) {
                total = rejectCount;
            }
            return this.res.pagination(data, total, page, limit);
        } catch (error) {
            return this.res.error(HttpStatus.BAD_REQUEST, 'ERROR.BAD_REQ', error);
        }
    }

    async detail(req: Request, params: any): Promise<any> {
        try {
            const match: Record<string, any> = {
                org_id: req['user']['org_id'],
                is_delete: 0,
                _id: toObjectId(params._id),
            };

            const data: Record<string, any> = await this.quotationModel.findOne(match).lean().exec();
            if (!data) return this.res.error(HttpStatus.BAD_REQUEST, 'ERROR.NOT_FOUND');

            params.customer_id = data['customer_id']
            switch (data['quotation_type']) {
                case QuotationType.Customer: {
                    const customers = await this.sharedCustomerService.getCustomersByIds(req, { customer_ids: [params.customer_id] });
                    data['customer_details'] = (customers && customers[0]) || {};
                    break;
                }
                case QuotationType.Enquiry: {
                    const enquiry = await this.globalService.getEnquiryById(req, params.customer_id);
                    data['customer_details'] = enquiry || {};
                    break;
                }
                case QuotationType.Site: {
                    const site = await this.globalService.getSiteById(req, params.customer_id);
                    data['customer_details'] = site || {};
                    break;
                }
                default:
                    data['customer_details'] = {};
            }
            return this.res.success('SUCCESS.FETCH', data);
        } catch (error) {
            return this.res.error(HttpStatus.BAD_REQUEST, 'ERROR.BAD_REQ', error);
        }
    }

    async addItem(req: Request, params: any): Promise<any> {
        try {
            const match: Record<string, any> = {
                org_id: req['user']['org_id'],
                _id: params._id
            };
            const exist: Record<string, any> = await this.quotationModel.findOne(match).lean();
            if (!exist) return this.res.error(HttpStatus.BAD_REQUEST, 'ERROR.NOT_FOUND');

            const cartItems = params.cart_item;
            const updateObj: Record<string, any> = {
                cart_item: cartItems,
                sub_total: params.sub_total,
                total_discount: params.total_discount,
                gst: params.gst,
                total_amount: params.total_amount,
                ...req['updateObj']
            };
            updateObj.cart_item = updateObj.cart_item.map(item => ({
                ...item,
                product_id: toObjectId(item.product_id),
            }));
            await this.quotationModel.updateOne({ _id: params._id }, updateObj);
            return this.res.success('SUCCESS.UPDATE');
        } catch (error) {
            return this.res.error(HttpStatus.BAD_REQUEST, 'ERROR.BAD_REQ', error);
        }
    }

    async updateStatus(req: Request, params: any): Promise<any> {
        try {
            let match: Record<string, any>;
            match = {
                org_id: req['user']['org_id'],
                _id: toObjectId(params._id)
            }
            let exist: Record<string, any> = await this.quotationModel.findOne(match).lean();
            if (!exist) return this.res.error(HttpStatus.BAD_REQUEST, 'ERROR.NOT_FOUND')
            const updateObj: Record<string, any> = {
                ...req['updateObj'],
                ...params
            }
            await this.quotationModel.updateOne({ _id: params._id }, updateObj);
            return this.res.success('SUCCESS.UPDATE')
        } catch (error) {
            return this.res.error(HttpStatus.BAD_REQUEST, 'ERROR.BAD_REQ', error)
        }
    }

    async delete(req: any, params: any): Promise<any> {
        try {
            let match: any = { _id: toObjectId(params._id) };
            const exist = await this.quotationModel.findOne(match).exec();
            if (!exist) return this.res.error(HttpStatus.BAD_REQUEST, 'WARNING.NOT_EXIST');
            if (params?.is_delete && exist['is_delete'] === params?.is_delete) return this.res.error(HttpStatus.BAD_REQUEST, 'WARNING.ALREADY_DELETE');
            const updateObj: Record<string, any> = {
                ...req['updateObj'],
                ...params,
            };
            await this.quotationModel.updateOne(
                { _id: params._id },
                updateObj
            );
            return this.res.success('SUCCESS.DELETE');
        } catch (error) {
            return this.res.error(HttpStatus.BAD_REQUEST, 'ERROR.BAD_REQ', error);
        }
    }

    async readDashboardCount(req: Request, params: any): Promise<any> {
        try {
            const user = req['user'];
            const orgId: number = user['org_id'];
            const userId = user['_id'];

            let match: Record<string, any> = {
                is_delete: 0,
                org_id: orgId
            };

            if (req?.url.includes(global.MODULE_ROUTES[23])) {
                match.created_id = userId;
            }

            const stageKeys = ['win', 'lost', 'negotiation'] as const;
            const stageMap = {
                win: global.QUOTATION_STAGES[1],
                lost: global.QUOTATION_STAGES[2],
                negotiation: global.QUOTATION_STAGES[3],
            };

            const statusMatch = {
                approved: { ...match, status: global.QUOTATION_STATUS[1] },
                rejected: { ...match, status: global.QUOTATION_STATUS[3] },
            };

            const getCount = (match: any) => this.quotationModel.countDocuments(match).exec();
            const getAmount = (match: any, groupBy: string) =>
                this.aggregateData(match, groupBy, 'total_amount');

            const stagePromises = stageKeys.map(key => {
                const stageMatch = { ...match, stage: stageMap[key] };
                return Promise.all([
                    getCount(stageMatch),
                    getAmount(stageMatch, 'stage'),
                ]);
            });

            const [
                [win_count, total_win_amount],
                [lost_count, total_lost_amount],
                [negotiation_count, total_negotiation_amount],
            ] = await Promise.all(stagePromises);

            const [
                approved_count,
                reject_count,
                total_approved_amount,
                total_reject_amount,
            ] = await Promise.all([
                getCount(statusMatch.approved),
                getCount({ ...match, stage: stageMap.lost }),
                getAmount(statusMatch.approved, 'status'),
                getAmount(statusMatch.rejected, 'status'),
            ]);

            const [total_count, total_amount] = await Promise.all([
                getCount(match),
                getAmount(match, 'org_id'),
            ]);

            const coversion_percentage = calculatePercentage(win_count, total_count)

            return this.res.success('SUCCESS.FETCH', {
                approved_count,
                total_approved_amount,
                win_count,
                total_win_amount,
                lost_count,
                total_lost_amount,
                negotiation_count,
                total_negotiation_amount,
                reject_count,
                total_reject_amount,
                total_count,
                total_amount,
                coversion_percentage
            });
        } catch (error) {
            return this.res.error(HttpStatus.BAD_REQUEST, 'ERROR.BAD_REQ', error);
        }
    }

    async aggregateData(match: Record<string, any>, groupBy: string, sumField: string | number = 1
    ): Promise<number> {
        try {
            const pipeline: any[] = [
                { $match: match },
                {
                    $group: {
                        _id: `$${groupBy}`,
                        total_amount: typeof sumField === 'number' ? { $sum: sumField } : { $sum: `$${sumField}` },
                    },
                },
            ];

            const result = await this.quotationModel.aggregate(pipeline).exec();

            if (!result || result.length === 0) {
                return 0;
            }
            return result.reduce((acc, curr) => acc + (curr.total_amount || 0), 0);
        } catch (error) {
            throw error;
        }
    }

    async exportPdf(req: Request, params: any): Promise<any> {
        try {
            const match: Record<string, any> = {
                org_id: req['user']['org_id'],
                is_delete: 0,
                _id: toObjectId(params._id)
            };

            const data: Record<string, any> = await this.quotationModel.findOne(match).exec();
            if (!data) return this.res.error(HttpStatus.BAD_REQUEST, 'ERROR.NOT_FOUND');

            const formatCurrency = (num: number) => `${num.toFixed(2)}`;

            const quotationData = {
                company_name: req['user']['org_name'],
                company_address: "123 Business Road, City, Country",
                company_email: "info@yourcompany.com",
                company_phone: "+123456789",
                customer_name: data['customer_name'],
                customer_company: data['customer_name'],
                customer_email: "",
                quotation_date: new Date(data['created_at']).toISOString().split('T')[0],
                quotation_number: data['quotation_id'],
                items: data['cart_item'].map((item: any) => ({
                    product_name: item.product_name,
                    quantity: item.qty,
                    unit_price: formatCurrency(item.price),
                    total_price: formatCurrency(item.total_price),
                    discount_percent: formatCurrency(item.discount_percent),
                    gst_percent: formatCurrency(item.gst_percent),
                    sub_total: formatCurrency(item.sub_total),
                    net_amount: formatCurrency(item.net_amount)
                })),
                sub_total: formatCurrency(data['sub_total']),
                total_gst: formatCurrency(data['gst']),
                grand_total: formatCurrency(data['total_amount']),
                validity_period: data['valid_upto'] ? new Date(data['valid_upto']).toISOString().split('T')[0] : "",
                payment_term: data['payment_term'],
                note: data['note']
            };
            const html = readTemplateFile('quotation', quotationData);

            const pdfObj: Record<string, any> = {
                html,
                module_id: global.MODULES['Quotation'],
                module_name: "Quotation",
                filename: `${data.quotation_id}.pdf`
            };
            const response = await this.pdfService.htmlPdf(req, pdfObj);
            return this.res.success('SUCCESS.FETCH', response);
        } catch (error) {
            return this.res.error(HttpStatus.BAD_REQUEST, 'ERROR.BAD_REQ', error);
        }
    }

    async readDashboardGraph(req: Request, params: any): Promise<any> {
        try {
            const monthRanges: Record<string, any>[] = getCurrentYearMonthsRange();
            let match: Record<string, any> = {
                is_delete: 0,
                org_id: req['user']['org_id'],
                status: global.QUOTATION_STATUS[1],
            };

            if (req?.url.includes(global.MODULE_ROUTES[23])) {
                match.created_id = req['user']['_id']
            }
            const STAGES: string = global.QUOTATION_STAGES;
            const monthlyData: Record<string, any>[] = [];

            for (const month of monthRanges) {
                const dateMatch: Record<string, any> = {
                    ...match,
                    created_at: { $gte: month.start, $lte: month.end },
                };

                const total: number = await this.quotationModel.countDocuments(dateMatch);
                const win: number = await this.quotationModel.countDocuments({ ...dateMatch, stage: STAGES[1] });
                const lost: number = await this.quotationModel.countDocuments({ ...dateMatch, stage: STAGES[2] });
                const negotiation: number = await this.quotationModel.countDocuments({ ...dateMatch, stage: STAGES[3] });

                monthlyData.push({
                    month: month.monthName,
                    approved: total,
                    win,
                    lost,
                    negotiation
                });
            }
            return this.res.success('SUCCESS.FETCH', { data: monthlyData });
        } catch (error) {
            return this.res.error(HttpStatus.BAD_REQUEST, 'ERROR.BAD_REQ', error);
        }
    }

}

