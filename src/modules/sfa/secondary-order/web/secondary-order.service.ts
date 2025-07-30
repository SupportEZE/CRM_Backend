import { Injectable, HttpStatus } from '@nestjs/common';
import { ResponseService } from 'src/services/response.service';
import { Model } from 'mongoose';
import { DropdownService } from 'src/modules/master/dropdown/web/dropdown.service';
import { S3Service } from 'src/shared/rpc/s3.service';
import { SharedCustomerService } from 'src/modules/master/customer/shared-customer.service';
import { SharedUserService } from 'src/modules/master/user/shared-user.service';
import { PdfService } from 'src/shared/rpc/pdf.service';
import { SecondaryOrderModel } from '../models/secondary-order.model';
import { InjectModel } from '@nestjs/mongoose';
import { SecondaryOrderItemModel } from '../models/secondary-order-item.model';
import { SecondaryOrderCartModel } from '../models/secondary-order-cart.model';
import { SecondaryOrderCartItemModel } from '../models/secondary-order-cart-item.model';
import { commonFilters, commonSearchFilter, toObjectId } from 'src/common/utils/common.utils';
import { ProductService } from 'src/modules/master/product/web/product.service';
@Injectable()
export class SecondaryOrderService {
    constructor(
        @InjectModel(SecondaryOrderModel.name) private secondaryOrderModel: Model<SecondaryOrderModel>,
        @InjectModel(SecondaryOrderItemModel.name) private secondaryOrderItemModel: Model<SecondaryOrderItemModel>,
        @InjectModel(SecondaryOrderCartModel.name) private secondaryOrderCartModel: Model<SecondaryOrderCartModel>,
        @InjectModel(SecondaryOrderCartItemModel.name) private secondaryOrderCartItemModel: Model<SecondaryOrderCartItemModel>,
        private readonly res: ResponseService,
        private readonly dropdownService: DropdownService,
        private readonly sharedCustomerService: SharedCustomerService,
        private readonly sharedUserService: SharedUserService,
        private readonly s3Service: S3Service,
        private readonly pdfService: PdfService,
        private readonly productService: ProductService
    ) { }
    async fetchOrderDropdowns(req: Request, params: any): Promise<any> {
        try {
            const match: Record<string, any> = {
                is_delete: 0,
                module_id: global.SUB_MODULES['Products'],
                org_id: req['user']['org_id'],
                internalCall: true,
            };
            const dropdownArray: Record<string, any>[] = await this.dropdownService.readProductRelatedDropdown(req, { ...params, ...match });
            return this.res.success('SUCCESS.FETCH', dropdownArray);
        } catch (error) {
            return this.res.error(HttpStatus.BAD_REQUEST, 'ERROR.BAD_REQ', error.message);
        }
    }
    
