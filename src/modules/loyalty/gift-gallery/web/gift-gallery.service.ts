import { Injectable, HttpStatus } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { GiftGalleryModel } from '../models/gift-gallery.model';
import mongoose, { Model, Types } from 'mongoose';
import { ResponseService } from 'src/services/response.service';
import { toObjectId, commonFilters } from 'src/common/utils/common.utils';
import { Like } from 'src/common/utils/common.utils';
import { GiftType, VoucherType } from './dto/gift-gallery.dto';
import { S3Service } from 'src/shared/rpc/s3.service';
import { CustomerTypeModel } from 'src/modules/master/customer-type/models/customer-type.model';
import { GiftGalleryDocsModel } from '../models/gift-gallery-docs.model';
import { GiftGalleryVoucherModel } from '../models/gift-gallery-vouchers.model';
import { VoucherModel } from '../models/voucher-types.model';
import { CryptoService } from 'src/services/crypto.service';


@Injectable()
export class GiftGalleryService {
    constructor(
        @InjectModel(GiftGalleryDocsModel.name) private giftGalleryDocsModel: Model<GiftGalleryDocsModel>,
        @InjectModel(GiftGalleryModel.name) private giftGalleryModel: Model<GiftGalleryModel>,
        @InjectModel(CustomerTypeModel.name) private customerTypeModel: Model<CustomerTypeModel>,
        @InjectModel(GiftGalleryVoucherModel.name) private giftGalleryVoucherModel: Model<GiftGalleryVoucherModel>,
        @InjectModel(VoucherModel.name) private voucherModel: Model<VoucherModel>,
        private readonly res: ResponseService,
        private readonly cryptoService: CryptoService,
        private readonly s3Service: S3Service,
    ) { }

    async create(req: any, params: any): Promise<any> {
        try {
            const exist: Record<string, any> = await this.giftGalleryModel.findOne({ title: params.title, customer_type_name : params.customer_type_name ,is_delete: 0, org_id: req['user']['org_id'] }).exec();

            if (exist) return this.res.error(HttpStatus.NOT_FOUND, 'WARNING.ALREADY_EXIST')
            params.gift_id = toObjectId(params.gift_id)

            if (params.voucher_type_id && params.voucher_type_id.trim() !== '') params.voucher_type_id = toObjectId(params.voucher_type_id)

            const saveObj: Record<string, any> = {
                ...req['createObj'],
                ...params,
            };

            const document = new this.giftGalleryModel(saveObj);
            const insert = await document.save();
            return this.res.success('SUCCESS.CREATE', { inserted_id: insert._id });
        } catch (error) {
            return this.res.error(HttpStatus.BAD_REQUEST, 'ERROR.BAD_REQ', error);
        }
    }

    async read(req: Request, params: any): Promise<any> {
        try {
            const filters = params?.filters || {};
            let match: any = { is_delete: 0, org_id: req['user']['org_id'] , ...filters };
            let sorting: Record<string, 1 | -1> = { _id: -1 };
            const count_match = { ...match, ...commonFilters(filters) };

            if (params.activeTab === GiftType.Gift) {
                match = { ...match, gift_type: GiftType.Gift };
            } else if (params.activeTab === GiftType.Cash) {
                match = { ...match, gift_type: GiftType.Cash };
            }
            else if (params.activeTab === GiftType.Voucher) {
                match = { ...match, gift_type: GiftType.Voucher };
            } else {
                return this.res.error(HttpStatus.BAD_REQUEST, 'ERROR.BAD_REQ');
            }

            const page: number = Math.max(1, parseInt(params?.page, 10) || global.PAGE);
            const limit: number = Math.max(1, parseInt(params?.limit, 10) || global.LIMIT);
            const skip: number = (page - 1) * limit;

            const result: Record<string, any>[] = await this.giftGalleryModel
                .find(match)
                .sort(sorting)
                .skip(skip)
                .limit(limit)
                .lean();

            const giftCount = await this.giftGalleryModel.countDocuments({ ...count_match, gift_type: GiftType.Gift });
            const cashCount = await this.giftGalleryModel.countDocuments({ ...count_match, gift_type: GiftType.Cash });
            const voucherCount = await this.giftGalleryModel.countDocuments({ ...count_match, gift_type: GiftType.Voucher });

            const data: any = {
                result,
                activeTab: { gift_count: giftCount, cash_count: cashCount, voucher_count: voucherCount },
            };

            data.result = await Promise.all(
                result.map(async (item: any) => {
                    item.files = await this.getDocument(item._id, global.THUMBNAIL_IMAGE)
                    return item;
                })
            );

            let total = 0
            if (params.activeTab === GiftType.Gift) {
                total = giftCount
            } else if (params.activeTab === GiftType.Cash) {
                total = cashCount;
            }
            else if (params.activeTab === GiftType.Voucher) {
                total = voucherCount;
            }

            return this.res.pagination(data, total, page, limit);
        } catch (error) {
            return this.res.error(HttpStatus.BAD_REQUEST, 'ERROR.BAD_REQ', error);
        }
    }

