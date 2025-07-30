import { Injectable, HttpStatus } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { ResponseService } from 'src/services/response.service';
import { commonFilters, commonSearchFilter, readTemplateFile, toObjectId } from 'src/common/utils/common.utils';
import { DropdownService } from 'src/modules/master/dropdown/web/dropdown.service';
import { OrderSchemeModel } from '../models/order-scheme.model';
import { SchemStatus } from './dto/order.dto';
import { PrimaryOrderModel } from '../models/primary-order.model';
import { PrimaryOrderItemModel } from '../models/primary-order-item.model';
import { OrderSchemeDocsModel } from '../models/order-scheme-docs.model';
import { S3Service } from 'src/shared/rpc/s3.service';
import { PrimaryOrderCartModel } from '../models/primary-order-cart.model';
import { PrimaryOrderCartItemModel } from '../models/primary-order-cart-item.model';
import { SharedCustomerService } from 'src/modules/master/customer/shared-customer.service';
import { SharedUserService } from 'src/modules/master/user/shared-user.service';
import { SharedProductService } from 'src/modules/master/product/shared-product-service';
import { PdfService } from 'src/shared/rpc/pdf.service';
import { ProductService } from 'src/modules/master/product/web/product.service';
@Injectable()
export class OrderService {
    constructor(
        @InjectModel(OrderSchemeModel.name) private orderSchemeModel: Model<OrderSchemeModel>,
        @InjectModel(OrderSchemeDocsModel.name) private orderSchemeDocsModel: Model<OrderSchemeDocsModel>,
        @InjectModel(PrimaryOrderModel.name) private primaryOrderModel: Model<PrimaryOrderModel>,
        @InjectModel(PrimaryOrderItemModel.name) private primaryOrderItemModel: Model<PrimaryOrderItemModel>,
        @InjectModel(PrimaryOrderCartModel.name) private primaryOrderCartModel: Model<PrimaryOrderCartModel>,
        @InjectModel(PrimaryOrderCartItemModel.name) private primaryOrderCartItemModel: Model<PrimaryOrderCartItemModel>,
        private readonly res: ResponseService,
        private readonly dropdownService: DropdownService,
        private readonly sharedCustomerService: SharedCustomerService,
        private readonly sharedUserService: SharedUserService,
        private readonly s3Service: S3Service,
        private readonly pdfService: PdfService,
        private readonly productService: ProductService,
        private readonly sharedProductService: SharedProductService,
    ) { }
    async fetchOrderDropdowns(req: Request, params: any): Promise<any> {
        try {
            const match: Record<string, any> = {
                is_delete: 0,
                module_id: global.SUB_MODULES['Products'],
                org_id: req['user']['org_id'],
                internalCall: true,
            };
            console.log(req['user'])
            const dropdownArray: Record<string, any>[] = await this.dropdownService.readProductRelatedDropdown(req, { ...params, ...match });
            return this.res.success('SUCCESS.FETCH', dropdownArray);
        } catch (error) {
            return this.res.error(HttpStatus.BAD_REQUEST, 'ERROR.BAD_REQ', error);
        }
    }

    async createScheme(req: Request, params: any): Promise<any> {
        try {
            const orgId: number = req['user']['org_id'];
            const productData: Record<string, any>[] = params.product_data || [];

            if (productData.length) {
                const productIds = productData.map(p => toObjectId(p.product_id));
                const existing: Record<string, any> = await this.orderSchemeModel.find({
                    org_id: orgId,
                    status: SchemStatus.Active,
                    is_delete: 0,
                    'product_data.product_id': { $in: productIds }
                }).lean();
                if (existing.length) return this.res.error(HttpStatus.BAD_REQUEST, 'ORDER_SCHEME.SCHME_EXIST');
            }

            const updatedProductData: Record<string, any>[] = productData.map(p => ({
                ...p,
                product_id: toObjectId(p.product_id),
            }));

            const schemeId: string = await this.generateNewSchemeId(orgId);
            params.scheme_id = schemeId
            let saveObj: Record<string, any> = {
                ...req['createObj'],
                ...params,
                product_data: updatedProductData
            };

            const document = new this.orderSchemeModel(saveObj);
            const scheme: Record<string, any> = await document.save();
            if (!scheme['_id']) return this.res.error(HttpStatus.BAD_REQUEST, 'WARNING.INSERT_FAILED');
            return this.res.success('SUCCESS.CREATE', { inserted_id: scheme['_id'] });
        } catch (error) {
            return this.res.error(HttpStatus.BAD_REQUEST, 'ERROR.BAD_REQ', error);
        }
    }

