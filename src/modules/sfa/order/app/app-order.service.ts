import { Injectable, HttpStatus, Post, Req, Body } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { ResponseService } from 'src/services/response.service';
import { PrimaryOrderModel } from '../models/primary-order.model';
import { commonFilters } from 'src/common/utils/common.utils';
import { OrderSchemeModel } from '../models/order-scheme.model';
import { OrderSchemeDocsModel } from '../models/order-scheme-docs.model';
import { S3Service } from 'src/shared/rpc/s3.service';
import { ProductService } from 'src/modules/master/product/web/product.service';
@Injectable()
export class AppOrderService {
    constructor(
        @InjectModel(PrimaryOrderModel.name) private orderModel: Model<PrimaryOrderModel>,
        @InjectModel(OrderSchemeModel.name) private OrderSchemeModel: Model<OrderSchemeModel>,
        @InjectModel(OrderSchemeDocsModel.name) private OrderSchemeDocsModel: Model<OrderSchemeDocsModel>,
        private readonly res: ResponseService,
        private readonly s3Service: S3Service,
        private readonly productService: ProductService,
    ) { }

    async readScheme(req: Request, params: any): Promise<any> {
        try {
            const match: Record<string, any> = { is_delete: 0, org_id: req['user']['org_id'] };
            const sorting: Record<string, 1 | -1> = { _id: -1 };

            const page: number = Math.max(1, parseInt(params?.page, 10) || global.PAGE);
            const limit: number = Math.max(1, parseInt(params?.limit, 10) || global.LIMIT);
            const skip: number = (page - 1) * limit;

            const total: number = await this.OrderSchemeModel.countDocuments(match);
            const result: Record<string, any>[] = await this.OrderSchemeModel
                .find(match)
                .sort(sorting)
                .skip(skip)
                .limit(limit)
                .lean();

            const res = await Promise.all(
                result.map(async (item: any) => {
                    item.files = await this.getDocument(item._id, global.BIG_THUMBNAIL_IMAGE);
                    item.total_product_enroll = Array.isArray(item.product_data) ? item.product_data.length : 0;
                    return item;
                })
            );

            const data: any = {
                result: res
            };
            return this.res.pagination(data, total, page, limit);
        } catch (error) {
            return this.res.error(HttpStatus.BAD_REQUEST, 'ERROR.BAD_REQ', error);
        }
    }

    async getDocument(
        id: any,
        type: typeof global.FULL_IMAGE | typeof global.THUMBNAIL_IMAGE | typeof global.BIG_THUMBNAIL_IMAGE = global.FULL_IMAGE
    ): Promise<any> {
        return this.s3Service.getDocumentsByRowId(this.OrderSchemeDocsModel, id, type);
    }

    async getDocumentByDocsId(req: any, params: any): Promise<any> {
        const doc = await this.s3Service.getDocumentsById(this.OrderSchemeDocsModel, params._id);
        return this.res.success('SUCCESS.FETCH', doc);
    }

    async schemeDetail(req: Request, params: any): Promise<any> {
        try {
            const match = { _id: params._id };
            const result: Record<string, any> = await this.OrderSchemeModel.findOne(match).lean();
            if (!result) return this.res.error(HttpStatus.NOT_FOUND, 'ERROR.SCHEME_NOT_FOUND');
            result.files = await this.getDocument(result._id, global.THUMBNAIL_IMAGE);

            if (Array.isArray(result.product_data)) {
                result.total_product_enroll = result.product_data.length;
                const updatedProducts = await Promise.all(
                    result.product_data.map(async (product: any) => {
                        const files = await this.productService.getDocument(product.product_id, global.THUMBNAIL_IMAGE);
                        return {
                            ...product,
                            files
                        };
                    })
                );
                result.product_data = updatedProducts;
            } else {
                result.total_product_enroll = 0;
            }
            return this.res.success('SUCCESS.FETCH', result);
        } catch (error) {
            return this.res.error(HttpStatus.BAD_REQUEST, 'ERROR.BAD_REQ', error);
        }
    }

}