    /*Secondary Order Cart START */
    async addSecondaryOrderCart(req: Request, params: any): Promise<any> {
        const orgId: number = req['user']['org_id'];
        const createdById = toObjectId(req['user']['_id']);
        
        if (params?.customer_id) {
            const customers: Record<string, any>[] = await this.sharedCustomerService.getCustomersByIds(req, params);
            if (customers.length > 0 && customers[0]?.customer_name) {
                params.customer_name = customers[0].customer_name;
            }
        } else {
            params.customer_id = req['user']['_id'];
            params.customer_name = req['user']['name'];
        }
        
        const match: Record<string, any> = {
            org_id: orgId,
            customer_id: toObjectId(params.customer_id),
            created_id: createdById,
            is_delete: 0
        };
        
        let cart = await this.secondaryOrderCartModel.findOne(match);
        
        const itemPayload: Record<string, any> = {
            ...req['createObj'],
            product_id: toObjectId(params.product_id),
            product_code: params.product_code,
            product_name: params.product_name,
            category_name: params.category_name,
            total_quantity: params.total_quantity,
            mrp: params.mrp,
            unit_price: params.unit_price,
            gross_amount: params.gross_amount,
            gst_amount: params.gst_amount,
            gst_percent: params.gst_percent,
            net_amount_with_tax: params.net_amount_with_tax,
            uom: params.uom,
            discount_amount: params.discount_amount,
            discount_percent: params.discount_percent
        };
        
        if (cart) {
            const existingItem = await this.secondaryOrderCartItemModel.findOne({
                cart_id: cart._id,
                product_id: toObjectId(params.product_id)
            });
            
            if (existingItem) {
                existingItem.total_quantity += params.total_quantity;
                existingItem.gross_amount += params.gross_amount;
                existingItem.gst_amount += params.gst_amount;
                existingItem.discount_amount += params.discount_amount;
                existingItem.net_amount_with_tax += params.net_amount_with_tax;
                await existingItem.save();
            } else {
                itemPayload.cart_id = cart._id;
                const itemDoc = new this.secondaryOrderCartItemModel(itemPayload);
                await itemDoc.save();
                cart.total_item_count += 1;
            }
            
            cart.total_item_quantity += params.total_quantity;
            cart.net_amount_before_tax += params.unit_price;
            cart.gross_amount += params.gross_amount;
            cart.gst_amount += params.gst_amount;
            cart.discount_amount += params.discount_amount;
            cart.net_amount_with_tax += params.net_amount_with_tax;
            await cart.save();
            
            return this.res.success('SUCCESS.CREATE');
        }
        
        const cartPayload: Record<string, any> = {
            ...req['createObj'],
            org_id: orgId,
            customer_id: toObjectId(params.customer_id),
            customer_name: params.customer_name,
            delivery_from: toObjectId(params.delivery_from),
            gst_type: params.gst_type,
            total_item_quantity: params.total_quantity,
            total_item_count: 1,
            gross_amount: params.gross_amount,
            gst_amount: params.gst_amount,
            discount_amount: params.discount_amount,
            net_amount_before_tax: params.unit_price,
            net_amount_with_tax: params.net_amount_with_tax
        };
        
        const newCart = new this.secondaryOrderCartModel(cartPayload);
        const savedCart = await newCart.save();
        if (!savedCart._id) return this.res.error(HttpStatus.BAD_REQUEST, 'ERROR.BAD_REQ');
        
        itemPayload.cart_id = savedCart._id;
        const itemDoc = new this.secondaryOrderCartItemModel(itemPayload);
        const insert = await itemDoc.save();
        if (!insert._id) return this.res.error(HttpStatus.BAD_REQUEST, 'ERROR.BAD_REQ');
        
        return this.res.success('SUCCESS.CREATE');
    }
    
    async readCart(req: Request, params: any): Promise<any> {
        const orgId: number = req['user']['org_id'];
        const createdBy = toObjectId(req['user']['_id'])
        
        const match: Record<string, any> = {
            org_id: orgId,
            created_id: createdBy,
            is_delete: 0
        };
        
        const page: number = Math.max(1, parseInt(params?.page, 10) || global.PAGE);
        const limit: number = Math.max(1, parseInt(params?.limit, 10) || global.LIMIT);
        const skip: number = (page - 1) * limit;
        
        let total = 0;
        let result: any = {
            summary: {},
            items: []
        };
        
        const cart = await this.secondaryOrderCartModel.findOne(match).lean();
        if (cart) {
            const cartId = toObjectId(cart._id.toString());
            total = await this.secondaryOrderCartItemModel.countDocuments({
                cart_id: cartId,
                is_delete: 0
            });
            
            let cartItems = await this.secondaryOrderCartItemModel.find({
                cart_id: cartId,
                is_delete: 0
            }).skip(skip).limit(limit).lean();
            
            cartItems = await Promise.all(
                cartItems.map(async (item: any) => {
                    item.files = await this.productService.getDocument(item.product_id, global.THUMBNAIL_IMAGE);
                    return item;
                })
            );
            
            result = {
                summary: {
                    total_item_quantity: cart.total_item_quantity,
                    total_item_count: cart.total_item_count,
                    gross_amount: cart.gross_amount,
                    gst_amount: cart.gst_amount,
                    discount_amount: cart.discount_amount,
                    net_amount_before_tax: cart.net_amount_before_tax,
                    net_amount_with_tax: cart.net_amount_with_tax
                },
                items: cartItems,
                customer_id: cart.customer_id,
                customer_name: cart.customer_name,
                delivery_from: cart.delivery_from,
                gst_type: cart.gst_type
            };
        }
        return this.res.pagination(result, total, page, limit);
    }
    