    async generateNewSchemeId(orgId: number): Promise<string> {
        const lastScheme = await this.orderSchemeModel
            .findOne({ org_id: orgId }, { scheme_id: 1 })
            .sort({ created_at: -1 })
            .lean()
            .exec();
        let lastNumber = 0;
        if (lastScheme?.scheme_id) {
            const match = lastScheme.scheme_id.match(/#SCHM-(\d+)/);
            if (match) lastNumber = parseInt(match[1], 10);
        }
        const nextNumber = (lastNumber + 1).toString().padStart(2, '0');
        return `#SCHM-${nextNumber}`;
    }

    async readScheme(req: Request, params: any): Promise<any> {
        try {
            let match: Record<string, any> = { is_delete: 0, org_id: req['user']['org_id'] };
            let sorting: Record<string, 1 | -1> = { _id: -1 };
            const filters = params?.filters || {};
            Object.assign(match, commonFilters(params?.filters));

            if (params.activeTab === SchemStatus.Active) {
                match = { ...match, status: SchemStatus.Active };
            } else if (params.activeTab === SchemStatus.Inactive) {
                match = { ...match, status: SchemStatus.Inactive };
            }
            else {
                return this.res.error(HttpStatus.BAD_REQUEST, 'ERROR.BAD_REQ');
            }

            const page: number = Math.max(1, parseInt(params?.page, 10) || global.PAGE);
            const limit: number = Math.max(1, parseInt(params?.limit, 10) || global.LIMIT);
            const skip: number = (page - 1) * limit;

            const result: Record<string, any>[] = await this.orderSchemeModel
                .find(match)
                .sort(sorting)
                .skip(skip)
                .limit(limit)
                .lean();

            const activeCount: number = await this.orderSchemeModel.countDocuments({ ...params.match, status: SchemStatus.Active });
            const inactiveCOunt: number = await this.orderSchemeModel.countDocuments({ ...params.match, status: SchemStatus.Inactive });

            const data: any = {
                result,
                activeTab: { active_count: activeCount, inactive_count: inactiveCOunt },
            };

            let total = 0
            if (params.activeTab === SchemStatus.Active) {
                total = activeCount
            } else if (params.activeTab === SchemStatus.Inactive) {
                total = inactiveCOunt;
            }
            return this.res.pagination(data, total, page, limit);
        } catch (error) {
            return this.res.error(HttpStatus.BAD_REQUEST, 'ERROR.BAD_REQ', error.message);
        }
    }

    async deleteScheme(req: any, params: any): Promise<any> {
        try {
            let match: Record<string, any> = {
                _id: params._id,
                is_delete: 0
            };
            const exist = await this.orderSchemeModel.findOne(match).exec();
            if (!exist) return this.res.error(HttpStatus.NOT_FOUND, 'ORDER_SCHEME.NOT_EXIST');

            const updateObj: Record<string, any> = {
                ...req['updateObj'],
                is_delete: 1,
            };
            await this.orderSchemeModel.updateOne({ _id: params._id }, updateObj);
            return this.res.success('SUCCESS.DELETE');
        } catch (error) {
            return this.res.error(HttpStatus.BAD_REQUEST, 'ERROR.BAD_REQ', error);
        }
    }

    async schemeDetail(req: Request, params: any): Promise<any> {
        try {
            const match: Record<string, any> = { _id: params.scheme_id };
            const result: Record<string, any> = await this.orderSchemeModel.findOne(match).lean();
            if (!result) return this.res.error(HttpStatus.NOT_FOUND, 'ORDER_SCHEME.NOT_EXIST');

            result.files = await this.getDocument(result._id, global.THUMBNAIL_IMAGE);
            return this.res.success('SUCCESS.FETCH', result);
        } catch (error) {
            return this.res.error(HttpStatus.BAD_REQUEST, 'ERROR.BAD_REQ', error);
        }
    }

    async updateSchemeStatus(req: any, params: any): Promise<any> {
        try {
            let match: Record<string, any> = { _id: params._id, is_delete: 0 };
            const exist = await this.orderSchemeModel.findOne(match).exec();
            if (!exist) return this.res.error(HttpStatus.NOT_FOUND, 'ORDER_SCHEME.NOT_EXIST');

            const updateObj: Record<string, any> = {
                ...req['updateObj'],
                ...params
            };
            await this.orderSchemeModel.updateOne({ _id: params._id }, updateObj);
            return this.res.success('SUCCESS.STATUS_UPDATE');
        } catch (error) {
            return this.res.error(HttpStatus.BAD_REQUEST, 'ERROR.BAD_REQ', error);
        }
    }

    async upload(files: Express.Multer.File[], req: any): Promise<any> {
        try {
            req.body.module_name = Object.keys(global.SUB_MODULES).find(
                key => global.SUB_MODULES[key] === global.SUB_MODULES['Scheme']
            );
            let response = await this.s3Service.uploadMultiple(files, req, this.orderSchemeDocsModel);
            return this.res.success('SUCCESS.CREATE', response);
        } catch (error) {
            return this.res.error(HttpStatus.BAD_REQUEST, 'Error uploading files to S3', error?.message || error
            );
        }
    }

    async getDocument(
        id: any,
        type: typeof global.FULL_IMAGE | typeof global.THUMBNAIL_IMAGE | typeof global.BIG_THUMBNAIL_IMAGE = global.FULL_IMAGE
    ): Promise<any> {
        return this.s3Service.getDocumentsByRowId(this.orderSchemeDocsModel, id, type);
    }

    async getDocumentByDocsId(req: any, params: any): Promise<any> {
        const doc = await this.s3Service.getDocumentsById(this.orderSchemeDocsModel, params._id);
        return this.res.success('SUCCESS.FETCH', doc);
    }

    async deleteFile(req: Request, params: any): Promise<any> {
        try {
            params._id = toObjectId(params._id)
            const exist: Record<string, any> = await this.orderSchemeDocsModel.findOne({ _id: params._id, is_delete: 0 }).exec();
            if (!exist) return this.res.error(HttpStatus.NOT_FOUND, 'ERROR.NOT_FOUND');

            const updateObj: Record<string, any> = {
                ...req['updateObj'],
                is_delete: 1,
            };
            await this.orderSchemeDocsModel.updateOne(
                { _id: params._id },
                updateObj
            );
            return this.res.success('SUCCESS.FILE_DELETE');
        } catch (error) {
            return this.res.error(HttpStatus.BAD_REQUEST, 'ERROR.BAD_REQ', error);
        }
    }

    async itemAddedInCart(req: Request, params: any): Promise<any> {
        try {
            const orgId: number = req['user']['org_id'];
            const createdById = toObjectId(req['user']['_id']);

            const customers: Record<string, any>[] = await this.sharedCustomerService.getCustomersByIds(req, params);
            if (customers.length > 0 && customers[0]?.customer_name) {
                params.customer_name = customers[0].customer_name;
            }

            const match: Record<string, any> = {
                org_id: orgId,
                customer_id: toObjectId(params.customer_id),
                created_id: createdById,
                is_delete: 0,
                brand: params.brand,
                color: params.color,
            };

            let cart: Record<string, any> = await this.primaryOrderCartModel.findOne(match);

            const itemPayload: Record<string, any> = {
                ...req['createObj'],
                cart_id: null,
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
                discount_percent: params.discount_percent,
                org_id: orgId,
                color: params.color,
                brand: params.brand
            };

            if (params?.scheme_id) {
                itemPayload.scheme_id = toObjectId(params.scheme_id);
            }

            if (params._id) {
                cart = await this.primaryOrderCartModel.findOne({
                    _id: toObjectId(params._id),
                    is_delete: 0
                });

                if (!cart) return this.res.error(HttpStatus.BAD_REQUEST, 'ERROR.CART_NOT_FOUND');

                cart.total_item_quantity = params.total_quantity;
                cart.total_item_count = params.total_item_count || cart.total_item_count;
                cart.gross_amount = params.gross_amount;
                cart.gst_amount = params.gst_amount;
                cart.discount_amount = params.discount_amount;
                cart.net_amount_before_tax = params.unit_price;
                cart.net_amount_with_tax = params.net_amount_with_tax;
                cart.color = params.color;
                cart.brand = params.brand;

                await cart.save();
                const existingItem = await this.primaryOrderCartItemModel.findOne({
                    cart_id: cart._id,
                    product_id: toObjectId(params.product_id),
                    is_delete: 0,
                });

                if (existingItem) {
                    existingItem.total_quantity = params.total_quantity;
                    existingItem.gross_amount = params.gross_amount;
                    existingItem.gst_amount = params.gst_amount;
                    existingItem.net_amount_with_tax = params.net_amount_with_tax;
                    existingItem.discount_amount = params.discount_amount;
                    existingItem.color = params.color;
                    existingItem.brand = params.brand;
                    await existingItem.save();
                }
                return this.res.success('SUCCESS.CART_UPDATED');
            }

            if (cart && !params._id) {
                const existingItem = await this.primaryOrderCartItemModel.findOne({
                    cart_id: cart._id,
                    product_id: toObjectId(params.product_id),
                    is_delete: 0
                });

                if (existingItem) {
                    existingItem.total_quantity += params.total_quantity;
                    existingItem.gross_amount += params.gross_amount;
                    existingItem.gst_amount += params.gst_amount;
                    existingItem.net_amount_with_tax += params.net_amount_with_tax;
                    existingItem.discount_amount += params.discount_amount;
                    existingItem.color = params.color;
                    existingItem.brand = params.brand;
                    await existingItem.save();
                } else {
                    itemPayload.cart_id = cart._id;
                    const itemDoc = new this.primaryOrderCartItemModel(itemPayload);
                    await itemDoc.save();
                    cart.total_item_count += 1;
                }

                cart.total_item_quantity += params.total_quantity;
                cart.net_amount_before_tax += params.unit_price;
                cart.gross_amount += params.gross_amount;
                cart.gst_amount += params.gst_amount;
                cart.discount_amount += params.discount_amount;
                cart.net_amount_with_tax += params.net_amount_with_tax;
                cart.color = params.color;
                cart.brand = params.brand;
                let val = await cart.save();
                // itemPayload.cart_id = toObjectId(val._id);
                // const itemDoc = new this.primaryOrderCartItemModel(itemPayload);
                // await itemDoc.save();
                return this.res.success('SUCCESS.CREATE');
            }

            const cartPayload: Record<string, any> = {
                ...req['createObj'],
                org_id: orgId,
                customer_id: toObjectId(params.customer_id),
                customer_name: params.customer_name,
                shipping_address: params.shipping_address,
                total_item_quantity: params.total_quantity,
                total_item_count: 1,
                gross_amount: params.gross_amount,
                gst_amount: params.gst_amount,
                discount_amount: params.discount_amount,
                net_amount_before_tax: params.unit_price,
                net_amount_with_tax: params.net_amount_with_tax,
                brand: params.brand,
                color: params.color,
            };

            const newCart = new this.primaryOrderCartModel(cartPayload);
            const savedCart = await newCart.save();
            if (!savedCart._id) return this.res.error(HttpStatus.BAD_REQUEST, 'ERROR.BAD_REQ');

            itemPayload.cart_id = savedCart._id;
            const itemDoc = new this.primaryOrderCartItemModel(itemPayload);
            const insert = await itemDoc.save();
            if (!insert._id) return this.res.error(HttpStatus.BAD_REQUEST, 'ERROR.BAD_REQ');
            return this.res.success('SUCCESS.CREATE');
        } catch (error) {
            return this.res.error(HttpStatus.BAD_REQUEST, 'ERROR.BAD_REQ', error);
        }
    }

    async readCartItemList(req: Request, params: any): Promise<any> {
        const orgId: number = req['user']['org_id'];
        const createdById = toObjectId(req['user']['_id']);

        const match: Record<string, any> = {
            customer_id: toObjectId(params.customer_id),
            org_id: orgId,
            created_id: createdById,
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

        const carts = await this.primaryOrderCartModel.find(match).lean();

        if (carts && carts.length > 0) {
            const cartIds = carts.map(cart => toObjectId(String(cart._id)));

            total = await this.primaryOrderCartItemModel.countDocuments({
                cart_id: { $in: cartIds },
                is_delete: 0
            });

            let cartItems = await this.primaryOrderCartItemModel.find({
                cart_id: { $in: cartIds },
                is_delete: 0
            }).skip(skip).limit(limit).lean();

            const productIds = cartItems.map(item => item.product_id);
            const discountKeys: Record<string, string> = {};

            const productDetails = await this.productService.read(req, { _id: productIds });

            (productDetails.data || []).forEach((prod: any) => {
                if (prod._id && prod.category_name) {
                    discountKeys[prod._id.toString()] = prod.category_name;
                }
            });

            const discountMap = await this.sharedProductService.orderDiscountConfig(
                req,
                discountKeys,
                params.customer_id
            );

            cartItems = await Promise.all(
                cartItems.map(async (item: any) => {
                    try {
                        const productParams = {
                            ...params,
                            _id: item.product_id
                        };

                        const [productData, customerData, files] = await Promise.all([
                            this.productService.detail(req, productParams).catch(err => null),
                            this.sharedCustomerService.getCustomersByIds(req, params),
                            this.productService.getDocument(item.product_id, global.THUMBNAIL_IMAGE).catch(() => [])
                        ]);

                        item.files = files || [];
                        item.customer_form_data = customerData[0]?.form_data || null;
                        item.product_detail = productData?.data || null;

                        if (customerData[0]?.state && item.product_detail?.product_price?.form_data?.length) {
                            const matchedZoneForm = item.product_detail.product_price.form_data.find((form: any) =>
                                form.zone?.trim().toLowerCase() === customerData[0].state?.trim().toLowerCase()
                            );

                            if (matchedZoneForm) {
                                item.product_detail.product_price.form_data = matchedZoneForm;
                            } else {
                                item.product_detail.product_price.form_data = {};
                            }
                        }

                        const pid = String(item.product_id);
                        item.discount_form =
                            discountMap[pid]?.customer_form_data &&
                                Object.keys(discountMap[pid]?.customer_form_data).length > 0
                                ? discountMap[pid].customer_form_data
                                : { basic_discount: 0 };

                        return item;
                    } catch (err) {
                        console.warn("Error processing cart item:", item.product_id, err);
                        return item;
                    }
                })
            );

            const summary = {
                total_item_quantity: 0,
                total_item_count: 0,
                gross_amount: 0,
                gst_amount: 0,
                discount_amount: 0,
                net_amount_before_tax: 0,
                net_amount_with_tax: 0
            };

            for (const cart of carts) {
                summary.total_item_quantity += cart.total_item_quantity || 0;
                summary.total_item_count += cart.total_item_count || 0;
                summary.gross_amount += cart.gross_amount || 0;
                summary.gst_amount += cart.gst_amount || 0;
                summary.discount_amount += cart.discount_amount || 0;
                summary.net_amount_before_tax += cart.net_amount_before_tax || 0;
                summary.net_amount_with_tax += cart.net_amount_with_tax || 0;
            }

            result = {
                summary,
                items: cartItems,
                customer_id: params.customer_id,
                customer_name: carts[0]?.customer_name || '',
                shipping_address: carts[0]?.shipping_address || ''
            };
        }

        return this.res.pagination(result, total, page, limit);
    }


    async getProductDetail(req: Request, params: any): Promise<any> {
        try {
            const customerData = await this.sharedCustomerService.getCustomersByIds(req, params);

            const data = await this.productService.detail(req, params)
            let result = {
                data: data.data,
                customer_form_data: customerData[0]?.form_data
            }
            return this.res.success('SUCCESS.FETCH', result);
        } catch (error) {
            return this.res.error(HttpStatus.BAD_REQUEST, 'ERROR.BAD_REQ', error);
        }
    }

    async deleteCartItem(req: Request, params: any): Promise<any> {
        const orgId: number = req['user']['org_id'];

        const item = await this.primaryOrderCartItemModel.findOne({ _id: params._id });
        if (!item) return this.res.error(HttpStatus.NOT_FOUND, 'ERROR.NOT_FOUND');

        const cartId = toObjectId(item.cart_id);
        const cart = await this.primaryOrderCartModel.findOne({
            _id: cartId,
            org_id: orgId,
            is_delete: 0
        });
        if (!cart) return this.res.error(HttpStatus.NOT_FOUND, 'ERROR.CART_NOT_FOUND');

        await this.primaryOrderCartItemModel.deleteOne({ cart_id: cart._id });
        await this.primaryOrderCartItemModel.deleteOne({ _id: params._id });
        const remainingItems = await this.primaryOrderCartItemModel.find({ cart_id: cartId, is_delete: 0 });

        if (remainingItems.length === 0) {
            await this.primaryOrderCartModel.deleteOne({ _id: cartId });
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
        return this.res.success('SUCCESS.DELETED');
    }

    async deleteCart(req: Request, params: any): Promise<any> {
        const orgId: number = req['user']['org_id'];
        const createdById = toObjectId(req['user']['_id'])

        const result: Record<string, any> = await this.primaryOrderCartModel.findOne({
            created_id: createdById,
            org_id: orgId,
            is_delete: 0
        });
        if (!result) return this.res.error(HttpStatus.NOT_FOUND, 'CART.NOT_FOUND');

        await this.primaryOrderCartItemModel.deleteMany({ cart_id: result._id });
        await this.primaryOrderCartModel.deleteOne({ _id: result._id });
        return this.res.success('CART.DELETE');
    }

    async primaryOrderAdd(req: Request, params: any): Promise<any> {
        try {
            const orgId: number = req['user']['org_id'];
            const createdById = toObjectId(req['user']['_id'])
            const customerId = toObjectId(params.customer_id);
            const userName = req['user']['name'];

            const cart: Record<string, any> = await this.primaryOrderCartModel.findOne({
                org_id: orgId,
                customer_id: customerId,
                created_id: createdById,
                is_delete: 0
            });
            if (!cart) return this.res.error(HttpStatus.NOT_FOUND, 'CART.NOT_FOUND');

            const cartItems = await this.primaryOrderCartItemModel.find({
                cart_id: cart._id
            });
            if (!cartItems.length) {
                return this.res.error(HttpStatus.BAD_REQUEST, 'CART.ITEM_NOT_FOUND');
            }

            const lastOrder = await this.primaryOrderModel
                .findOne({ org_id: orgId })
                .sort({ created_at: -1 })
                .select({ order_no: 1 })
                .lean();

            let nextOrderNumber = 1;
            if (lastOrder?.order_no) {
                const match = lastOrder.order_no.match(/PORD-(\d+)/);
                if (match) {
                    nextOrderNumber = parseInt(match[1], 10) + 1;
                }
            }
            const order_no: string = `PORD-${nextOrderNumber}`;
            const orderPayload: Record<string, any> = {
                ...req['createObj'],
                org_id: orgId,
                customer_id: customerId,
                order_no,
                shipping_address: cart.shipping_address,
                total_item_count: cart.total_item_count,
                total_item_quantity: cart.total_item_quantity,
                gross_amount: cart.gross_amount,
                gst_amount: cart.gst_amount,
                discount_amount: cart.discount_amount,
                net_amount_before_tax: cart.net_amount_before_tax,
                net_amount_with_tax: cart.net_amount_with_tax,
                status: global.ORDER_STATUS[1],
                order_create_remark: params.order_create_remark,
                order_tracking_status: [
                    {
                        label: "Order Placed",
                        message: `Order Placed Successfully By ${userName}`,
                        status_update_date: new Date()
                    }
                ],
                order_type: params.order_type
            };
            if (params?.visit_activity_id) orderPayload.visit_activity_id = toObjectId(params.visit_activity_id)
            const order = new this.primaryOrderModel(orderPayload);
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
                discount_percent: item.discount_percent,
                order_type: params.order_type
            }));

            await this.primaryOrderItemModel.insertMany(orderItems);

            await this.primaryOrderCartItemModel.deleteMany({ cart_id: cart._id });
            await this.primaryOrderCartModel.deleteOne({ _id: cart._id });

            return this.res.success('ORDER.CREATE', { order_id: savedOrder._id });
        } catch (error) {
            console.log(error)
            return this.res.error(HttpStatus.BAD_REQUEST, 'ERROR.BAD_REQ', error);
        }
    }

