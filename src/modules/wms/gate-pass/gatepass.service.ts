import { HttpStatus, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { DispatchGatepassModel } from './model/gatepass.model';
import { Model } from 'mongoose';
import { ResponseService } from 'src/services/response.service';
import { COLLECTION_CONST } from 'src/config/collection.constant';
import { DispatchModel } from '../dispatch/model/dispatch.model';
import { DispatchItemsModel } from '../dispatch/model/dispatch-items.model';
import { toObjectId, commonFilters } from 'src/common/utils/common.utils';
import { QrcodeService } from 'src/modules/loyalty/qr-code/web/qr-code.service';

@Injectable()
export class GatepassService {
    constructor(
        @InjectModel(DispatchGatepassModel.name) private dispatchGatepassModel: Model<DispatchGatepassModel>,
        @InjectModel(DispatchModel.name) private dispatchModel: Model<DispatchModel>,
        @InjectModel(DispatchItemsModel.name) private dispatchItemModel: Model<DispatchItemsModel>,
        private readonly res: ResponseService,
        private readonly qrcodeService: QrcodeService,
    ) { }

    async create(req: Request, params: any): Promise<any> {
        try {
            const dispatchIdArray = Array.isArray(params.dispatch_data)
                ? params.dispatch_data.map(item => item._id)
                : [params.dispatch_data._id];

            const billingCompanies = Array.isArray(params.dispatch_data)
                ? params.dispatch_data.map(item => item.billing_company)
                : [params.dispatch_data.billing_company];

            const uniqueBillingCompanies = new Set(billingCompanies);
            if (uniqueBillingCompanies.size > 1) {
                return this.res.error(HttpStatus.BAD_REQUEST, 'DISPATCH.BILLING_COMPANY_MISMATCH');
            }

            const existingGatepass = await this.dispatchGatepassModel.findOne({
                dispatch_id: { $in: dispatchIdArray },
            }).exec();

            if (existingGatepass) {
                return this.res.error(HttpStatus.BAD_REQUEST, 'DISPATCH.GATEPASS_ALREADY_EXIST');
            }

            await this.qrcodeService.updateGatepassToQr(req, params);

            const identifier = await this.identifier(req, params);
            const prefix = 'GTP';
            const formattedCode = `${prefix}-${identifier.identifierNumber}`;

            const saveObj = {
                ...req['createObj'],
                ...params,
                dispatch_id: dispatchIdArray,
                billing_company: billingCompanies[0],
                status: global.DISPATCH_STATUS[3],
                identifier_number: identifier.identifierNumber,
                gatepass_number: formattedCode,
            };

            const newGatepass = new this.dispatchGatepassModel(saveObj);
            const createdGatepass = await newGatepass.save();

            if (createdGatepass) {
                await this.dispatchModel.updateMany(
                    { _id: { $in: dispatchIdArray } },
                    {
                        $set: {
                            ...req['updateObj'],
                            dispatch_status: global.DISPATCH_STATUS[3],
                        },
                    }
                );
            }

            return this.res.success('SUCCESS.CREATE', createdGatepass);
        } catch (error) {
            console.error('Error in create method:', error);
            return this.res.error(
                HttpStatus.BAD_REQUEST,
                'ERROR.BAD_REQ',
                error
            );
        }
    }

    async update(req: Request, params: any): Promise<any> {
        try {
            const existingGatepass = await this.dispatchGatepassModel.findOne({
                _id: params._id
            }).exec();

            if (!existingGatepass) {
                return this.res.error(HttpStatus.NOT_FOUND, 'DISPATCH.GATEPASS_NOT_FOUND', 'NO Gatepass.');
            }

            await this.dispatchGatepassModel.updateOne(
                {
                    _id: params._id,
                },
                {
                    $set: {
                        ...req['updateObj'],
                        ...params,
                    },
                }
            );
            return this.res.success('SUCCESS.CREATE');
        } catch (error) {
            return this.res.error(
                HttpStatus.BAD_REQUEST,
                'ERROR.BAD_REQ',
                error
            );
        }
    }

    async identifier(req: Request, params: any): Promise<any> {
        try {

            const orgId = req['user']['org_id']
            let identifierNumber: number;

            const match = {
                org_id: orgId,
            }

            let gatepass: Record<string, any> = await this.dispatchGatepassModel.findOne(match).sort({ _id: -1 })

            if (gatepass?.identifier_number) {
                identifierNumber = gatepass?.identifier_number + 1;
            } else {
                identifierNumber = 1;
            }
            return { identifierNumber };
        } catch (error) {
            throw error
        }
    }

    async read(req: Request, params: any): Promise<any> {
        try {
            let match: any = { is_delete: 0, org_id: req['user']['org_id'] };
            let sorting: Record<string, 1 | -1> = { _id: -1 };

            const filters = params?.filters || {};
            match = { ...match, ...commonFilters(filters) };

            if (params.activeTab) {
                match = { ...match, status: params.activeTab };
            } else {
                return this.res.error(HttpStatus.BAD_REQUEST, 'ERROR.BAD_REQ');
            }

            const page: number = Math.max(1, parseInt(params?.page, 10) || global.PAGE);
            const limit: number = Math.max(1, parseInt(params?.limit, 10) || global.LIMIT);
            const skip: number = (page - 1) * limit;

            const total = await this.dispatchGatepassModel.countDocuments(match);
            const result = await this.dispatchGatepassModel.find(match)
                .sort(sorting)
                .skip(skip)
                .limit(limit)
                .exec();

            return this.res.pagination(result, total, page, limit);

        } catch (error) {
            return this.res.error(HttpStatus.BAD_REQUEST, 'ERROR.BAD_REQ', error);
        }
    }

    async detail(req: Request, params: any): Promise<any> {
        try {
            const gatePassData = await this.dispatchGatepassModel.findOne(
                { _id: toObjectId(params._id) }
            ).exec();

            if (!gatePassData) {
                return this.res.error(HttpStatus.NOT_FOUND, 'ERROR.NOT_FOUND', 'Gatepass not found');
            }

            const dispatchIds = Array.isArray(gatePassData.dispatch_id)
                ? gatePassData.dispatch_id
                : [gatePassData.dispatch_id];

            const linkedOrders = await this.dispatchModel.find(
                { _id: { $in: dispatchIds } },
                {
                    order_no: 1,
                    order_date: 1,
                    customer_name: 1
                }
            ).exec();

            const linkedOrderDetails = await Promise.all(
                linkedOrders.map(async (order) => {
                    const linkedOrdersItems = await this.dispatchItemModel.aggregate([
                        { $match: { dispatch_id: order._id } },
                        {
                            $group: {
                                _id: null,
                                totalScannedQuantity: { $sum: "$scanned_quantity" }
                            }
                        }
                    ]);

                    return {
                        ...order.toObject(),
                        totalScannedQuantity: linkedOrdersItems[0]?.totalScannedQuantity || 0,
                    };
                })
            );

            return this.res.success('SUCCESS.FETCH', {
                gatePassData,
                linkedOrders: linkedOrderDetails,
            });
        } catch (error) {
            console.error('Error in detail method:', error);
            return this.res.error(
                HttpStatus.BAD_REQUEST,
                'ERROR.BAD_REQ',
                error
            );
        }
    }



    async masterBoxdetail(req: Request, params: any): Promise<any> {
        try {
            const masterBoxList = await this.qrcodeService.masterBoxLinkedToGatepass(req, params);
            const print_status = Array.isArray(masterBoxList)
                ? masterBoxList.every(box => !!box.customer_id)
                : false;

            const dispatchIds = Array.isArray(params.dispatch_id)
                ? params.dispatch_id.map(id => toObjectId(id))
                : [toObjectId(params.dispatch_id)];

            if (print_status === true && params.dispatch_status === global.DISPATCH_STATUS[3]) {
                await this.dispatchModel.updateMany(
                    { _id: { $in: dispatchIds } },
                    {
                        $set: {
                            ...req['updateObj'],
                            status: global.DISPATCH_STATUS[4],
                        },
                    }
                );
                await this.dispatchGatepassModel.updateOne(
                    { _id: toObjectId(params._id) },
                    {
                        $set: {
                            ...req['updateObj'],
                            status: global.DISPATCH_STATUS[4],
                        },
                    }
                );
            }

            return this.res.success('SUCCESS.FETCH', {
                masterBoxList,
                print_status
            });

        } catch (error) {
            console.error('Error in masterBoxdetail:', error);
            return this.res.error(
                HttpStatus.BAD_REQUEST,
                'ERROR.BAD_REQ',
                error?.message || 'An error occurred while fetching the data.'
            );
        }
    }

}