    async deleteCartItem(req: Request, params: any): Promise<any> {
        const orgId: number = req['user']['org_id'];
        
        const item = await this.secondaryOrderCartItemModel.findOne({ _id: params._id });
        if (!item) return this.res.error(HttpStatus.NOT_FOUND, 'ERROR.NOT_FOUND');
        
        const cartId = toObjectId(item.cart_id);
        const cart = await this.secondaryOrderCartModel.findOne({
            _id: cartId,
            org_id: orgId,
            is_delete: 0
        });
        if (!cart) return this.res.error(HttpStatus.NOT_FOUND, 'ERROR.NOT_FOUND');
        
        await this.secondaryOrderCartItemModel.deleteOne({ _id: params._id });
        
        const remainingItems = await this.secondaryOrderCartItemModel.find({ cart_id: cartId, is_delete: 0 });
        
        if (remainingItems.length === 0) {
            await this.secondaryOrderCartModel.deleteOne({ _id: cartId });
            return this.res.success('SUCCESS.DELETE');
        }
        
        let total_item_quantity = 0;
        let total_item_count = 0;
        let gross_amount = 0;
        let discount_amount = 0;
        let gst_amount = 0;
        let net_amount_before_tax = 0;
        let net_amount_with_tax = 0;
        
        for (const i of remainingItems) {
            total_item_quantity += i.total_quantity;
            total_item_count += 1;
            gross_amount += i.gross_amount;
            discount_amount += i.discount_amount;
            gst_amount += i.gst_amount;
            net_amount_before_tax += i.unit_price;
            net_amount_with_tax += i.net_amount_with_tax;
        }
        
        cart.total_item_quantity = total_item_quantity;
        cart.total_item_count = total_item_count;
        cart.gross_amount = gross_amount;
        cart.discount_amount = discount_amount;
        cart.gst_amount = gst_amount;
        cart.net_amount_before_tax = net_amount_before_tax;
        cart.net_amount_with_tax = net_amount_with_tax;
        
        await cart.save();
        return this.res.success('SUCCESS.DELETE');
    }
    
    async deleteCart(req: Request, params: any): Promise<any> {
        const orgId: number = req['user']['org_id'];
        const createdById = toObjectId(req['user']['_id'])
        
        const result: Record<string, any> = await this.secondaryOrderCartModel.findOne({
            created_id: createdById,
            org_id: orgId,
            is_delete: 0
        });
        if (!result) return this.res.error(HttpStatus.NOT_FOUND, 'CART.NOT_FOUND');
        
        await this.secondaryOrderCartItemModel.deleteMany({ cart_id: result._id });
        await this.secondaryOrderCartModel.deleteOne({ _id: result._id });
        return this.res.success('CART.DELETE');
    }
    /*Secondary Order Cart END */
    
    /* Secondary Order START */
    async secondaryOrderAdd(req: Request, params: any): Promise<any> {
        const orgId: number = req['user']['org_id'];
        const customerId = toObjectId(params.customer_id);
        const createdById = toObjectId(req['user']['_id'])
        
        const cart: Record<string, any> = await this.secondaryOrderCartModel.findOne({
            org_id: orgId,
            customer_id: customerId,
            created_id: createdById,
            is_delete: 0
        });
        if (!cart) return this.res.error(HttpStatus.NOT_FOUND, 'CART.NOT_FOUND');
        
        const cartItems = await this.secondaryOrderCartItemModel.find({
            cart_id: cart._id
        });
        if (!cartItems.length) {
            return this.res.error(HttpStatus.BAD_REQUEST, 'CART.ITEM_NOT_FOUND');
        }
        
        const lastOrder = await this.secondaryOrderModel
        .findOne({ org_id: orgId })
        .sort({ created_at: -1 })
        .select({ order_no: 1 })
        .lean();
        
        let nextOrderNumber = 1;
        if (lastOrder?.order_no) {
            const match = lastOrder.order_no.match(/SORD-(\d+)/);
            if (match) {
                nextOrderNumber = parseInt(match[1], 10) + 1;
            }
        }
        const order_no: string = `SORD-${nextOrderNumber}`;
        const orderPayload: Record<string, any> = {
            ...req['createObj'],
            org_id: orgId,
            customer_id: customerId,
            delivery_from: toObjectId(cart.delivery_from),
            order_no,
            total_item_count: cart.total_item_count,
            total_item_quantity: cart.total_item_quantity,
            gross_amount: cart.gross_amount,
            gst_amount: cart.gst_amount,
            discount_amount: cart.discount_amount,
            net_amount_before_tax: cart.net_amount_before_tax,
            net_amount_with_tax: cart.net_amount_with_tax,
            status: global.ORDER_STATUS[1],
            order_create_remark: params.order_create_remark,
            gst_type: cart.gst_type
        };
        
        if (params?.visit_activity_id) orderPayload.visit_activity_id = toObjectId(params.visit_activity_id)
            
        const order = new this.secondaryOrderModel(orderPayload);
        const savedOrder = await order.save();
        
        if (!savedOrder || !savedOrder._id) {
            return this.res.error(HttpStatus.BAD_REQUEST, 'ERROR.BAD_REQ');
        }
        
        const orderItems: Record<string, any> = cartItems.map(item => ({
            ...req['createObj'],
            order_id: savedOrder._id,
            product_id: item.product_id,
            product_code: item.product_code,
            product_name: item.product_name,
            category_name: item.category_name,
            total_quantity: item.total_quantity,
            mrp: item.mrp,
            unit_price: item.unit_price,
            gross_amount: item.gross_amount,
            gst_amount: item.gst_amount,
            gst_percent: item.gst_percent,
            net_amount_with_tax: item.net_amount_with_tax,
            uom: item.uom,
            discount_amount: item.discount_amount,
            discount_percent: item.discount_percent
        }));
        
        await this.secondaryOrderItemModel.insertMany(orderItems);
        
        await this.secondaryOrderCartItemModel.deleteMany({ cart_id: cart._id });
        await this.secondaryOrderCartModel.deleteOne({ _id: cart._id });
        
        return this.res.success('ORDER.CREATE', { order_id: savedOrder._id });
    }
    
