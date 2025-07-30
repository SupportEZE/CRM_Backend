import { Injectable, HttpStatus } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { ResponseService } from 'src/services/response.service';
import { PurchaseModel, PurchaseStatus } from '../models/purchase.model';
import { PurchaseItemModel } from '../models/purchase-item.model';
import { commonFilters, commonSearchFilter, toObjectId } from 'src/common/utils/common.utils';
import { SharedProductService } from 'src/modules/master/product/shared-product-service';
import { AppLedgerService } from '../../ledger/app/app-ledger.service';
import { PurchaseDocsModel } from '../models/purchase-doc.model';
import { S3Service } from 'src/shared/rpc/s3.service';

@Injectable()
export class PurchaseService {
    constructor(
        @InjectModel(PurchaseModel.name) private purchaseModel: Model<PurchaseModel>,
        @InjectModel(PurchaseItemModel.name) private purchaseItemModel: Model<PurchaseItemModel>,
        @InjectModel(PurchaseDocsModel.name) private PurchaseDocsModel: Model<PurchaseDocsModel>,
        private readonly res: ResponseService,
        private readonly sharedProductService: SharedProductService,
        private readonly appLedgerService: AppLedgerService,
        private readonly s3Service: S3Service
    ) { }

    async create(req: Request, params: any): Promise<any> {
        const orgId: number = req['user']['org_id'];

        const existingPurchase = await this.purchaseModel.findOne({
            org_id: orgId,
            bill_number: params.bill_number,
            is_delete: 0
        });

        if (existingPurchase) {
            return this.res.error(HttpStatus.BAD_REQUEST, 'PURCHASE.BILL_EXIST');
        }

        const selectedItems = Array.isArray(params.selectedItems) ? params.selectedItems : [];
        const total_item = selectedItems.length;
        const total_qty = selectedItems.reduce((sum, item) => sum + (Number(item.qty) || 0), 0);

        const purchasePayload: Record<string, any> = {
            ...req['createObj'],
            org_id: orgId,
            bill_number: params.bill_number,
            bill_date: params.bill_date,
            bill_amount: params.bill_amount,
            customer_id: toObjectId(params.customer_id),
            customer_name: params.customer_name,
            customer_type_id: toObjectId(params.customer_type_id),
            customer_type_name: params.customer_type_name,
            purchase_from: params.purchase_from || '',
            purchase_from_name: params.purchase_from_name || '',
            login_type_id: params.login_type_id,
            remark: params.remark || '',
            total_item,
            total_qty
        };
        const newPurchase = new this.purchaseModel(purchasePayload);
        const savedPurchase = await newPurchase.save();
        if (!savedPurchase._id) return this.res.error(HttpStatus.BAD_REQUEST, 'ERROR.INSERT_FAILED');

        if (Array.isArray(params.selectedItems) && params.selectedItems.length > 0) {
            const itemsToInsert = params.selectedItems.map((item) => ({
                ...req['createObj'],
                org_id: orgId,
                purchase_id: savedPurchase._id,
                value: toObjectId(item.value),
                product_code: item.product_code,
                label: item.label,
                qty: item.qty,
                point_value: item.point_value,
            }));
            await this.purchaseItemModel.insertMany(itemsToInsert);
        }
        return this.res.success('SUCCESS.CREATE', { inserted_id: savedPurchase._id });
    }

