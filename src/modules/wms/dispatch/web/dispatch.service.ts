import { HttpStatus, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { DispatchModel } from '../model/dispatch.model';
import { DispatchItemsModel } from '../model/dispatch-items.model';
import { Model } from 'mongoose';
import { ResponseService } from 'src/services/response.service';
import { COLLECTION_CONST } from 'src/config/collection.constant';
import { QrcodeService } from 'src/modules/loyalty/qr-code/web/qr-code.service';
import { toObjectId, commonFilters, Like } from 'src/common/utils/common.utils';
import { PrimaryOrderModel } from 'src/modules/sfa/order/models/primary-order.model';
import { PrimaryOrderItemModel } from 'src/modules/sfa/order/models/primary-order-item.model';
import { OrderService } from 'src/modules/sfa/order/web/order.service';
import { SharedCustomerService } from 'src/modules/master/customer/shared-customer.service';

@Injectable()
export class DispatchService {
    constructor(
        @InjectModel(DispatchModel.name) private dispatchModel: Model<DispatchModel>,
        @InjectModel(DispatchItemsModel.name) private dispatchItemsModel: Model<DispatchItemsModel>,
        @InjectModel(PrimaryOrderModel.name) private primaryOrderModel: Model<PrimaryOrderModel>,
        @InjectModel(PrimaryOrderItemModel.name) private primaryOrderItemModel: Model<PrimaryOrderItemModel>,
        private readonly res: ResponseService,
        private readonly qrcodeService: QrcodeService,
        private readonly orderService: OrderService,
        private readonly sharedCustomerService: SharedCustomerService,
    ) { }

    async dispatchPlan(req: Request, params: any): Promise<any> {
        try {
            params.orderDetail.order_id = toObjectId(params.orderDetail.order_id)
            const order_details = await this.fetchOrderDetails(req, params.orderDetail.order_id);

            if (!order_details || Object.keys(order_details).length === 0) {
                return this.res.error(HttpStatus.NOT_FOUND, 'DISPATCH.ORDER_NOT_FOUND');
            }

            const itemValidationResults = await Promise.all(params.items.map(async (element: any) => {
                return this.validateOrderItem(req, element);
            }));

            for (const validation of itemValidationResults) {
                if (validation.error) {
                    return validation.error;
                }
            }

            return await this.createDispatch(req, params);
        } catch (error) {
            return this.res.error(HttpStatus.BAD_REQUEST, 'ERROR.BAD_REQ', error);
        }
    }

    async fetchOrderDetails(req: Request, order_id: string): Promise<any> {
        return this.primaryOrderModel.findOne({
            _id: toObjectId(order_id),
            org_id: req['user']['org_id'],
        }).exec();
    }

    async validateOrderItem(req: Request, element: any): Promise<any> {
        const orderItem = await this.primaryOrderItemModel.findOne({
            _id: toObjectId(element.item_id),
        }).exec();

        if (!orderItem) {
            return this.res.error(HttpStatus.NOT_FOUND, 'DISPATCH.ORDER_ITEM_NOT_FOUND');
        }

        const pendingQty = orderItem.total_quantity - orderItem.dispatch_quantity;
        if (element.items[0].dispatch_quantity > pendingQty) {
            return this.res.error(HttpStatus.CONFLICT, 'DISPATCH.DISPATCH_QTY_GREATER_THAN_ORDER');
        }

        const primarySumResult = await this.primaryOrderItemModel.aggregate([
            { $match: { _id: toObjectId(element.item_id), is_delete: 0 } },
            {
                $group: {
                    _id: null,
                    dispatched_qty: { $sum: '$dispatch_quantity' },
                },
            },
        ]);

        const primaryDispatchedQty = primarySumResult.length > 0 ? primarySumResult[0].dispatched_qty : 0;

        const dispatchSumResult = await this.dispatchItemsModel.aggregate([
            { $match: { item_id: toObjectId(element.item_id), is_delete: 0 } },
            {
                $group: {
                    _id: null,
                    planned_qty: { $sum: '$planned_qty' },
                },
            },
        ]);

        const dispatchTotalQty = dispatchSumResult.length > 0 ? dispatchSumResult[0].planned_qty : 0;

        if (dispatchTotalQty > primaryDispatchedQty) {
            return this.res.error(HttpStatus.CONFLICT, 'DISPATCH.DISPATCH_QTY_CANT_GREATER_THAN_ORDERED');
        }

        return { error: null };
    }

    async createDispatch(req: Request, params: any): Promise<any> {
        try {
            const dispatchData = {
                ...req['createObj'],
                order_id: toObjectId(params.orderDetail.order_id),
                order_no: params.orderDetail.order_no,
                order_date: params.orderDetail.created_at,
                dispatch_from: params.dispatch_from,
                shipping_address: params.orderDetail.shipping_address,
                customer_address: params.orderDetail.customer_info.full_address,
                customer_id: toObjectId(params.orderDetail.customer_info._id),
                customer_type_id: toObjectId(params.orderDetail.customer_info.customer_type_id),
                customer_type_name: params.orderDetail.customer_info.customer_type_name,
                customer_name: params.orderDetail.customer_info.customer_name,
                company_name: params.orderDetail.customer_info.company_name ?? '',
                mobile: params.orderDetail.customer_info.mobile,
                customer_code: params.orderDetail.customer_info.customer_code ?? '',
                dispatch_status: 'order_packing',
                billing_company: params.orderDetail.billing_company,
            };

            const newDispatch = new this.dispatchModel(dispatchData);
            const savedDispatch = await newDispatch.save();

            const itemsToInsert = params.items.map((item: any) => ({
                ...req['createObj'],
                ...item,
                product_id: toObjectId(item.product_id),
                item_id: toObjectId(item.item_id),
                dispatch_id: savedDispatch._id,
                order_id: params.orderDetail.order_id,
                scanned_quantity: 0,
            }));

            if (itemsToInsert.length > 0) {
                await this.dispatchItemsModel.insertMany(itemsToInsert);
            }

            const bulkOps = params.items.map((element: any) => ({
                updateOne: {
                    filter: { _id: toObjectId(element.item_id), is_delete: 0 },
                    update: {
                        $inc: { dispatch_quantity: element.planned_qty },
                        $set: req['updateObj'],
                    }
                }
            }));

            if (bulkOps.length > 0) {
                await this.primaryOrderItemModel.bulkWrite(bulkOps);
                const statusParams = { order_id: params.orderDetail.order_id }
                await this.orderPlanningStatus(req, statusParams)
            }
            return this.res.success('SUCCESS.CREATE');
        } catch (error) {
            return this.res.error(HttpStatus.BAD_REQUEST, 'ERROR.BAD_REQ', error);
        }
    }

    private async orderPlanningStatus(req: Request, params: any): Promise<any> {
        try {
            const orderId = toObjectId(params.order_id);
            const [aggregateResult] = await this.primaryOrderItemModel.aggregate([
                {
                    $match: {
                        order_id: orderId,
                        is_delete: 0
                    }
                },
                {
                    $group: {
                        _id: null,
                        dispatch_quantity: { $sum: '$dispatch_quantity' },
                        total_quantity: { $sum: '$total_quantity' }
                    }
                }
            ]);

            const dispatchedQty = aggregateResult?.dispatch_quantity || 0;
            const totalOrderedQty = aggregateResult?.total_quantity || 0;

            const undispatchItems = await this.dispatchItemsModel.find({
                order_id: orderId,
                status: { $ne: global.DISPATCH_STATUS[4] },
                is_delete: 0
            }).exec();

            const dispatchedItems = await this.dispatchItemsModel.find({
                order_id: orderId,
                status: global.DISPATCH_STATUS[4],
                is_delete: 0
            }).exec();

            let status: string;

            if (dispatchedQty === totalOrderedQty) {
                if (undispatchItems.length === 0) {
                    status = global.ORDER_STATUS[8];
                } else {
                    if (dispatchedItems.length === 0) {
                        status = global.ORDER_STATUS[6];
                    } else {
                        status = global.ORDER_STATUS[7];
                    }
                }
            } else {
                if (dispatchedItems.length > 0 && undispatchItems.length > 0) {
                    status = global.ORDER_STATUS[9];
                } else if (dispatchedItems.length > 0) {
                    status = global.ORDER_STATUS[7];
                } else {
                    status = global.ORDER_STATUS[5];
                }
            }

            await this.orderService.primaryOrderStatusChange(req, {
                _id: orderId,
                status
            });

            return {
                statusCode: 200,
                statusMsg: 'DISPATCH.ORDER_STATUS_UPDATED_SUCCESSFULLY'
            };
        } catch (error) {
            throw {
                statusCode: HttpStatus.BAD_REQUEST,
                message: 'ERROR.BAD_REQ',
                error
            };
        }
    }

    async excessItemReturnToOrder(req: Request, params: any): Promise<any> {
        try {
            const { item_id, dispatch_id, planned_qty } = params;
            const orgId = req['user']['org_id'];
            const updateObj = req['updateObj'];
            const objectId = toObjectId(item_id);

            const dispatchItem = await this.dispatchItemsModel.findOne({
                _id: objectId,
                org_id: orgId,
                is_delete: 0
            }).exec();

            if (!dispatchItem) {
                return this.res.error(HttpStatus.NOT_FOUND, 'DISPATCH.DISPATCH_ITEM_NOT_FOUND');
            }

            const orderItem = await this.primaryOrderItemModel.findOne({
                _id: dispatchItem.item_id,
                is_delete: 0
            }).exec();

            if (!orderItem) {
                return this.res.error(HttpStatus.NOT_FOUND, 'DISPATCH.ORDER_ITEM_NOT_FOUND');
            }

            if (planned_qty < dispatchItem.scanned_quantity) {
                return this.res.error(HttpStatus.BAD_REQUEST, 'DISPATCH.PLANNED_QTY_LESS_THAN_SCANNED');
            }

            if (planned_qty < 0) {
                return this.res.error(HttpStatus.BAD_REQUEST, 'DISPATCH.PLANNED_QTY_CANT_ZERO');
            }
            if (planned_qty > dispatchItem.planned_qty) {
                return this.res.error(HttpStatus.BAD_REQUEST, 'DISPATCH.PLANNED_CANNOT_GREATER_AVAILABLE');
            }
            const updateDispatchItemResult = await this.dispatchItemsModel.updateOne(
                { _id: objectId },
                {
                    $set: {
                        ...updateObj,
                        ...(planned_qty === 0 ? { is_delete: 1 } : { planned_qty })
                    }
                }
            );

            if (updateDispatchItemResult.modifiedCount === 0) {
                return this.res.error(HttpStatus.INTERNAL_SERVER_ERROR, 'ERROR.INTERNAL_SERVER_ERROR');
            }

            const dispatchDelta = dispatchItem.planned_qty - planned_qty;
            const newDispatchQty = orderItem.dispatch_quantity - dispatchDelta;
            if (newDispatchQty < 0) {
                return this.res.error(HttpStatus.BAD_REQUEST, 'DISPATCH.INVALID_QTY');
            }

            const orderItemUpdateResult = await this.primaryOrderItemModel.updateOne(
                { _id: dispatchItem.item_id },
                {
                    $set: {
                        ...updateObj,
                        dispatch_quantity: newDispatchQty
                    }
                }
            );

            if (orderItemUpdateResult.modifiedCount === 0) {
                return this.res.error(HttpStatus.INTERNAL_SERVER_ERROR, 'ERROR.INTERNAL_SERVER_ERROR');
            }

            const remainingItems = await this.dispatchItemsModel.findOne({
                dispatch_id: toObjectId(dispatch_id),
                org_id: orgId,
                is_delete: 0
            }).exec();

            if (!remainingItems) {
                const dispatchUpdateResult = await this.dispatchModel.updateOne(
                    { _id: toObjectId(dispatch_id) },
                    { $set: { ...updateObj, is_delete: 1 } }
                );

                if (dispatchUpdateResult.modifiedCount === 0) {
                    return this.res.error(HttpStatus.INTERNAL_SERVER_ERROR, 'ERROR.INTERNAL_SERVER_ERROR');
                }
            }
            const statusParams = { order_id: dispatchItem.order_id }
            await this.orderPlanningStatus(req, statusParams);
            return this.res.success('DISPATCH.ITEM_DECREASED');
        } catch (error) {
            return this.res.error(
                HttpStatus.BAD_REQUEST,
                'ERROR.BAD_REQ',
                error?.message || 'An unexpected error occurred.'
            );
        }
    }

    async read(req: Request, params: any): Promise<any> {
        try {
            let match: any = { is_delete: 0, org_id: req['user']['org_id'] };
            let sorting: Record<string, 1 | -1> = { _id: -1 };
            const filters = params?.filters || {};
            params.match = commonFilters(filters);

            if (params.activeTab) {
                match = { ...match, dispatch_status: params.activeTab };
            } else {
                return this.res.error(HttpStatus.BAD_REQUEST, 'ERROR.BAD_REQ');
            }

            const page: number = Math.max(1, parseInt(params?.page, 10) || global.PAGE);
            const limit: number = Math.max(1, parseInt(params?.limit, 10) || global.LIMIT);
            const skip: number = (page - 1) * limit;

            const count = await this.dispatchModel.countDocuments(match);
            const result: Record<string, any>[] = await this.dispatchModel
                .find(match)
                .sort(sorting)
                .skip(skip)
                .limit(limit)
                .lean();

            return this.res.pagination(result, count, page, limit);
        } catch (error) {
            return this.res.error(HttpStatus.BAD_REQUEST, 'ERROR.BAD_REQ', error);
        }
    }

    async detail(req: Request, params: any): Promise<any> {
        try {
            let match: any = { _id: params._id };

            let result = await this.dispatchModel
                .findOne(match)
                .lean();

            params.customer_id = result.customer_id
            result['marka'] = await this.sharedCustomerService.getMarkaDetail(req, params);

            return this.res.success('SUCCESS.FETCH', result);
        } catch (error) {
            return this.res.error(HttpStatus.BAD_REQUEST, 'ERROR.BAD_REQ', error);
        }
    }

    async items(req: Request, params: any): Promise<any> {
        try {
            const items = await this.dispatchItems(req, params);
            const planned_qty = items.reduce((sum, item) => sum + (item.planned_qty || 0), 0);
            const scanned_quantity = items.reduce((sum, item) => sum + (item.scanned_quantity || 0), 0);

            if (planned_qty === scanned_quantity) {
                await this.dispatchModel.updateOne(
                    { _id: toObjectId(params.dispatch_id) },
                    {
                        $set: { ...req['updateObj'], dispatch_status: global.DISPATCH_STATUS[2] },
                    }
                );
            }

            return this.res.success('SUCCESS.FETCH', {
                items,
                count: {
                    planned_qty,
                    scanned_quantity,
                    total_items: items.length
                }
            });
        } catch (error) {
            return this.res.error(HttpStatus.BAD_REQUEST, 'ERROR.BAD_REQ', error);
        }
    }

    private async dispatchItems(req: Request, params: any): Promise<any> {
        try {
            const matchStage = {
                dispatch_id: toObjectId(params.dispatch_id),
                is_delete: 0
            };

            const items = await this.dispatchItemsModel.aggregate([
                { $match: matchStage },
                {
                    $lookup: {
                        from: COLLECTION_CONST().CRM_PRODUCT_DISPATCH_CONFIG,
                        localField: 'product_id',
                        foreignField: 'product_id',
                        as: 'dispatch_info'
                    }
                },
                {
                    $unwind: {
                        path: '$dispatch_info',
                        preserveNullAndEmptyArrays: true
                    }
                },
                {
                    $project: {
                        _id: 1,
                        dispatch_id: 1,
                        product_id: 1,
                        quantity: 1,
                        planned_qty: 1,
                        scanned_quantity: 1,
                        product_name: 1,
                        product_code: 1,
                        dispatch_info: 1
                    }
                }
            ]);

            return items;
        } catch (error) {
            throw error;
        }
    }

    async dispatchQrCode(req: Request, params: any): Promise<any> {
        const qr = await this.qrcodeService.qrExist(req, params)
        if (qr.statusCode !== HttpStatus.OK) {
            const existItems = this.dispatchItems(req, params);
            return this.res.success(qr.statusMsg, existItems);
        }

        const dispatch_details = await this.dispatchModel.findOne({ _id: toObjectId(params.dispatch_id), is_delete: 0, org_id: req['user']['org_id'] })

        params.qr_data = qr
        params.dispatch_details = dispatch_details
        let dispatch: any
        if (qr.qrType === global.QRCODE_TYPE[1]) {
            dispatch = await this.itemQrDispatch(req, params)
        }
        if (qr.qrType === global.QRCODE_TYPE[2]) {
            if (qr.qrData.box_with_item) {
                dispatch = await this.boxQrDispatchWithItem(req, params)
            } else {
                dispatch = await this.boxQrDispatchWitoutItem(req, params)
            }
        }
        return this.res.success(dispatch.statusMsg, dispatch.statusCode);
    }

    private async itemQrDispatch(req: Request, params: any): Promise<any> {
        const items = await this.dispatchItems(req, params);
        const item = params.qr_data.qrData;

        const matchItem = await this.matchItemRules(req, items, item, req['user']['org_id']);

        if (!matchItem) {
            return { statusMsg: "DISPATCH.ORDER_ITEM_NOT_FOUND", statusCode: HttpStatus.NOT_FOUND }
        }

        const pending_scanned_qty = matchItem.planned_qty - matchItem.scanned_quantity

        if ((pending_scanned_qty || 0) <= 0) {
            return { statusMsg: "DISPATCH.NO_PENDING_QTY", statusCode: HttpStatus.CONFLICT }
        }

        const dispatch_status = await this.qrcodeService.updateDispatch(req, params);

        if (dispatch_status.statusCode === HttpStatus.OK) {
            await this.dispatchItemsModel.updateOne(
                { _id: toObjectId(matchItem._id) },
                { $set: { ...req['updateObj'], scanned_quantity: matchItem.scanned_quantity + 1 } }
            );
        }
        return { statusMsg: "DISPATCH.ITEM_DISPATCHED", statusCode: HttpStatus.OK }
    }

    private async boxQrDispatchWithItem(req: Request, params: any): Promise<any> {
        const orgId = req['user']['_id'];
        const items = await this.dispatchItems(req, params);
        const boxItems = params.qr_data?.qrData?.box_items || [];
        if (!boxItems.length) {
            return {
                statusMsg: "DISPATCH.BOX_EMPTY",
                statusCode: HttpStatus.NOT_FOUND,
            };
        }
        let total_pending_qty = 0
        for (const item of boxItems) {
            const matchItem = await this.matchItemRules(req, items, item, orgId);
            if (!matchItem) {
                return {
                    statusMsg: "DISPATCH.SOME_ITEM_NOT_FOUND_IN_DISPATCH",
                    statusCode: HttpStatus.NOT_FOUND,
                };
            }
            const pendingQty = matchItem.planned_qty - matchItem.scanned_quantity;

            if (pendingQty <= 0) {
                return {
                    statusMsg: "DISPATCH.NO_PENDING_QTY_ON_SOME_ITEMS",
                    statusCode: HttpStatus.CONFLICT,
                };
            }

            total_pending_qty = pendingQty
            item.item_id = matchItem._id;
        }

        if (total_pending_qty < boxItems.length) {
            return {
                statusMsg: "DISPATCH.BOX_SIZE_GREATER_THAN_PENDNIG",
                statusCode: HttpStatus.CONFLICT,
            };
        }

        params.qr_code = params.qr_code;
        params.qr_data.qrType = 'box';
        const boxDispatchStatus = await this.qrcodeService.updateDispatch(req, params);

        if (boxDispatchStatus.statusCode !== HttpStatus.OK) {
            return boxDispatchStatus;
        }

        for (const item of boxItems) {
            params.qr_code = item.qr_item_code;
            params.qr_data.qrType = 'item';

            const itemDispatchStatus = await this.qrcodeService.updateDispatch(req, params);

            if (itemDispatchStatus.statusCode === HttpStatus.OK) {
                await this.dispatchItemsModel.updateOne(
                    { _id: toObjectId(item.item_id) },
                    {
                        $inc: { scanned_quantity: 1 },
                        $set: { ...req['updateObj'] },
                    }
                );
            }
        }
        return {
            statusMsg: "DISPATCH.BOX_DISPATCHED",
            statusCode: HttpStatus.OK,
        };
    }

    private async boxQrDispatchWitoutItem(req: Request, params: any): Promise<any> {
        const orgId = req['user']['org_id'];
        const items = await this.dispatchItems(req, params);

        const boxQr = params.qr_data.qrData;
        const productId = boxQr?.product_id;
        const boxSize = boxQr?.box_size;

        if (!productId || !boxSize) {
            return {
                statusMsg: "DISPATCH.INVALID_BOX_QR_DATA",
                statusCode: HttpStatus.BAD_REQUEST,
            };
        }

        const matchItem = await this.matchItemRules(req, items, { product_id: productId }, orgId);
        if (!matchItem) {
            return {
                statusMsg: "DISPATCH.ORDER_ITEM_NOT_FOUND",
                statusCode: HttpStatus.NOT_FOUND,
            };
        }

        const pendingQty = matchItem.planned_qty - matchItem.scanned_quantity;

        if (pendingQty <= 0) {
            return {
                statusMsg: "DISPATCH.NO_PENDING_QTY",
                statusCode: HttpStatus.CONFLICT,
            };
        }

        if (boxSize > pendingQty) {
            return {
                statusMsg: "DISPATCH.BOX_SIZE_GREATER_THAN_PENDNIG",
                statusCode: HttpStatus.CONFLICT,
            };
        }

        params.qr_code = boxQr.qr_box_code;
        params.qr_data.qrType = 'box';

        const boxDispatchStatus = await this.qrcodeService.updateDispatch(req, params);
        if (boxDispatchStatus.statusCode !== HttpStatus.OK) {
            return boxDispatchStatus;
        }

        await this.dispatchItemsModel.updateOne(
            { _id: toObjectId(matchItem._id) },
            {
                $inc: { scanned_quantity: boxSize },
                $set: { ...req['updateObj'] },
            }
        );

        return {
            statusMsg: "DISPATCH.BOX_DISPATCHED",
            statusCode: HttpStatus.OK,
        };
    }

    private async matchItemRules(req: any, itemList: any[], scannedItem: any, orgId: string): Promise<any | null> {
        const rules = req['user']['org']['item_match_rules'] || ['product_id'];
        return itemList.find(dispatchItem => {
            return rules.every((rule: string) => {
                return dispatchItem[rule]?.toString() === scannedItem[rule]?.toString();
            });
        });
    }

    async manualDispatch(req: any, params: any): Promise<any> {
        const dispatchData = await this.dispatchModel.findOne({
            _id: toObjectId(params._id),
            org_id: req['user']['org_id']
        }).exec();
        if (!dispatchData) {
            return this.res.error(HttpStatus.NOT_FOUND, 'DISPATCH.INVALID_DATA');
        }

        const dispatchItem = await this.dispatchItemsModel.findOne({
            _id: toObjectId(params.item_id),
            org_id: req['user']['org_id']
        }).exec();

        if (!dispatchItem) {
            return this.res.error(HttpStatus.NOT_FOUND, 'DISPATCH.ITEM_NOT_FOUND_IN_DISPATCH');
        }

        params.dispatch_data = dispatchData
        params.dispatch_item = dispatchItem

        const manualdispatch: any = await this.qrcodeService.manualDispatch(req, params)
        if (manualdispatch.statusCode === HttpStatus.OK) {
            await this.dispatchItemsModel.updateOne(
                { _id: toObjectId(params._id) },
                { $set: { ...req['updateObj'], scanned_quantity: dispatchItem.scanned_quantity + params.planned_qty } }
            );
        }
        return this.res.success('SUCCESS.UPDATE');
    }
}