    async secondaryOrderList(req: Request, params: any): Promise<any> {
        try {
            const orgId: number = req['user']['org_id'];
            const filters = params?.filters || {};
            const commonMatch = commonFilters(filters);
            
            const activeStatus = params.activeTab;
            if (![global.ORDER_STATUS[1], global.ORDER_STATUS[2], global.ORDER_STATUS[3], global.ORDER_STATUS[4]].includes(activeStatus)) {
                return this.res.error(HttpStatus.BAD_REQUEST, 'ERROR.BAD_REQ');
            }
            
            let match: Record<string, any> = {
                is_delete: 0,
                org_id: orgId,
                status: activeStatus,
                ...commonMatch
            };
            
            let countMatch: Record<string, any> = {
                is_delete: 0,
                org_id: orgId
            };
            
            if (params?.customer_id) {
                match.customer_id = params.customer_id
            }
            
            Object.assign(match, commonSearchFilter(params.filters, ['order_no']));
            if (req['user']['login_type_id'] === global.LOGIN_TYPE_ID['PRIMARY'] || req['user']['login_type_id'] === global.LOGIN_TYPE_ID['SUB_PRIMARY']) {
                match.customer_id = req['user']['_id']
                countMatch.customer_id = req['user']['_id']
            }
            
            if (global.LOGIN_TYPE_ID_PERMISSION?.includes(req['user']['login_type_id'])) {
                const userIds = await this.sharedUserService.getUsersIds(req, params);
                match.$or = [
                    { created_id: { $in: userIds } }
                ];
                countMatch.$or = [
                    { created_id: { $in: userIds } }
                ];
            }
            
            const page: number = Math.max(1, parseInt(params?.page, 10) || global.PAGE);
            const limit: number = Math.max(1, parseInt(params?.limit, 10) || global.LIMIT);
            const skip: number = (page - 1) * limit;
            
            const result = await this.secondaryOrderModel.aggregate([
                { $match: match },
                { $sort: { _id: -1 } },
                { $skip: skip },
                { $limit: limit },
                {
                    $lookup: {
                        from: 'crm_customers',
                        localField: 'customer_id',
                        foreignField: '_id',
                        as: 'customer'
                    }
                },
                { $unwind: { path: '$customer', preserveNullAndEmptyArrays: true } },
                {
                    $lookup: {
                        from: 'crm_customers',
                        localField: 'delivery_from',
                        foreignField: '_id',
                        as: 'distributor'
                    }
                },
                { $unwind: { path: '$distributor', preserveNullAndEmptyArrays: true } },
                {
                    $project: {
                        order_no: 1,
                        created_id: 1,
                        created_name: 1,
                        customer_id: 1,
                        total_item_count: 1,
                        total_item_quantity: 1,
                        gross_amount: 1,
                        net_amount_before_tax: 1,
                        net_amount_with_tax: 1,
                        discount_amount: 1,
                        gst_amount: 1,
                        status: 1,
                        created_at: 1,
                        updated_at: 1,
                        order_create_remark: 1,
                        customer_type_name: '$customer.customer_type_name',
                        customer_name: '$customer.customer_name',
                        mobile: '$customer.mobile',
                        state: '$customer.state',
                        district: '$customer.district',
                        distributor_name: '$distributor.customer_name',
                        distributor_code: '$distributor.customer_code',
                        distributor_mobile: '$distributor.mobile'
                    }
                }
            ]);
            const [pendingCount, approvedCount, rejectCount, holdCount] = await Promise.all([
                this.secondaryOrderModel.countDocuments({ ...countMatch, status: global.ORDER_STATUS[1], is_delete: 0, org_id: orgId }),
                this.secondaryOrderModel.countDocuments({ ...countMatch, status: global.ORDER_STATUS[2], is_delete: 0, org_id: orgId }),
                this.secondaryOrderModel.countDocuments({ ...countMatch, status: global.ORDER_STATUS[3], is_delete: 0, org_id: orgId }),
                this.secondaryOrderModel.countDocuments({ ...countMatch, status: global.ORDER_STATUS[4], is_delete: 0, org_id: orgId })
            ]);
            
            const total: number = activeStatus === global.ORDER_STATUS[1] ? pendingCount
            : activeStatus === global.ORDER_STATUS[2] ? approvedCount
            : activeStatus === global.ORDER_STATUS[3] ? rejectCount
            : activeStatus === global.ORDER_STATUS[4] ? holdCount : 0;
            
            const data: any = {
                result,
                activeTab: {
                    pending_count: pendingCount,
                    approved_count: approvedCount,
                    reject_count: rejectCount,
                    hold_count: holdCount
                }
            };
            return this.res.pagination(data, total, page, limit);
        } catch (error) {
            return this.res.error(HttpStatus.BAD_REQUEST, 'ERROR.BAD_REQ', error);
        }
    }
    