    async detail(req: Request, params: any): Promise<any> {
        try {
            let match: any = { _id: params._id };

            let result = await this.giftGalleryModel
                .findOne(match)
                .lean();


            result['files'] = await this.getDocument(toObjectId(params._id))
            return this.res.success('SUCCESS.FETCH', result);
        } catch (error) {
            return this.res.error(HttpStatus.BAD_REQUEST, 'ERROR.BAD_REQ', error);
        }
    }

    async updateStatus(req: Request, params: any): Promise<any> {
        try {
            const exist: Record<string, any> = await this.giftGalleryModel.findOne({ _id: params._id }).exec();

            if (!exist) return this.res.error(HttpStatus.NOT_FOUND, 'WARNING.NOT_EXIST')

            const updateObj = {
                ...req['updateObj'],
                ...params,
            };

            await this.giftGalleryModel.updateOne({ _id: params._id }, updateObj);
            if (params?.status) return this.res.success('SUCCESS.UPDATE')
        } catch (error) {
            return this.res.error(HttpStatus.BAD_REQUEST, 'ERROR.BAD_REQ', error);
        }
    }

    async delete(req: any, params: any): Promise<any> {
        try {
            let match: any = { _id: params._id, is_delete: 0 };
            const exist = await this.giftGalleryModel.findOne(match).exec();
            if (!exist) return this.res.error(HttpStatus.NOT_FOUND, 'WARNING.NOT_EXIST');
            const updateObj = {
                ...req['updateObj'],
                is_delete: 1,
            };
            await this.giftGalleryModel.updateOne({ _id: params._id }, updateObj);
            return this.res.success('SUCCESS.DELETE');
        } catch (error) {
            return this.res.error(HttpStatus.BAD_REQUEST, 'ERROR.BAD_REQ', error);
        }

    }

    async upload(files: Express.Multer.File[], req: any): Promise<any> {
        try {
            req.body.module_name = Object.keys(global.MODULES).find(
                key => global.MODULES[key] === global.MODULES['Gift Gallery']
            );
            let response = await this.s3Service.uploadMultiple(files, req, this.giftGalleryDocsModel);
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
        return this.s3Service.getDocumentsByRowId(this.giftGalleryDocsModel, id, type);
    }

    async getDocumentByDocsId(req: any, params: any): Promise<any> {
        const doc = await this.s3Service.getDocumentsById(this.giftGalleryDocsModel, params._id);
        return this.res.success('SUCCESS.FETCH', doc);
    }

    async readVoucher(req: Request, params: any): Promise<any> {
        try {
            let match: any = { is_delete: 0, org_id: req['user']['org_id'], gift_id: toObjectId(params.gift_id) };
            let sorting: Record<string, 1 | -1> = { _id: -1 };
            const filters = params?.filters || {};
            params.match = commonFilters(filters);


            match.customer_id = { $exists: true };

            const page: number = Math.max(1, parseInt(params?.page, 10) || global.PAGE);
            const limit: number = Math.max(1, parseInt(params?.limit, 10) || global.LIMIT);
            const skip: number = (page - 1) * limit;

            const result: Record<string, any>[] = await this.giftGalleryVoucherModel
                .find(match)
                .sort(sorting)
                .skip(skip)
                .limit(limit)
                .lean();

            const availableCount = await this.giftGalleryVoucherModel.countDocuments({ ...params.match, customer_id: { $exists: false } });
            const usedCount = await this.giftGalleryVoucherModel.countDocuments({ ...params.match, customer_id: { $exists: true } });


            const data: any = {
                result,
                activeTab: { available_count: availableCount, used_count: usedCount },
            };

            let total = 0
            if (params.activeTab === VoucherType.Available) {
                total = availableCount
            } else if (params.activeTab === VoucherType.Used) {
                total = usedCount;
            }
            return this.res.pagination(data, total, page, limit);
        } catch (error) {
            throw error;
        }
    }

    async readVoucherTypes(req: Request, params: any): Promise<any> {
        try {
            let match: any = { is_delete: 0, org_id: req['user']['org_id'] };
            let sorting: Record<string, 1 | -1> = { _id: -1 };
            const filters = params?.filters || {};
            params.match = commonFilters(filters);

            let result: any
            result = await this.voucherModel
                .find(match)
                .select('_id voucher_title')
                .sort(sorting)
                .lean();

            if (!result || result.length === 0) {
                result = await this.voucherModel
                    .find({ is_delete: 0, org_id: 0 })
                    .select('_id voucher_title')
                    .sort(sorting)
                    .lean();
            }

            const mappedResult = result.map(item => ({
                value: item._id,
                label: item.voucher_title,
            }));
            return this.res.success('SUCCESS.FETCH', mappedResult);
        } catch (error) {
            throw error;
        }
    }
}