    async primaryOrderList(req: Request, params: any): Promise<any> {
        try {
            const orgId: number = req['user']['org_id'];
            const activeStatus = params.activeTab;

            if (![global.ORDER_STATUS[1],
            global.ORDER_STATUS[2],
            global.ORDER_STATUS[3],
            global.ORDER_STATUS[4],
            global.ORDER_STATUS[5],
            global.ORDER_STATUS[6],
            global.ORDER_STATUS[7],
            global.ORDER_STATUS[8],
            global.ORDER_STATUS[9]].includes(activeStatus)) {
                return this.res.error(HttpStatus.BAD_REQUEST, 'ERROR.BAD_REQ');
            }

            let match: Record<string, any> = {
                is_delete: 0,
                org_id: orgId,
                status: activeStatus
            };
            Object.assign(match, commonFilters(params?.filters));

            if (params?.customer_id) match.customer_id = toObjectId(params.customer_id);

            const customerSearchFilter = commonSearchFilter(params.filters, ['customer_name']);

            let countMatch: Record<string, any> = {
                is_delete: 0,
                org_id: orgId
            };

            if (req['user']['login_type_id'] === global.LOGIN_TYPE_ID['PRIMARY'] ||
                req['user']['login_type_id'] === global.LOGIN_TYPE_ID['SUB_PRIMARY']) {
                match.customer_id = req['user']['_id'];
                countMatch.customer_id = req['user']['_id'];
            }

            if (global.LOGIN_TYPE_ID_PERMISSION?.includes(req['user']['login_type_id'])) {
                const userIds = await this.sharedUserService.getUsersIds(req, params);
                match.$or = [{ created_id: { $in: userIds } }];
                countMatch.$or = [{ created_id: { $in: userIds } }];
            }

            const page: number = Math.max(1, parseInt(params?.page, 10) || global.PAGE);
            const limit: number = Math.max(1, parseInt(params?.limit, 10) || global.LIMIT);
            const skip: number = (page - 1) * limit;

            const pipeline: any[] = [
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
                { $unwind: { path: '$customer', preserveNullAndEmptyArrays: true } }
            ];

            if (customerSearchFilter['customer_name']) {
                pipeline.push({ $match: { 'customer.customer_name': customerSearchFilter['customer_name'] } });
            }

            pipeline.push({
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
                    customer_code: '$customer.customer_code',
                    state: '$customer.state',
                    district: '$customer.district',
                    order_type: 1
                }
            });

            const result = await this.primaryOrderModel.aggregate(pipeline);

            const [
                pendingCount,
                approvedCount,
                rejectCount,
                holdCount,
                partiallyPlannedCount,
                plannedCount,
                partiallyDispatchedCount,
                dispatchedCount,
                plannedDispatchedCount,
            ] = await Promise.all([
                this.primaryOrderModel.countDocuments({ ...countMatch, status: global.ORDER_STATUS[1] }),
                this.primaryOrderModel.countDocuments({ ...countMatch, status: global.ORDER_STATUS[2] }),
                this.primaryOrderModel.countDocuments({ ...countMatch, status: global.ORDER_STATUS[3] }),
                this.primaryOrderModel.countDocuments({ ...countMatch, status: global.ORDER_STATUS[4] }),
                this.primaryOrderModel.countDocuments({ ...countMatch, status: global.ORDER_STATUS[5] }),
                this.primaryOrderModel.countDocuments({ ...countMatch, status: global.ORDER_STATUS[6] }),
                this.primaryOrderModel.countDocuments({ ...countMatch, status: global.ORDER_STATUS[7] }),
                this.primaryOrderModel.countDocuments({ ...countMatch, status: global.ORDER_STATUS[8] }),
                this.primaryOrderModel.countDocuments({ ...countMatch, status: global.ORDER_STATUS[9] })
            ]);

            const total: number =
                activeStatus === global.ORDER_STATUS[1] ? pendingCount :
                    activeStatus === global.ORDER_STATUS[2] ? approvedCount :
                        activeStatus === global.ORDER_STATUS[3] ? rejectCount :
                            activeStatus === global.ORDER_STATUS[4] ? holdCount :
                                activeStatus === global.ORDER_STATUS[5] ? partiallyPlannedCount :
                                    activeStatus === global.ORDER_STATUS[6] ? partiallyPlannedCount :
                                        activeStatus === global.ORDER_STATUS[7] ? partiallyDispatchedCount :
                                            activeStatus === global.ORDER_STATUS[8] ? partiallyDispatchedCount :
                                                activeStatus === global.ORDER_STATUS[9] ? dispatchedCount :
                                                    0;

            const data: any = {
                result,
                activeTab: {
                    pending_count: pendingCount,
                    approved_count: approvedCount,
                    reject_count: rejectCount,
                    hold_count: holdCount,
                    partially_planned_count: partiallyPlannedCount,
                    complete_planned_count: plannedCount,
                    partially_dispatched_count: partiallyDispatchedCount,
                    dispatched_count: dispatchedCount,
                    planned_dispatched_count: plannedDispatchedCount,
                }
            };

            return this.res.pagination(data, total, page, limit);
        } catch (error) {
            return this.res.error(HttpStatus.BAD_REQUEST, 'ERROR.BAD_REQ', error);
        }
    }

    async primaryOrderDetail(req: Request, params: any): Promise<any> {
        try {
            const orderId = toObjectId(params._id);
            const pipeline = [
                { $match: { _id: orderId, is_delete: 0 } },
                ...this.sharedCustomerService.customerLookup(req, { localField: 'customer_id' }),
                ...this.sharedCustomerService.contactPersonLookup(req, { localField: 'customer_id' }),
                {
                    $project: {
                        order_no: 1,
                        billing_company: 1,
                        created_id: 1,
                        created_name: 1,
                        customer_id: 1,
                        company_name: 1,
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
                        shipping_address: 1,
                        customer_info: 1,
                        contact_person_info: 1,
                        order_type: 1,
                        reason: 1
                    }
                }
            ];

            const data: Record<string, any> = await this.primaryOrderModel.aggregate(pipeline);
            if (!data.length) {
                return this.res.error(HttpStatus.NOT_FOUND, 'ERROR.NOT_FOUND');
            }

            const result = data[0];
            const itemMatch: Record<string, any> = { is_delete: 0, order_id: orderId };
            const item_info = await this.primaryOrderItemModel.find(itemMatch).lean();
            result.item = item_info;

            return this.res.success('SUCCESS.FETCH', result);
        } catch (error) {
            return this.res.error(HttpStatus.BAD_REQUEST, 'ERROR.BAD_REQ', error);
        }
    }

    async deletePrimaryOrderItem(req: Request, params: any): Promise<any> {
        const orgId: number = req['user']['org_id'];

        const item = await this.primaryOrderItemModel.findOne({ _id: params._id });
        if (!item) return this.res.error(HttpStatus.NOT_FOUND, 'ORDER.ITEM_NOT_FOUND');

        const orderId = toObjectId(item.order_id);
        const result: Record<string, any> = await this.primaryOrderModel.findOne({
            _id: orderId,
            org_id: orgId,
            is_delete: 0
        });
        if (!result) return this.res.error(HttpStatus.NOT_FOUND, 'ORDER.NOT_FOUND');

        await this.primaryOrderItemModel.updateOne(
            { _id: params._id },
            { $set: { is_delete: params.is_delete } }
        );

        const remainingItems = await this.primaryOrderItemModel.find({ order_id: orderId, is_delete: 0 });

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

    async primaryOrderStatusChange(req: Request, params: any): Promise<any> {
        try {
            const { _id, status, reason, billing_company } = params;
            const exist: Record<string, any> = await this.primaryOrderModel.findOne({ _id, is_delete: 0 }).exec();
            if (!exist) return this.res.error(HttpStatus.BAD_REQUEST, 'WARNING.DATA_NOT_FOUND');

            const userName = req['user']['name'];
            const now = new Date();

            const statusMessages: Record<string, string> = {
                [global.ORDER_STATUS[2]]: `Order Approved Successfully By ${userName}`,
                [global.ORDER_STATUS[3]]: `Order is Rejected By ${userName}`,
                [global.ORDER_STATUS[4]]: `Order is on Hold By ${userName}`,
                [global.ORDER_STATUS[5]]: `Order is Partial Planned By ${userName}`,
                [global.ORDER_STATUS[6]]: `Order is Complete Planned By ${userName}`,
                [global.ORDER_STATUS[7]]: `Order is Partial Dispatched By ${userName}`,
                [global.ORDER_STATUS[8]]: `Order is Dispatched By ${userName}`,
                [global.ORDER_STATUS[9]]: `Order is Partially Planned & Dispatched By ${userName}`,
            };

            if (!Object.prototype.hasOwnProperty.call(statusMessages, status)) {
                return this.res.error(HttpStatus.BAD_REQUEST, 'ERROR.INVALID_STATUS');
            }

            const label = status;
            const message = statusMessages[status];

            const updateSet: Record<string, any> = { status };

            if (status === global.ORDER_STATUS[2] && billing_company) {
                updateSet.billing_company = billing_company;
            }

            if (reason !== undefined) {
                updateSet.reason = reason;
            }

            const updateObj = {
                $set: updateSet,
                $push: {
                    order_tracking_status: {
                        label,
                        message,
                        status_update_date: now,
                    },
                },
            };

            await this.primaryOrderModel.findOneAndUpdate(
                { _id, is_delete: 0 },
                updateObj,
                { new: true }
            ).exec();

            return this.res.success('SUCCESS.STATUS_UPDATE');
        } catch (error) {
            return this.res.error(HttpStatus.BAD_REQUEST, 'ERROR.BAD_REQ', error);
        }
    }


    async exportPrimaryOrderPdf(req: Request, params: any): Promise<any> {
        try {
            const match: Record<string, any> = {
                org_id: req['user']['org_id'],
                is_delete: 0,
                _id: toObjectId(params._id)
            };
            const data: Record<string, any> = await this.primaryOrderModel.findOne(match).exec();
            if (!data) return this.res.error(HttpStatus.NOT_FOUND, 'ERROR.NOT_FOUND');

            const items: Record<string, any>[] = await this.primaryOrderItemModel.find({ order_id: data._id }).exec();
            params.customer_ids = toObjectId(data.customer_id);
            const customerData = await this.sharedCustomerService.getCustomersByIds(req, params);

            const formatCurrency = (num: number) => `${Number(num).toFixed(2)}`;

            const primaryOrderData: Record<string, any> = {
                company_name: req['user']['org_name'],
                company_address: "123 Business Road, City, Country",
                company_email: "info@yourcompany.com",
                company_phone: "+123456789",
                customer_name: customerData['customer_name'],
                customer_company: customerData['customer_name'],
                customer_email: "Test@gmail.com",
                order_date: new Date(data['created_at']).toISOString().split('T')[0],
                order_no: data['order_no'],
                items: items.map((item: any) => ({
                    product_name: item.product_name,
                    product_code: item.product_code,
                    category_name: item.category_name,
                    uom: item.uom,
                    total_quantity: item.total_quantity,
                    unit_price: formatCurrency(item.unit_price),
                    gross_amount: formatCurrency(item.gross_amount),
                    gst_percent: formatCurrency(item.gst_percent),
                    gst_amount: formatCurrency(item.gst_amount),
                    discount_percent: item.discount_percent,
                    discount_amount: formatCurrency(item.discount_amount),
                    net_amount: formatCurrency(item.net_amount),
                    total_price: formatCurrency(item.net_amount),
                    color: item?.color,
                    brand: item?.brand,
                })),

                total_qty: data.total_qty,
                total_item: data.total_item,
                net_amount_before_tax: formatCurrency(data.net_amount_before_tax),
                discount_amount: formatCurrency(data.discount_amount),
                gross_amount: formatCurrency(data.gross_amount),
                gst_amount: formatCurrency(data.gst_amount),
                net_amount_with_tax: formatCurrency(data.net_amount_with_tax),
            };

            const html = readTemplateFile('primary-order', primaryOrderData);

            const pdfObj: Record<string, any> = {
                html,
                module_id: 16,
                module_name: "Order",
                filename: `${data.order_no}.pdf`
            };
            const response = await this.pdfService.htmlPdf(req, pdfObj);

            return this.res.success('SUCCESS.FETCH', response);
        } catch (error) {
            return this.res.error(HttpStatus.BAD_REQUEST, 'ERROR.BAD_REQ', error);
        }
    }
}