    async secondaryOrderDetail(req: Request, params: any): Promise<any> {
        try {
            const orderId = toObjectId(params._id);
            const pipeline = [
                { $match: { _id: orderId, is_delete: 0 } },
                ...this.sharedCustomerService.customerLookup(req, { localField: 'customer_id' }),
                ...this.sharedCustomerService.contactPersonLookup(req, { localField: 'customer_id' }),
                {
                    $project: {
                        order_no: 1,
                        created_id: 1,
                        created_name: 1,
                        customer_id: 1,
                        delivery_from: 1,
                        total_item_quantity: 1,
                        total_item_count: 1,
                        gross_amount: 1,
                        net_amount_before_tax: 1,
                        net_amount_with_tax: 1,
                        discount_amount: 1,
                        gst_amount: 1,
                        status: 1,
                        created_at: 1,
                        updated_at: 1,
                        order_create_remark: 1,
                        order_tracking_status: 1,
                        gst_type: 1,
                        customer_info: 1,
                        contact_person_info: 1
                    }
                }
            ];
            
            const data: Record<string, any>[] = await this.secondaryOrderModel.aggregate(pipeline);
            if (!data.length) {
                return this.res.error(HttpStatus.NOT_FOUND, 'ERROR.NOT_FOUND');
            }
            
            const result = data[0];
            
            const deliveryFromId = toObjectId(result['delivery_from']);
            const distributor_details = await this.sharedCustomerService.getCustomersByIds(req, { customer_ids: [deliveryFromId] });
            result.distributor_detail = distributor_details?.[0] || {};
            
            const itemMatch: Record<string, any> = { is_delete: 0, order_id: orderId };
            const item_info = await this.secondaryOrderItemModel.find(itemMatch).lean();
            result.item = item_info;
            return this.res.success('SUCCESS.FETCH', result);
        } catch (error) {
            return this.res.error(HttpStatus.BAD_REQUEST, 'ERROR.BAD_REQ', error);
        }
    }
    
    async secondaryOrderStatusChange(req: Request, params: any): Promise<any> {
        try {
            const { _id, status, reason } = params;
            const exist: Record<string, any> = await this.secondaryOrderModel.findOne({ _id, is_delete: 0 }).exec();
            if (!exist) return this.res.error(HttpStatus.BAD_REQUEST, 'ERROR.NOT_FOUND');
            
            const updateObj: Record<string, any> = {
                status,
                ...(reason !== undefined && { reason })
            };
            
            await this.secondaryOrderModel.findOneAndUpdate(
                { _id: params._id, is_delete: 0 },
                updateObj,
                { new: true }
            ).exec();
            return this.res.success('SUCCESS.STATUS_UPDATE');
        } catch (error) {
            return this.res.error(HttpStatus.BAD_REQUEST, 'ERROR.BAD_REQ', error);
        }
    }
    