    async read(req: Request, params: any): Promise<any> {
        try {
            const orgId = req['user']['org_id']
            let match: any = { is_delete: 0, org_id: orgId };
            let sorting: Record<string, 1 | -1> = { _id: -1 };

            if (params.activeTab === PurchaseStatus.Pending) {
                match = { ...match, status: PurchaseStatus.Pending };
            } else if (params.activeTab === PurchaseStatus.Approved) {
                match = { ...match, status: PurchaseStatus.Approved };
            }
            else if (params.activeTab === PurchaseStatus.Reject) {
                match = { ...match, status: PurchaseStatus.Reject };
            } else {
                return this.res.error(HttpStatus.BAD_REQUEST, 'ERROR.BAD_REQ');
            }
            if (params?._id) match.customer_id = toObjectId(params._id);

            if (req?.url.includes(global.MODULE_ROUTES[29])) {
                match.customer_id = req['user']['_id']
            }

            Object.assign(match, commonFilters(params?.filters))

            const page: number = Math.max(1, parseInt(params?.page, 10) || global.PAGE);
            const limit: number = Math.max(1, parseInt(params?.limit, 10) || global.LIMIT);
            const skip: number = (page - 1) * limit;

            const result: Record<string, any>[] = await this.purchaseModel
                .find(match)
                .sort(sorting)
                .skip(skip)
                .limit(limit)
                .lean();

            let countBase: any = { is_delete: 0, org_id: orgId };
            if (params?._id) countBase.customer_id = toObjectId(params._id);

            if (req?.url.includes(global.MODULE_ROUTES[29])) {
                countBase.customer_id = req['user']['_id']
            }
            Object.assign(countBase, commonFilters(params?.filters))

            const [pendingCount, approvedCount, rejectCount] = await Promise.all([
                this.purchaseModel.countDocuments({ ...countBase, status: PurchaseStatus.Pending }),
                this.purchaseModel.countDocuments({ ...countBase, status: PurchaseStatus.Approved }),
                this.purchaseModel.countDocuments({ ...countBase, status: PurchaseStatus.Reject })
            ]);

            const tabCounts = {
                pending_count: pendingCount,
                approved_count: approvedCount,
                reject_count: rejectCount,
            };

            const data: any = {
                result,
                tabCounts,
            };

            const total = {
                [PurchaseStatus.Pending]: pendingCount,
                [PurchaseStatus.Approved]: approvedCount,
                [PurchaseStatus.Reject]: rejectCount,
            }[params.activeTab] || 0;
            return this.res.pagination(data, total, page, limit);
        } catch (error) {
            return this.res.error(HttpStatus.BAD_REQUEST, 'ERROR.BAD_REQ', error);
        }
    }

    async detail(req: Request, params: any): Promise<any> {
        try {
            const result: Record<string, any> = await this.purchaseModel.findOne({ _id: toObjectId(params._id) }).lean().exec()
            if (!result) return this.res.error(HttpStatus.NOT_FOUND, 'WARNINGE.DATA_NOT_FOUND');

            let match: Record<string, any> = { is_delete: 0, org_id: req['user']['org_id'], purchase_id: toObjectId(params._id) };
            const Itemdata: Record<string, any> = await this.purchaseItemModel.find(match).sort({ _id: -1 }).lean();
            result.selectedItem = Itemdata;
            result.files = await this.getDocument(result._id, global.THUMBNAIL_IMAGE)
            return this.res.success('SUCCESS.FETCH', result);
        } catch (error) {
            return this.res.error(HttpStatus.BAD_REQUEST, 'ERROR.BAD_REQ', error);
        }
    }

    async statusUpdate(req: Request, params: any): Promise<any> {
        try {
            const orgId: number = req['user']['org_id'];
            const { status, reason, approved_point } = params;
            const exist: Record<string, any> = await this.purchaseModel.findOne({ _id: params._id, is_delete: 0 }).lean();
            if (!exist) return this.res.success('WARNING.NOT_EXIST');

            const updateObj: Record<string, any> = {
                ...req['updateObj'],
                status,
                reason: status === PurchaseStatus.Reject ? (params.reason || '') : undefined,
                approved_point: status === PurchaseStatus.Approved ? Number(params.approved_point) : undefined,
            };
            await this.purchaseModel.updateOne({ _id: params._id }, updateObj);

            if (status === PurchaseStatus.Approved) {
                const dateStr = new Date().toISOString().split('T')[0].replace(/-/g, '');
                const ledgerParams = {
                    customer_id: toObjectId(exist.customer_id),
                    customer_name: exist.customer_name,
                    login_type_id: exist.login_type_id,
                    customer_type_id: toObjectId(exist.customer_type_id),
                    transaction_type: global.TRANSACTION_TYPE[0],
                    points: Number(approved_point),
                    remark: `Points Credited against Bill Number ${exist.bill_number}.`,
                    transaction_id: `STK-${approved_point}-${dateStr}`,
                    creation_type: global.CREATION_TYPE[16]
                };
                await this.appLedgerService.create(req, ledgerParams);
            }
            return this.res.success('SUCCESS.STATUS_UPDATE');
        } catch (error) {
            return this.res.error(HttpStatus.BAD_REQUEST, 'ERROR.BAD_REQ', error);
        }
    }

    async upload(files: Express.Multer.File[], req: any): Promise<any> {
        try {
            req.body.module_name = Object.keys(global.MODULES).find(
                key => global.MODULES[key] === global.MODULES['Purchase']
            );
            let response = await this.s3Service.uploadMultiple(files, req, this.PurchaseDocsModel);
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
        return this.s3Service.getDocumentsByRowId(this.PurchaseDocsModel, id, type);
    }

    async getDocumentByDocsId(req: any, params: any): Promise<any> {
        const doc = await this.s3Service.getDocumentsById(this.PurchaseDocsModel, params._id);
        return this.res.success('SUCCESS.FETCH', doc);
    }
}