    async deleteSecondaryOrderItem(req: Request, params: any): Promise<any> {
        const orgId: number = req['user']['org_id'];
        
        const item = await this.secondaryOrderItemModel.findOne({ _id: params._id });
        if (!item) return this.res.error(HttpStatus.NOT_FOUND, 'ORDER.ITEM_NOT_FOUND');
        
        const orderId = toObjectId(item.order_id);
        const result: Record<string, any> = await this.secondaryOrderModel.findOne({
            _id: orderId,
            org_id: orgId,
            is_delete: 0
        });
        if (!result) return this.res.error(HttpStatus.NOT_FOUND, 'ORDER.NOT_FOUND');
        
        await this.secondaryOrderItemModel.updateOne(
            { _id: params._id },
            { $set: { is_delete: params.is_delete } }
        );
        
        const remainingItems = await this.secondaryOrderItemModel.find({ order_id: orderId, is_delete: 0 });
        
        let total_item_quantity = 0;
        let total_item_count = 0;
        let gross_amount = 0;
        let discount_amount = 0;
        let gst_amount = 0;
        let net_amount_before_tax = 0;
        let net_amount_with_tax = 0;
        
        for (const i of remainingItems) {
            total_item_quantity += i.total_quantity;
            total_item_count += 1;
            gross_amount += i.gross_amount;
            discount_amount += i.discount_amount;
            gst_amount += i.gst_amount;
            net_amount_before_tax += i.unit_price;
            net_amount_with_tax += i.net_amount_with_tax;
        }
        
        result.total_item_quantity = total_item_quantity;
        result.total_item_count = total_item_count;
        result.gross_amount = gross_amount;
        result.discount_amount = discount_amount;
        result.gst_amount = gst_amount;
        result.net_amount_before_tax = net_amount_before_tax;
        result.net_amount_with_tax = net_amount_with_tax;
        
        await result.save();
        return this.res.success('SUCCESS.DELETED');
    }
    
    async SecondaryOrderByCustomerId(req: Request, params: any): Promise<any> {
        try {
            const orgId: number = req['user']['org_id'];
            
            let match: Record<string, any> = {
                is_delete: 0,
                org_id: orgId
            };
            
            params.customer_ids = [params.customer_id];
            const customer = await this.sharedCustomerService.getCustomersByIds(req, params);
            delete params.customer_ids;
            
            if (customer && customer.login_type_id === global.LOGIN_TYPE_ID['PRIMARY']) {
                match.delivery_from = params.customer_id;
            } else {
                match.customer_id = params.customer_id;
            }
            
            Object.assign(match, commonSearchFilter(params.filters, ['order_no', 'created_name', 'status']));
            
            const page: number = Math.max(1, parseInt(params?.page, 10) || global.PAGE);
            const limit: number = Math.max(1, parseInt(params?.limit, 10) || global.LIMIT);
            const skip: number = (page - 1) * limit;
            
            const [result, totalCountArr] = await Promise.all([
                this.secondaryOrderModel.aggregate([
                    { $match: match },
                    { $sort: { _id: -1 } },
                    { $skip: skip },
                    { $limit: limit },
                    {
                        $project: {
                            order_no: 1,
                            created_id: 1,
                            created_name: 1,
                            customer_id: 1,
                            total_item_count: 1,
                            total_item_quantity: 1,
                            gross_amount: 1,
                            net_amount_before_tax: 1,
                            net_amount_with_tax: 1,
                            discount_amount: 1,
                            gst_amount: 1,
                            status: 1,
                            created_at: 1,
                            updated_at: 1,
                            order_create_remark: 1,
                        }
                    }
                ]),
                this.secondaryOrderModel.aggregate([
                    { $match: match },
                    { $count: 'total' }
                ])
            ]);
            
            const total = totalCountArr[0]?.total || 0;
            return this.res.pagination(result, total, page, limit);
        } catch (error) {
            return this.res.error(HttpStatus.BAD_REQUEST, 'ERROR.BAD_REQ', error);
        }
    }
    /* Secondary Order END */
}

