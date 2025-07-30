import { Injectable, HttpStatus } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { toObjectId } from 'src/common/utils/common.utils';
import { Lts } from 'src/shared/translate/translate.service';
import { ResponseService } from 'src/services/response.service';
import { Model } from 'mongoose';
import { COLLECTION_CONST } from 'src/config/collection.constant';
import { ItemQrcodeModel, ItemQrcodeSchema } from '../models/item-qrcode.model';
import { BoxQrcodeModel, BoxQrcodeSchema } from '../models/box-qrcode.model';
import { PointCatQrcodeModel, PointCatQrcodeSchema } from '../models/point-cat-qrcode.model';
import { QrcodeGeneratorModel, QrcodeGeneratorSchema } from '../models/qrcode-generator.model';
import { ProductModel } from 'src/modules/master/product/models/product.model';
import { ProductDispatchModel } from 'src/modules/master/product/models/product-dispatch.model';
import { ProductPriceModel } from 'src/modules/master/product/models/product-price.model';
import { PointCategoryModel } from 'src/modules/master/point-category/models/point-category.model';
import { randomCoupon, Like } from 'src/common/utils/common.utils';
import { ScanQrcodeModel, ScanQrcodeSchema } from '../models/scan-qrcode.model';
import { commonFilters, appCommonFilters } from 'src/common/utils/common.utils';
import { LedgerService } from '../../ledger/web/ledger.service';
import { CustomerTypeModel } from 'src/modules/master/customer-type/models/customer-type.model';
import { NotificationService } from 'src/shared/rpc/notification.service';
import { MasterBoxQrcodeModel, MasterBoxQrcodeSchema } from '../models/master-box-qrcode.model';
import { DispatchModel } from 'src/modules/wms/dispatch/model/dispatch.model';
import { ManualDispatchModel } from 'src/modules/wms/dispatch/model/manual-dispatch.model';
import { DispatchGatepassModel } from 'src/modules/wms/gate-pass/model/gatepass.model';
import { DB_NAMES } from 'src/config/db.constant';
import { QrCodeType } from './dto/qr-code.dto';
import { ProductService } from 'src/modules/master/product/web/product.service';



@Injectable()
export class QrcodeService {
  constructor(
    @InjectModel(ItemQrcodeModel.name, DB_NAMES().COUPON_DB) private dynamicItmeQrcodeModel: Model<ItemQrcodeModel>,
    @InjectModel(BoxQrcodeModel.name, DB_NAMES().COUPON_DB) private dynamicBoxQrcodeModel: Model<BoxQrcodeModel>,
    @InjectModel(PointCatQrcodeModel.name, DB_NAMES().COUPON_DB) private dynamicPointCatQrcodeModel: Model<PointCatQrcodeModel>,
    @InjectModel(QrcodeGeneratorModel.name, DB_NAMES().COUPON_DB) private dynamicQrcodeGeneratorModel: Model<QrcodeGeneratorModel>,
    @InjectModel(ScanQrcodeModel.name, DB_NAMES().COUPON_DB) private dynamicScanQrcodeModel: Model<ScanQrcodeModel>,
    @InjectModel(MasterBoxQrcodeModel.name, DB_NAMES().COUPON_DB) private dynamicMasterBoxQrcodeModel: Model<MasterBoxQrcodeModel>,

    @InjectModel(ProductModel.name) private productModel: Model<ProductModel>,
    @InjectModel(ProductDispatchModel.name) private productDispatchModel: Model<ProductDispatchModel>,
    @InjectModel(DispatchModel.name) private dispatchModel: Model<DispatchModel>,
    @InjectModel(PointCategoryModel.name) private pointCatModel: Model<PointCategoryModel>,
    @InjectModel(ProductPriceModel.name) private productPriceModel: Model<ProductPriceModel>,
    @InjectModel(CustomerTypeModel.name) private customerTypeModel: Model<CustomerTypeModel>,
    @InjectModel(ManualDispatchModel.name) private manualDispatchModel: Model<ManualDispatchModel>,
    @InjectModel(DispatchGatepassModel.name) private dispatchGatepassModel: Model<DispatchGatepassModel>,
    private readonly res: ResponseService,
    private readonly ledgerService: LedgerService,
    private readonly notificationService: NotificationService,
    private readonly lts: Lts,
    private readonly productService: ProductService
  ) { }

  private orgItemQrcodeModel(orgId: string): Model<ItemQrcodeModel> {
    if (!orgId) {
      return null;
    }
    const couponCollectionName = `${COLLECTION_CONST().CRM_ITEM_QRCODES}_${orgId}`;
    return this.dynamicItmeQrcodeModel.db.model<ItemQrcodeModel>(ItemQrcodeModel.name, ItemQrcodeSchema, couponCollectionName);
  }

  private orgBoxQrcodeModel(orgId: string): Model<BoxQrcodeModel> {
    if (!orgId) {
      return null;
    }
    const couponCollectionName = `${COLLECTION_CONST().CRM_BOX_QRCODES}_${orgId}`;
    return this.dynamicBoxQrcodeModel.db.model<BoxQrcodeModel>(BoxQrcodeModel.name, BoxQrcodeSchema, couponCollectionName);
  }

  private orgPointCatQrcodeModel(orgId: string): Model<PointCatQrcodeModel> {
    if (!orgId) {
      return null;
    }
    const couponCollectionName = `${COLLECTION_CONST().CRM_POINT_CAT_QRCODES}_${orgId}`;
    return this.dynamicPointCatQrcodeModel.db.model<PointCatQrcodeModel>(PointCatQrcodeModel.name, PointCatQrcodeSchema, couponCollectionName);
  }

  private orgQrcodeGeneratorModel(orgId: string): Model<QrcodeGeneratorModel> {
    if (!orgId) {
      return null;
    }
    const couponCollectionName = `${COLLECTION_CONST().CRM_QRCODES_GENERATOR}_${orgId}`;
    return this.dynamicQrcodeGeneratorModel.db.model<QrcodeGeneratorModel>(QrcodeGeneratorModel.name, QrcodeGeneratorSchema, couponCollectionName);
  }

  private orgScanQrcodeModel(orgId: string): Model<ScanQrcodeModel> {
    if (!orgId) {
      return null;
    }
    const couponCollectionName = `${COLLECTION_CONST().CRM_SCAN_QRCODES}_${orgId}`;
    return this.dynamicScanQrcodeModel.db.model<ScanQrcodeModel>(ScanQrcodeModel.name, ScanQrcodeSchema, couponCollectionName);
  }

  private orgMasterBoxQrcodeModel(orgId: string): Model<MasterBoxQrcodeModel> {
    if (!orgId) {
      return null;
    }
    const couponCollectionName = `${COLLECTION_CONST().CRM_MASTER_BOX_QRCODES}_${orgId}`;
    return this.dynamicMasterBoxQrcodeModel.db.model<MasterBoxQrcodeModel>(MasterBoxQrcodeModel.name, MasterBoxQrcodeSchema, couponCollectionName);
  }


  async readItem(req: Request, params: any): Promise<any> {
    try {
      const orgId = req['user']['org_id'];

      const validQrcodeTypes = [global.QRCODE_TYPE[1], global.QRCODE_TYPE[2], global.QRCODE_TYPE[3]];
      if (!validQrcodeTypes.includes(params.qrcode_type)) {
        return this.res.error(HttpStatus.BAD_REQUEST, 'QR.TYPE_MISMATCH', 'Qr type mismatch.');
      }

      const query: any = {
        org_id: orgId,
        is_delete: 0
      };

      if (params.qrcode_type === global.QRCODE_TYPE[1] || params.qrcode_type === global.QRCODE_TYPE[3]) {
      } else if (params.qrcode_type === global.QRCODE_TYPE[2]) {
        query.box_size = { $gt: 0 };
      }
      const products = await this.productModel.find(query).exec();
      const data = products.map((item) => ({
        value: item._id,
        label: item.product_name
      }));
      return this.res.success('SUCCESS.FETCH', data);

    } catch (error) {
      return this.res.error(HttpStatus.BAD_REQUEST, 'ERROR.BAD_REQ', error.message || 'Unexpected error occurred');
    }
  }

  async create(req: Request, params: any): Promise<any> {
    try {
      let productData = null;
      let dispatchData = null;
      if (params.qrcode_type === QrCodeType.ITEM) {
        params.product_id = params.item ? toObjectId(params.item) : '';
      }
      else if (params.qrcode_type === QrCodeType.BOX) {
        params.product_id = params.box ? toObjectId(params.box) : '';
      } else {
        params.product_id = '';

      }
      params.point_category_id = params.point_category ? toObjectId(params.point_category) : '';
      params.created_data = req['user'];
      const orgId = req['user']['org_id'];
      const orgQrGeneratorModel = this.orgQrcodeGeneratorModel(orgId);

      if (!params.qrcode_qty || params.qrcode_qty > global.QR_GENERATE_LIMIT) {
        return this.res.error(HttpStatus.BAD_REQUEST, 'QR.LIMIT_EXCEED');
      }

      if (params.qrcode_type === global.QRCODE_TYPE[1] || params.qrcode_type === global.QRCODE_TYPE[2]) {
        productData = await this.productModel.findOne({ _id: params.product_id });
        dispatchData = await this.productDispatchModel.findOne({ product_id: toObjectId(params.product_id) });
        if (req['user']['wms']) {
          if (!dispatchData || dispatchData.length === 0) {
            return this.res.error(HttpStatus.BAD_REQUEST, 'QR.UPDATE_DISPATCH_DETAILS', params.qrcode_type);
          }
        }

        params.product_data = productData;
        params.dispatch_data = dispatchData;
        params.product_id = toObjectId(params.product_id);
      } else if (params.qrcode_type === global.QRCODE_TYPE[3]) {
        productData = await this.pointCatModel.findOne({ _id: params.point_category_id });
        params.product_data = productData;
        params.point_category_id = toObjectId(params.point_category_id);
      } else {
        return this.res.error(HttpStatus.BAD_REQUEST, 'QR.TYPE_MISMATCH', params.qrcode_type);
      }

      if (!productData) {
        return this.res.error(HttpStatus.BAD_REQUEST, 'QR.PRODUCT_NOT_EXIST');
      }

      const saveObj = {
        ...req['createObj'],
        ...params,
        status: global.STATUS[1]
      };

      if (req['user']['org']['batch_auto_genrate']) {
        const orgName = req['user']['org']['org_name'] || '';
        const firstTwoLetters = orgName.substring(0, 2).toUpperCase();
        const today = new Date();
        const day = String(today.getDate()).padStart(2, '0');
        const month = String(today.getMonth() + 1).padStart(2, '0');
        const yearShort = String(today.getFullYear()).slice(-2);
        const batchNo = `${firstTwoLetters}${day}${month}${yearShort}`;
        saveObj.batch_no = batchNo;
      }


      const document = new orgQrGeneratorModel(saveObj);
      const insert = await document.save();

      if (!insert?._id) {
        return this.res.error(HttpStatus.BAD_REQUEST, 'WARNING.INTERNAL_SERVER_ERROR', 'Qr History Genration Failed.');
      }

      params.qrcode_genrator_id = insert._id;
      let response = { statusCode: HttpStatus.BAD_REQUEST, statusMsg: 'BAD.REQ' }
      switch (params.qrcode_type) {
        case global.QRCODE_TYPE[1]:
          response = await this.createItemQrcodes(req, params);
          if (response.statusCode === HttpStatus.OK) return this.res.success(response.statusMsg, { history_id: insert?._id });
          else return this.res.error(response.statusCode, response.statusMsg);
        case global.QRCODE_TYPE[2]:
          const boxSize = params.dispatch_data.box_size ?? 0;
          if (boxSize > 0) {
            response = await this.createBoxQrcodes(req, params);
            if (response.statusCode === HttpStatus.OK) return this.res.success(response.statusMsg, { history_id: insert?._id });
            else return this.res.error(response.statusCode, response.statusMsg);
          } else {
            return this.res.error(HttpStatus.BAD_REQUEST, 'QR.BOX_NOT_DEFINED');
          }
        case global.QRCODE_TYPE[3]:
          response = await this.createPointCatQrcodes(req, params);
          if (response.statusCode === HttpStatus.OK) return this.res.success(response.statusMsg, { history_id: insert?._id });
          else return this.res.error(response.statusCode, response.statusMsg);
        default:
          return this.res.error(HttpStatus.BAD_REQUEST, 'Qr Type Not Matched.');
      }
    } catch (error) {
      return this.res.error(HttpStatus.BAD_REQUEST, 'ERROR.BAD_REQ', error.message || error);
    }
  }

  async createItemQrcodes(req: Request, params: any): Promise<any> {
    try {
      const orgId = req['user']['org_id'];
      const qrCodesToInsert = [];
      const orgItemQrModel = this.orgItemQrcodeModel(orgId);

      for (let i = 0; i < params.qrcode_qty; i++) {
        const qrCode = new orgItemQrModel({
          ...req['createObj'],
          qrcode_genrator_id: params.qrcode_genrator_id,
          qr_item_code: global.QRCODE_PRIFIX[0] + randomCoupon(),
          product_id: params.product_id,
          remark: params?.remark ?? '',
          form_data: null,
        });
        qrCodesToInsert.push(qrCode);
      }
      await orgItemQrModel.insertMany(qrCodesToInsert);
      return { statusCode: HttpStatus.OK, statusMsg: 'SUCCESS.CREATE' };
    } catch (error) {
      throw error;
    }
  }

  async createBoxQrcodes(req: Request, params: any): Promise<any> {
    try {
      const orgId = req['user']['org_id'];
      const orgBoxQrModel = this.orgBoxQrcodeModel(orgId);
      const orgItemQrModel = this.orgItemQrcodeModel(orgId);
      const boxSize = params.dispatch_data.box_size;
      const boxWithItem = params.dispatch_data.box_with_item;

      if (boxSize > 0) {
        for (let i = 0; i < params.qrcode_qty; i++) {
          const boxCode = global.QRCODE_PRIFIX[1] + randomCoupon()
          const boxQrCode = new orgBoxQrModel({
            ...req['createObj'],
            qrcode_genrator_id: toObjectId(params.qrcode_genrator_id),
            qr_box_code: boxCode,
            box_with_item: boxWithItem,
            box_size: boxSize,
            product_id: toObjectId(params.product_id),
            remark: params?.remark ?? '',
            form_data: null,
          });
          const insert = await boxQrCode.save();
          if (boxWithItem === true) {
            for (let j = 0; j < boxSize; j++) {
              const itemQrCode = new orgItemQrModel({
                ...req['createObj'],
                qrcode_genrator_id: toObjectId(params.qrcode_genrator_id),
                qr_item_code: global.QRCODE_PRIFIX[0] + randomCoupon(),
                qr_box_id: insert._id,
                qr_box_code: boxCode,
                product_id: toObjectId(params.product_id),
                remark: params?.remark ?? '',
                form_data: null,
              });
              await itemQrCode.save();
            }
          }
        }
      }
      return { statusCode: HttpStatus.OK, statusMsg: 'SUCCESS.CREATE' };
    } catch (error) {
      throw error;
    }
  }

  async createPointCatQrcodes(req: Request, params: any): Promise<any> {
    try {
      const orgId = req['user']['org_id'];
      const orgPointCatQrModel = this.orgPointCatQrcodeModel(orgId);
      const qrCodesToInsert = [];

      for (let i = 0; i < params.qrcode_qty; i++) {
        const qrCode = new orgPointCatQrModel({
          ...req['createObj'],
          qrcode_genrator_id: toObjectId(params.qrcode_genrator_id),
          qr_item_code: global.QRCODE_PRIFIX[2] + randomCoupon(),
          point_category_id: toObjectId(params.point_category_id),
          point_category_name: params.product_data.point_category_name,
          remark: params?.remark ?? '',
        });
        qrCodesToInsert.push(qrCode);
      }
      await orgPointCatQrModel.insertMany(qrCodesToInsert);
      return { statusCode: HttpStatus.OK, statusMsg: 'SUCCESS.CREATE' };
    } catch (error) {
      throw error;
    }
  }

  async readHistory(req: Request, params: any): Promise<any> {
    try {
      const orgId = req['user']['org_id'];
      const orgQrcodeGeneratorModel = this.orgQrcodeGeneratorModel(orgId);

      let match: Record<string, any> = { is_delete: 0 };
      const filters: Record<string, any> = commonFilters(params.filters || {});
      match = { ...match, ...filters };

      if (params?.filters?.activeTab) {
        const { activeTab } = params.filters;

        if (activeTab === global.QRCODE_TYPE[1]) {
          match.qrcode_type = global.QRCODE_TYPE[1];
        } else if (activeTab === global.QRCODE_TYPE[2]) {
          match.qrcode_type = global.QRCODE_TYPE[2];
        } else if (params?.qrcode_type === global.QRCODE_TYPE[3]) {
          match.qrcode_type = global.QRCODE_TYPE[3];
        } else {
          return this.res.error(HttpStatus.BAD_REQUEST, 'QR.TYPE_MISMATCH', 'Invalid QRCODE type in activeTab.');
        }
      }

      const page: number = params?.page || global.PAGE;
      const limit: number = params?.limit || global.LIMIT;
      const skip: number = Math.max(0, (page - 1) * limit);

      const total = await orgQrcodeGeneratorModel.countDocuments(match);
      const data = await orgQrcodeGeneratorModel.find(match)
        .sort({ _id: -1 })
        .skip(skip)
        .limit(limit)
        .lean()
        .exec();
      return this.res.pagination(data, total, page, limit);

    } catch (error) {
      return this.res.error(HttpStatus.BAD_REQUEST, 'ERROR.BAD_REQ', error);
    }
  }

  async detailHistory(req: Request, params: any): Promise<any> {
    try {
      params._id = toObjectId(params._id)
      const orgId = req['user']['org_id'];

      const orgQrcodeGeneratorModel = this.orgQrcodeGeneratorModel(orgId);
      const generatorData = await orgQrcodeGeneratorModel.findOne({ _id: params._id }).lean();

      if (!generatorData) {
        return this.res.error(HttpStatus.NOT_FOUND, 'ERROR.NOT_FOUND', 'QR code generator data not found.');
      }

      let files = [];
      if (generatorData?.product_id) {
        files = await this.productService.getDocument(generatorData.product_id);
      }

      generatorData.form_data = generatorData.form_data || {};
      generatorData.form_data.files = files;

      let qr = [];
      const qrcodeType = generatorData.qrcode_type;

      switch (qrcodeType) {
        case global.QRCODE_TYPE[1]: {
          const itemQrcodeModel = this.orgItemQrcodeModel(orgId);
          qr = await itemQrcodeModel.find({ qrcode_genrator_id: params._id }).lean();
          break;
        }

        case global.QRCODE_TYPE[2]: {
          const boxQrcodeModel = this.orgBoxQrcodeModel(orgId);
          const itemQrcodeModel = this.orgItemQrcodeModel(orgId);

          const boxes = await boxQrcodeModel.find({ qrcode_genrator_id: params._id }).lean();

          for (const box of boxes) {
            const items = await itemQrcodeModel.find({ qr_box_id: box._id }).lean();
            box['items'] = items
          }

          qr = boxes;
          break;
        }

        case global.QRCODE_TYPE[3]: {
          const pointCatModel = this.orgPointCatQrcodeModel(orgId);
          qr = await pointCatModel.find({ qrcode_genrator_id: params._id }).lean();
          break;
        }

        default:
          return this.res.error(HttpStatus.BAD_REQUEST, 'QR.TYPE_MISMATCH', 'Invalid QR code type.');
      }

      return this.res.success('SUCCESS.FETCH', { qr_history: generatorData, qr_data: qr });

    } catch (error) {
      return this.res.error(HttpStatus.INTERNAL_SERVER_ERROR, 'ERROR.BAD_REQ', error.message || error);
    }
  }

  async readQr(req: Request, params: any): Promise<any> {
    try {
      const orgId = req['user']['org_id'];
      let orgQrcodeModel;

      let match: Record<string, any> = { is_delete: 0 };
      let sorting: Record<string, 1 | -1> = { _id: -1 };

      if (params?.qrcode_type === global.QRCODE_TYPE[1]) {
        orgQrcodeModel = this.orgItemQrcodeModel(orgId);
      } else if (params?.qrcode_type === global.QRCODE_TYPE[2]) {
        orgQrcodeModel = this.orgBoxQrcodeModel(orgId);
      } else if (params?.qrcode_type === global.QRCODE_TYPE[3]) {
        orgQrcodeModel = this.orgPointCatQrcodeModel(orgId);
      } else {
        return this.res.error(HttpStatus.BAD_REQUEST, 'QR.TYPE_MISMATCH', 'Invalid QRCODE type in activeTab.');
      }

      const orgQrcodeGeneratorModel = this.orgQrcodeGeneratorModel(orgId);

      const filters: Record<string, any> = commonFilters(params?.filters);
      match = { ...match, ...filters };

      const page: number = Math.max(1, parseInt(params?.page, 10) || global.PAGE);
      const limit: number = Math.max(1, parseInt(params?.limit, 10) || global.LIMIT);
      const skip: number = (page - 1) * limit;

      if (params?.sorting && Object.keys(params.sorting).length > 0) {
        sorting = params.sorting;
      }

      const aggregation = [
        {
          $match: match
        },
        {
          $lookup: {
            from: orgQrcodeGeneratorModel.collection.name,
            localField: 'qrcode_genrator_id',
            foreignField: '_id',
            as: 'qrcode_generator_data'
          }
        },
        {
          $unwind: {
            path: '$qrcode_generator_data',
            preserveNullAndEmptyArrays: true
          }
        },
        {
          $addFields: {
            product_data: {
              product_name: '$qrcode_generator_data.product_data.product_name',
              product_code: '$qrcode_generator_data.product_data.product_code',
              point_category_name: '$qrcode_generator_data.product_data.point_category_name',

            }
          }
        },
        {
          $sort: sorting
        },
        {
          $skip: skip,
        },
        {
          $limit: limit
        }
      ];

      const total = await orgQrcodeModel.countDocuments(match);
      let data = await orgQrcodeModel.aggregate(aggregation).exec();

      if (params?.qrcode_type === global.QRCODE_TYPE[2]) {
        for (let index = 0; index < data.length; index++) {
          const element = data[index];
          const items = await this.readBoxItemQr(req, element.qr_box_code)
          data[index].box_items = items.items;
          data[index].box_items_count = items.total;
        }
      }

      return this.res.pagination(data, total, page, limit);
    } catch (error) {
      return this.res.error(HttpStatus.BAD_REQUEST, 'ERROR.BAD_REQ', error?.message || 'An error occurred while fetching QR code data.');
    }
  }

  private async readBoxItemQr(req: any, box_qr_code): Promise<any> {
    try {
      const orgId = req['user']['org_id'];
      let match: Record<string, any> = { is_delete: 0, qr_box_code: box_qr_code, org_id: orgId };
      const orgQrcodeModel = this.orgItemQrcodeModel(orgId);

      const total = await orgQrcodeModel.countDocuments(match);
      const items = await orgQrcodeModel.find(match).lean()

      return { items, total };
    } catch (error) {
      return this.res.error(HttpStatus.BAD_REQUEST, 'ERROR.BAD_REQ', error?.message || 'An error occurred while fetching QR code data.');
    }
  }

  async readScanQr(req: Request, params: any): Promise<any> {
    try {
      const orgId = req['user']['org_id'];
      const orgScanQrcodeModel = this.orgScanQrcodeModel(orgId);

      let match: Record<string, any> = { is_delete: 0 };
      let sorting: Record<string, 1 | -1> = { _id: -1 };

      if (params?._id) {
        match.scanned_id = toObjectId(params._id)
      }

      const filters: Record<string, any> = commonFilters(params?.filters);
      match = { ...match, ...filters };

      const page: number = Math.max(1, parseInt(params?.page, 10) || global.PAGE);
      const limit: number = Math.max(1, parseInt(params?.limit, 10) || global.LIMIT);
      const skip: number = (page - 1) * limit;

      if (params?.sorting && Object.keys(params.sorting).length > 0) {
        sorting = params.sorting;
      }

      const total = await orgScanQrcodeModel.countDocuments(match);
      const data = await orgScanQrcodeModel.find(match)
        .sort(sorting)
        .skip(skip)
        .limit(limit)
        .lean()
        .exec();

      return this.res.pagination(data, total, page, limit);
    } catch (error) {
      return this.res.error(HttpStatus.BAD_REQUEST, 'ERROR.BAD_REQ', error?.message || 'An error occurred while fetching data.');
    }
  }

  async getPoints(req: Request, params: any): Promise<any> {
    try {
      const orgId = req['user']['org_id'];
      const orgScanQrcodeModel = this.orgScanQrcodeModel(orgId);

      let match: Record<string, any> = { is_delete: 0, org_id: orgId };
      const { start, end } = params?.custom_date_range || {};

      if (start && end) {
        match.created_at = {
          $gte: new Date(start),
          $lt: new Date(end),
        };
      }

      const pipeline: any[] = [
        {
          $match: match
        },
        {
          $group: {
            _id: "$created_id",
            total_points: {
              $sum: {
                $add: [
                  {
                    $ifNull: ["$total_points", 0]
                  },
                  {
                    $ifNull: ["$bonus_points", 0]
                  }
                ]
              }
            }
          }
        }
      ];

      let data: Record<string, any>[] = await orgScanQrcodeModel.aggregate(pipeline);

      return data?.[0]?.total_points || 0;

    } catch (error) {
      throw error;
    }
  }

  async printStatusChange(req: Request, params: any): Promise<any> {
    try {
      const orgId = req['user']['org_id'];
      const orgQrGeneratorModel = this.orgQrcodeGeneratorModel(orgId);

      const existing = await orgQrGeneratorModel.findOne({ _id: params._id }).lean();

      if (!existing) {
        return this.res.error(HttpStatus.NOT_FOUND, 'ERROR.NOT_FOUND');
      }

      await orgQrGeneratorModel.updateOne(
        { _id: params._id },
        {
          $set: {
            ...req['updateObj'],
            ...params
          }
        }
      );

      return this.res.success('QR Print status updated');
    } catch (error) {
      return this.res.error(HttpStatus.BAD_REQUEST, 'ERROR.BAD_REQ', error.message || error);
    }
  }

  async statusChange(req: Request, params: any): Promise<any> {
    try {
      const orgId = req['user']['org_id'];
      const orgQrGeneratorModel = this.orgQrcodeGeneratorModel(orgId);

      const existing = await orgQrGeneratorModel.findOne({ _id: params._id }).lean();

      if (!existing) {
        return this.res.error(HttpStatus.NOT_FOUND, 'ERROR.NOT_FOUND');
      }

      await orgQrGeneratorModel.updateOne(
        { _id: params._id },
        {
          $set: {
            ...req['updateObj'],
            ...params
          }
        }
      );

      return this.res.success('QR status updated');
    } catch (error) {
      return this.res.error(HttpStatus.BAD_REQUEST, 'ERROR.BAD_REQ', error.message || error);
    }
  }

  async deleteHistory(req: Request, params: any): Promise<any> {
    try {
      const orgId = req['user']['org_id'];
      const updateObj = req['updateObj'] || {};

      const qrGeneratorModel = this.orgQrcodeGeneratorModel(orgId);
      const existingQRCode = await qrGeneratorModel.findOne({ _id: params._id }).lean();

      if (!existingQRCode) {
        return this.res.error(HttpStatus.NOT_FOUND, 'ERROR.NOT_FOUND', 'QR code history not found.');
      }

      const qrType = existingQRCode.qrcode_type;
      let specificQrModel;

      switch (qrType) {
        case global.QRCODE_TYPE[1]:
          specificQrModel = this.orgItemQrcodeModel(orgId);
          break;
        case global.QRCODE_TYPE[2]:
          specificQrModel = this.orgBoxQrcodeModel(orgId);
          break;
        case global.QRCODE_TYPE[3]:
          specificQrModel = this.orgPointCatQrcodeModel(orgId);
          break;
        default:
          return this.res.error(HttpStatus.BAD_REQUEST, 'QR.TYPE_MISMATCH', 'Invalid QR code type.');
      }

      const scanModel = this.orgScanQrcodeModel(orgId);

      const alreadyScanned = await scanModel.findOne({ qrcode_genrator_id: existingQRCode._id }).lean();
      if (alreadyScanned) {
        return this.res.error(HttpStatus.CONFLICT, 'QR.NOT_DELETE_ALREADY_SCAN', 'QR code has already been scanned.');
      }


      const alreadyDispatched = await specificQrModel.findOne({
        qrcode_genrator_id: existingQRCode._id,
        customer_id: { $gt: 0 }
      }).lean();

      if (alreadyDispatched) {
        return this.res.error(HttpStatus.CONFLICT, 'QR.NOT_DELETE_ALREADY_DISPATCHED', 'QR code has already been dispatched.');
      }

      const update = { ...updateObj, is_delete: 1 };

      await Promise.all([
        qrGeneratorModel.updateOne({ _id: existingQRCode._id }, { $set: update }),
        specificQrModel.updateOne({ qrcode_genrator_id: existingQRCode._id }, { $set: update })
      ]);

      return this.res.success('SUCCESS.DELETE');
    } catch (error) {
      return this.res.error(HttpStatus.BAD_REQUEST, 'ERROR.BAD_REQ', error.message || error);
    }
  }

  async deleteQr(req: Request, params: any): Promise<any> {
    try {
      const orgId = req['user']['org_id'];
      const updateObj = req['updateObj'] || {};
      let specificQrModel;
      let qr_type;
      let existingQRCode

      qr_type = global.QRCODE_TYPE[3]
      specificQrModel = this.orgPointCatQrcodeModel(orgId);
      existingQRCode = await specificQrModel.findOne({ _id: params._id }).lean();
      if (!existingQRCode) {
        qr_type = global.QRCODE_TYPE[1]
        specificQrModel = this.orgItemQrcodeModel(orgId);
        existingQRCode = await specificQrModel.findOne({ _id: params._id }).lean();
      }

      if (!existingQRCode) {
        qr_type = global.QRCODE_TYPE[2]
        specificQrModel = this.orgBoxQrcodeModel(orgId);
        existingQRCode = await specificQrModel.findOne({ _id: params._id }).lean();
      }

      if (!existingQRCode) {
        return this.res.error(HttpStatus.NOT_FOUND, 'QR.NOT_FOUND');
      }

      const scanModel = this.orgScanQrcodeModel(orgId);

      const alreadyScanned = await scanModel.findOne({ qr_id: existingQRCode._id }).lean();
      if (alreadyScanned) {
        return this.res.error(HttpStatus.CONFLICT, 'QR.NOT_DELETE_ALREADY_SCAN', 'QR code has already been scanned.');
      }

      const alreadyDispatched = await specificQrModel.findOne({
        _id: existingQRCode._id,
        customer_id: { $gt: 0 }
      }).lean();

      if (alreadyDispatched) {
        return this.res.error(HttpStatus.CONFLICT, 'QR.NOT_DELETE_ALREADY_DISPATCHED');
      }

      const update = { ...updateObj, is_delete: 1 };

      await Promise.all([
        specificQrModel.updateOne({ _id: existingQRCode._id }, { $set: update })
      ]);

      return this.res.success('SUCCESS.DELETE');
    } catch (error) {
      return this.res.error(HttpStatus.BAD_REQUEST, 'ERROR.BAD_REQ', error.message || error);
    }
  }

  async deleteMasterBox(req: Request, params: any): Promise<any> {
    try {
      const orgId = req['user']['org_id'];
      let masterBoxModel;
      let masterBox

      masterBoxModel = this.orgMasterBoxQrcodeModel(orgId),
        masterBox = await masterBoxModel.findOne({ _id: toObjectId(params._id) }).lean();

      if (masterBox) {
        const itemModel = this.orgItemQrcodeModel(orgId);
        const item = await itemModel.findOne({ qr_master_box_id: masterBox._id }).lean();

        if (item) {
          return this.res.error(HttpStatus.NOT_FOUND, 'QR.MASTER_BOX_NOT_BLANK');
        }

        const boxModel = this.orgBoxQrcodeModel(orgId);
        const box = await boxModel.findOne({ qr_master_box_id: masterBox._id }).lean();

        if (box) {
          return this.res.error(HttpStatus.NOT_FOUND, 'QR.MASTER_BOX_NOT_BLANK');
        }

      } else {
        return this.res.error(HttpStatus.NOT_FOUND, 'QR.MASTER_BOX_NOT_FOUND');
      }

      const updateObj = {
        ...req['updateObj'],
        is_delete: 1,
      };

      const deletedResult = await masterBoxModel.updateOne(
        { _id: masterBox._id },
        { $set: updateObj }
      );

      return this.res.success('SUCCESS.DELETE');
    } catch (error) {
      return this.res.error(HttpStatus.BAD_REQUEST, 'ERROR.BAD_REQ', error.message || error);
    }
  }

  async reopenQr(req: Request, params: any): Promise<any> {
    try {
      const orgId = req['user']['org_id'];
      let totalPoints = 0;
      params._id = toObjectId(params._id)
      if (!orgId) {
        return this.res.error(HttpStatus.BAD_REQUEST, 'QR.MISSING_PARAMS', 'Organization ID is missing.');
      }

      const scanModel = this.orgScanQrcodeModel(orgId);
      const alreadyScanned = await scanModel.findOne({ _id: params._id, is_delete: 0 }).lean();

      if (!alreadyScanned) {
        return this.res.error(HttpStatus.CONFLICT, 'QR.NOT_SCANNED_YET', 'QR code has not been scanned yet.');
      }

      const updateObj = {
        ...req['updateObj'],
        is_delete: 1,
      };

      const deletedResult = await scanModel.updateOne(
        { _id: params._id },
        { $set: updateObj }
      );

      if (deletedResult.modifiedCount > 0) {
        totalPoints = (alreadyScanned.total_points || 0) + (alreadyScanned.bonus_points || 0);

        const ledgerParams = {
          customer_id: alreadyScanned.scanned_id,
          customer_name: alreadyScanned.scanned_name,
          login_type_id: alreadyScanned.login_type_id,
          customer_type_id: alreadyScanned.customer_type_id,
          transaction_type: global.TRANSACTION_TYPE[1],
          points: totalPoints,
          remark: `${totalPoints} point(s) debited against wrong scan.`,
          transaction_id: `${alreadyScanned?.qr_code}${alreadyScanned?.scanned_id}`,
          creation_type: global.CREATION_TYPE[6],
        };
        await this.ledgerService.create(req, ledgerParams);
      }

      params.template_id = 6
      params.account_ids = [
        {
          account_ids: alreadyScanned.scanned_id,
          login_type_id: alreadyScanned.login_type_id,
        }
      ];

      params.variables = {
        points: totalPoints,
        qr: alreadyScanned.qr_code
      };
      params.push_notify = true;
      params.in_app = true;
      this.notificationService.notify(req, params);
      return this.res.success('QR.QR_REOPEN');

    } catch (error) {
      return this.res.error(HttpStatus.BAD_REQUEST, 'ERROR.UNEXPECTED', error);
    }
  }

  async scanCount(req, params): Promise<any> {

    params._id = toObjectId(params?.customer_id) || req['user']['_id']


    if (!params.customer_id || !req['user']['org_id']) {
      return { count: 0, total_points: 0, bonus_points: 0 };
    }
    const scanModel = this.orgScanQrcodeModel(req['user']['org_id']);
    const count = await scanModel.countDocuments({ scanned_id: params.customer_id });
    const [sumResult] = await scanModel.aggregate([
      {
        $match: { scanned_id: toObjectId(params.customer_id) }
      },
      {
        $group: {
          _id: null,
          total_points: { $sum: "$total_points" },
          bonus_points: { $sum: "$bonus_points" }
        }
      }
    ]);

    return {
      count,
      total_points: sumResult?.total_points || 0,
      bonus_points: sumResult?.bonus_points || 0
    };
  }

  async getLast15DaysPoints(req, params): Promise<any> {

    params._id = toObjectId(params?.customer_id) || req['user']['_id']

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const startDate = new Date(today);
    startDate.setDate(startDate.getDate() - 14);
    const scanModel = this.orgScanQrcodeModel(req['user']['org_id']);
    const aggregated = await scanModel.aggregate([
      {
        $match: {
          scanned_id: params.customerId,
          created_at: { $gte: startDate }
        }
      },
      {
        $group: {
          _id: {
            $dateToString: { format: "%Y-%m-%d", date: "$created_at" }
          },
          total_points: { $sum: "$total_points" }
        }
      },
      {
        $sort: { _id: 1 }
      }
    ]);

    const pointsMap = new Map<string, number>();
    for (const entry of aggregated) {
      pointsMap.set(entry._id, entry.total_points);
    }

    const result: Array<{ date: string, total_points: number }> = [];
    for (let i = 0; i < 15; i++) {
      const date = new Date(startDate);
      date.setDate(startDate.getDate() + i);
      const dateStr = date.toISOString().split('T')[0];

      result.push({
        date: dateStr,
        total_points: pointsMap.get(dateStr) || 0
      });
    }

    return result;
  }

  async qrExist(req, params): Promise<any> {
    const orgId = req['user']['org_id'];
    const qrCode = params.qr_code;
    const masterBoxCode = params.master_box_code;

    const qrModels = {
      generator: this.orgQrcodeGeneratorModel(orgId),
      item: this.orgItemQrcodeModel(orgId),
      pointCat: this.orgPointCatQrcodeModel(orgId),
      box: this.orgBoxQrcodeModel(orgId),
      master: this.orgMasterBoxQrcodeModel(orgId),
    };

    const masterBox = await qrModels.master.findOne({ qr_master_box_code: masterBoxCode, is_delete: 0 }).exec();
    if (!masterBox) {
      return { statusMsg: "DISPATCH.INVALID_MASTER_BOX", statusCode: HttpStatus.NOT_FOUND };
    }
    params.master_box = masterBox;

    let qrType = null;
    let qrData: any
    qrData = await qrModels.pointCat.findOne({ qr_item_code: qrCode, is_delete: 0 }).exec();
    if (qrData) {
      qrType = global.QRCODE_TYPE[3];
    } else {
      qrData = await qrModels.item.findOne({ qr_item_code: qrCode, is_delete: 0 }).exec();
      if (qrData) {
        qrType = global.QRCODE_TYPE[1];
      } else {
        qrData = await qrModels.box.findOne({ qr_box_code: qrCode, is_delete: 0 }).exec();
        if (qrData) {
          qrType = global.QRCODE_TYPE[2];
          qrData.box_items = await qrModels.item.find({ qr_box_code: qrCode, is_delete: 0 }).exec();
        }
      }
    }

    if (!qrData) {
      return { statusMsg: "DISPATCH.INVALID_QR", statusCode: HttpStatus.NOT_FOUND };
    }

    const qrGenrateData = await qrModels.generator.findOne({
      _id: qrData.qrcode_genrator_id,
      is_delete: 0
    }).exec();

    if (!qrGenrateData?.dispatch_data?.qr_genration) {
      return {
        statusMsg: "DISPATCH.QR_SCANNING_DISABLED",
        statusCode: HttpStatus.CONFLICT
      };
    }

    if (qrType === global.QRCODE_TYPE[3]) {
      return {
        statusMsg: "DISPATCH.DISPATCH_NOT_ALLOWED_POINT_CAT",
        statusCode: HttpStatus.CONFLICT
      };
    }

    const alreadyDispatch = await this.alreadyDispatchCheck(req, qrData, qrType);

    if (alreadyDispatch.statusCode === HttpStatus.OK) {
      return { statusMsg: "DISPATCH.ok", statusCode: HttpStatus.OK, qrType, qrData };
    } else {

      const currentMasterBoxCode = qrData.qr_master_box_code;
      const newMasterBoxCode = masterBox.qr_master_box_code;

      // if (currentMasterBoxCode !== newMasterBoxCode) {
      //   params.qr_data = qrData;
      //   params.qr_data.qrType = qrType;
      //   await this.suffleMasterBox(req, params);
      // }

      return alreadyDispatch;
    }
  }

  private async suffleMasterBox(req: any, params: any): Promise<any> {
    const orgId = req['user']['org_id'];
    const qrType = params?.qr_data?.qrType;
    const qrCode = params.qr_code;

    const qrModels = {
      item: this.orgItemQrcodeModel(orgId),
      box: this.orgBoxQrcodeModel(orgId),
    };

    const updateData = {
      ...req['updateObj'],
      qr_master_box_code: params.master_box.qr_master_box_code,
      qr_master_box_id: toObjectId(params.master_box._id),
    };

    if (qrType === 'item') {
      await qrModels.item.updateOne({ qr_item_code: qrCode }, { $set: updateData });
    } else if (qrType === 'box') {
      await qrModels.box.updateOne({ qr_box_code: qrCode }, { $set: updateData });
      await qrModels.item.updateMany({ qr_box_code: qrCode }, { $set: updateData });
    } else {
      return {
        statusMsg: "DISPATCH.INVALID_QR_TYPE",
        statusCode: HttpStatus.BAD_REQUEST,
      };
    }

    return {
      statusMsg: "DISPATCH.ok",
      statusCode: HttpStatus.OK,
    };
  }

  async alreadyDispatchCheck(req: any, qrData: any, qrType: any): Promise<any> {
    const orgId = req?.user?.org_id;
    const userId = req?.user?._id;

    if (qrType === global.QRCODE_TYPE[1]) {

      if (!qrData?.customer_id) {
        return { statusMsg: "DISPATCH.ok", statusCode: HttpStatus.OK };
      }

      if (qrData.login_type_id === 9 && qrData.customer_id !== userId) {
        return { statusMsg: "DISPATCH.ok", statusCode: HttpStatus.OK };
      }

      return {
        statusMsg: "DISPATCH.ITEM_ALREADY_DISPATCHED",
        statusCode: HttpStatus.CONFLICT,
      };
    }

    if (qrType === global.QRCODE_TYPE[2]) {
      if (qrData.customer_id) {
        return { statusMsg: "DISPATCH.BOX_ALREADY_DISPATCHED", statusCode: HttpStatus.CONFLICT };
      }
      if (qrData.box_with_item === false) {
        return {
          statusMsg: "DISPATCH.ok",
          statusCode: HttpStatus.OK,
        };
      }
      if (Array.isArray(qrData.box_items) && qrData.box_items.length > 0) {
        for (const item of qrData.box_items) {
          if (item.customer_id) {
            return {
              statusMsg: "DISPATCH.BOX_ALREADY_OPENED",
              statusCode: HttpStatus.CONFLICT,
            };
          }
        }

        return {
          statusMsg: "DISPATCH.ok",
          statusCode: HttpStatus.OK,
        };
      }

      return {
        statusMsg: "DISPATCH.INVALID_BOX_ITEMS",
        statusCode: HttpStatus.NOT_FOUND,
      };
    }

    return {
      statusMsg: "DISPATCH.TYPE_MISMATCH",
      statusCode: HttpStatus.BAD_REQUEST,
    };
  }

  async updateDispatch(req: any, params: any): Promise<any> {
    const orgId = req?.user?.org_id;
    const qrModels = {
      item: this.orgItemQrcodeModel(orgId),
      box: this.orgBoxQrcodeModel(orgId),
      master: this.orgMasterBoxQrcodeModel(orgId),
    };
    const updateData = {
      ...req['updateObj'],
      dispatch_id: toObjectId(params.dispatch_details._id),
      dispatch_from: params.dispatch_details.dispatch_from,
      billing_company: params.dispatch_details.billing_company,
      customer_id: toObjectId(params.dispatch_details.customer_id),
      customer_type_id: toObjectId(params.dispatch_details.customer_type_id),
      customer_type_name: params.dispatch_details.customer_type_name,
      customer_name: params.dispatch_details.customer_name,
      customer_mobile: params.dispatch_details.mobile,
      order_date: params.dispatch_details.order_date,
      order_id: toObjectId(params.dispatch_details.order_id),
      order_no: params.dispatch_details.order_no,
      qr_master_box_code: params.master_box.qr_master_box_code,
      qr_master_box_id: toObjectId(params.master_box._id)
    };
    const qrType = params?.qr_data?.qrType;
    const qrCode = params.qr_code;

    const checkUpdate = await qrModels.master.findOne({
      qr_master_box_code: params.master_box.qr_master_box_code,
      $or: [{ order_id: null }, { order_id: { $exists: false } }],
    }).lean();

    if (!checkUpdate) {
      await qrModels.master.updateOne(
        { qr_master_box_code: params.master_box.qr_master_box_code },
        {
          $set: { order_id: toObjectId(params.dispatch_details.order_id), order_no: params.dispatch_details.order_no }
        }
      );
    }

    if (qrType === 'item') {
      await qrModels.item.updateOne(
        { qr_item_code: qrCode },
        {
          $set: updateData,
          $push: { dispatch_cycle: updateData },
        }
      );
    } else if (qrType === 'box') {
      await qrModels.box.updateOne(
        { qr_box_code: qrCode },
        {
          $set: updateData,
          $push: { dispatch_cycle: updateData },
        }
      );
    } else {
      return {
        statusMsg: "DISPATCH.INVALID_QR_TYPE",
        statusCode: HttpStatus.BAD_REQUEST,
      };
    }

    return {
      statusMsg: "DISPATCH.ok",
      statusCode: HttpStatus.OK,
    };
  }

  async readDropDown(req: Request, params: any): Promise<any> {
    try {
      const key = params.key;
      const productId = params.product_id;

      if (!key) {
        return this.res.error(HttpStatus.BAD_REQUEST, 'ERROR.BAD_REQ', 'Key required');
      }
      if (!productId) {
        return this.res.error(HttpStatus.BAD_REQUEST, 'ERROR.BAD_REQ', 'Product id required');
      }

      const resultSet: Set<string> = new Set();

      const product = await this.productModel.findOne({
        _id: toObjectId(productId),
        is_delete: 0,
        org_id: req['user']['org_id']
      }).lean();

      if (!product?.form_data || !(key in product.form_data)) {
        return this.res.success('SUCCESS.FETCH', []);
      }

      const value = product.form_data[key];

      if (Array.isArray(value)) {
        value.forEach(v => {
          if (typeof v === 'string' && v.trim()) {
            resultSet.add(v.trim());
          }
        });
      } else if (typeof value === 'string' && value.trim()) {
        resultSet.add(value.trim());
      }

      const result = Array.from(resultSet).map(v => ({
        label: v,
        value: v
      }));

      return this.res.success('SUCCESS.FETCH', result);
    } catch (error) {
      return this.res.error(HttpStatus.BAD_REQUEST, 'ERROR.BAD_REQ', error);
    }
  }

  async createMasterBox(req: Request, params: any): Promise<any> {
    try {
      const orgId = req['user']['org_id'];
      const orgQrMasterBoxModel = this.orgMasterBoxQrcodeModel(orgId);
      let masterQrCode = {
        ...req['createObj'],
        qr_master_box_code: global.QRCODE_PRIFIX[3] + randomCoupon(),
      };

      if (params.dispatch_id) {
        masterQrCode = { ...masterQrCode, dispatch_id: toObjectId(params.dispatch_id) }
      }

      const document = new orgQrMasterBoxModel(masterQrCode);
      await document.save();
      return this.res.success('SUCCESS.CREATE');
    } catch (error) {
      return this.res.error(HttpStatus.BAD_REQUEST, 'ERROR.BAD_REQ', error);
    }
  }

  async readMasterBoxDropdown(req: Request, params: any): Promise<any> {
    try {
      params.dispatch_id = toObjectId(params.dispatch_id)
      const orgId = req['user']['org_id'];
      const orgQrMasterBoxModel = this.orgMasterBoxQrcodeModel(orgId);

      let sorting: Record<string, 1 | -1> = { _id: -1 };

      let match: any = { is_delete: 0 };
      if (params.dispatch_id) {
        match = { ...match, dispatch_id: params.dispatch_id }
      }

      if (params?.filters?.search) {
        const fieldsToSearch = ["qr_master_box_code"];
        const searchQuery = appCommonFilters(params.filters, fieldsToSearch);
        match = { ...match, ...searchQuery };
      }

      const result = await orgQrMasterBoxModel.find(match)
        .sort(sorting)
        .exec();

      const mappedResult = result.map(item => ({
        label: item.qr_master_box_code,
        value: item.qr_master_box_code,
      }));

      return this.res.success('SUCCESS.FETCH', mappedResult);
    } catch (error) {
      return this.res.error(HttpStatus.BAD_REQUEST, 'ERROR.BAD_REQ', error?.message || 'An error occurred while fetching the data.');
    }
  }


  async readMasterBox(req: Request, params: any): Promise<any> {
    try {
      if (params.dispatch_id) {
        params.dispatch_id = toObjectId(params.dispatch_id);
      }

      const orgId = req['user']['org_id'];
      const orgQrMasterBoxModel = this.orgMasterBoxQrcodeModel(orgId);

      const match: any = { is_delete: 0 };
      if (params.dispatch_id) {
        match.dispatch_id = params.dispatch_id;
      }

      if (params?.filters?.search) {
        const fieldsToSearch = ["qr_master_box_code"];
        const searchQuery = appCommonFilters(params.filters, fieldsToSearch);
        Object.assign(match, searchQuery);
      }

      const page: number = Math.max(1, parseInt(params?.page, 10) || global.PAGE);
      const limit: number = Math.max(1, parseInt(params?.limit, 10) || global.LIMIT);
      const skip: number = (page - 1) * limit;

      const total = await orgQrMasterBoxModel.countDocuments(match);

      let query = orgQrMasterBoxModel.find(match).sort({ _id: -1 });

      if (!params.pdf) {
        query = query.skip(skip).limit(limit);
      }

      const result = await query.exec();

      const mappedResult = await Promise.all(
        result.map(async (item) => {
          const itemData = await this.masterBoxData(req, item.qr_master_box_code);
          return {
            _id: item._id,
            label: item.qr_master_box_code,
            value: item.qr_master_box_code,
            item: itemData.distinct_item_products,
            box: itemData.distinct_box_products,
            pdf_products: itemData.pdf_products
          };
        })
      );

      if (params.pdf) {
        return this.res.success('SUCCESS.FETCH', mappedResult);
      } else {
        return this.res.pagination(mappedResult, total, page, limit);
      }
    } catch (error) {
      return this.res.error(HttpStatus.BAD_REQUEST, 'ERROR.BAD_REQ', error);
    }
  }

  async masterBoxData(req, qr_master_box_code): Promise<any> {
    try {
      const orgId = req['user']['org_id'];

      const orgQrItemModel = this.orgItemQrcodeModel(orgId);
      const orgQrBoxModel = this.orgBoxQrcodeModel(orgId);
      const orgQrGeneratorModel = this.orgQrcodeGeneratorModel(orgId);

      const aggregationPipeline = [
        { $match: { is_delete: 0, qr_master_box_code } },
        {
          $lookup: {
            from: orgQrGeneratorModel.collection.name,
            localField: 'qrcode_genrator_id',
            foreignField: '_id',
            as: 'product_info',
          },
        },
        {
          $unwind: {
            path: '$product_info',
            preserveNullAndEmptyArrays: true,
          },
        },
        {
          $project: {
            _id: 1,
            product_id: 1,
            qr_master_box_code: 1,
            qr_code: 1,
            qr_item_code: 1,
            qr_box_code: 1,
            product_name: '$product_info.product_data.product_name',
            product_code: '$product_info.product_data.product_code',
            product_info: 1,
          },
        },
      ];

      const [item, box] = await Promise.all([
        orgQrItemModel.aggregate(aggregationPipeline).exec(),
        orgQrBoxModel.aggregate(aggregationPipeline).exec(),
      ]);

      const countDistinctProductsWithQrList = (data: any[]) => {
        const map = new Map<
          string,
          {
            qty: number;
            product_code: string;
            product_name: string;
            attached_qr: any[];
          }
        >();

        data.forEach((entry) => {
          const productId = entry.product_id?.toString();
          if (!productId) return;

          if (!map.has(productId)) {
            map.set(productId, {
              qty: 1,
              product_code: entry.product_code ?? '',
              product_name: entry.product_name ?? '',
              attached_qr: [entry],
            });
          } else {
            const existing = map.get(productId);
            existing.qty += 1;
            existing.attached_qr.push(entry);
          }
        });

        return Array.from(map.entries()).map(([product_id, value]) => ({
          product_id,
          product_code: value.product_code,
          product_name: value.product_name,
          qty: value.qty,
          attached_qr: value.attached_qr,
        }));
      };

      const distinct_item_products = countDistinctProductsWithQrList(item);
      const distinct_box_products = countDistinctProductsWithQrList(box);

      const itemProductIds = new Set(distinct_item_products.map((p) => p.product_id));

      for (const boxProduct of distinct_box_products) {
        if (!itemProductIds.has(boxProduct.product_id)) {
          const sampleQr = boxProduct.attached_qr?.[0];
          const boxSize = sampleQr?.product_info?.dispatch_data?.box_size || 1;
          const totalQty = boxProduct.qty * boxSize;

          distinct_item_products.push({
            product_id: boxProduct.product_id,
            product_code: boxProduct.product_code,
            product_name: boxProduct.product_name,
            qty: totalQty,
            attached_qr: [
              {
                box_only: true,
                qr_box_code: sampleQr?.qr_box_code,
                estimated_qty: totalQty,
                note: 'Product is part of a box but not found in item QR list.',
              },
            ],
          });
        }
      }

      const pdf_products = distinct_item_products.map((p) => ({
        product_id: p.product_id,
        product_code: p.product_code,
        product_name: p.product_name,
        qty: p.qty,
      }));

      return {
        distinct_item_products,
        distinct_box_products,
        pdf_products,
      };
    } catch (error) {
      return this.res.error(
        HttpStatus.BAD_REQUEST,
        'ERROR.BAD_REQ',
        error?.message || 'Unexpected error occurred.'
      );
    }
  }


  async masterBoxScan(req: Request, params: any): Promise<any> {
    try {
      const orgId = req['user']['org_id'];
      const qrModels = {
        master: this.orgMasterBoxQrcodeModel(orgId),
      };

      const masterBoxCode = params.master_box_code;

      const exist = await qrModels.master.findOne({
        qr_master_box_code: masterBoxCode,
        is_delete: 0
      }).exec();
      if (!exist) {
        return this.res.error(HttpStatus.NOT_FOUND, 'DISPATCH.INVALID_MASTER_BOX');
      }

      const alreadyScanned = await qrModels.master.findOne({
        qr_master_box_code: masterBoxCode,
        is_delete: 0,
        customer_id: { $exists: true }
      }).exec();


      if (alreadyScanned) {
        return this.res.error(HttpStatus.CONFLICT, 'DISPATCH.MASTER_BOX_ALREADY_SCANNED');
      }

      await qrModels.master.updateOne(
        {
          qr_master_box_code: masterBoxCode,
        },
        {
          $set: {
            ...req['updateObj'],
            customer_id: req['user']['_id'],
            gate_pass_id: params.gatepass_id
          },
        }
      );

      return this.res.success('SUCCESS.CREATE');
    } catch (error) {
      return this.res.error(HttpStatus.BAD_REQUEST, 'ERROR.BAD_REQ', error);
    }
  }

  async updateGatepassToQr(req: Request, params: any): Promise<any> {
    try {
      const orgId = req['user']['org_id'];
      const qrModels = {
        master: this.orgMasterBoxQrcodeModel(orgId),
        item: this.orgItemQrcodeModel(orgId),
        box: this.orgBoxQrcodeModel(orgId),
      };

      const dispatchId = toObjectId(params.dispatch_id);
      const gatepassId = toObjectId(params.gatepass_id);

      await qrModels.master.updateOne(
        {
          dispatch_id: dispatchId,
        },
        {
          $set: {
            ...req['updateObj'],
            gatepass_id: gatepassId,
          },
        }
      );

      await qrModels.item.updateOne(
        {
          dispatch_id: dispatchId,
        },
        {
          $set: {
            ...req['updateObj'],
            gatepass_id: gatepassId,
          },
        }
      );

      await qrModels.box.updateOne(
        {
          dispatch_id: dispatchId,
        },
        {
          $set: {
            ...req['updateObj'],
            gatepass_id: gatepassId,
          },
        }
      );

      return this.res.success('SUCCESS.UPDATE');
    } catch (error) {
      return this.res.error(HttpStatus.BAD_REQUEST, 'ERROR.BAD_REQ', error);
    }
  }

  async masterBoxLinkedToGatepass(req: Request, params: any): Promise<any> {
    try {
      const orgId = req['user']['org_id'];
      const qrModels = {
        master: this.orgMasterBoxQrcodeModel(orgId),
      };

      const dispatchIds = Array.isArray(params.dispatch_id)
        ? params.dispatch_id.map(id => toObjectId(id))
        : [toObjectId(params.dispatch_id)];

      const master_box = await qrModels.master.find({ dispatch_id: { $in: dispatchIds } });
      return master_box;
    } catch (error) {
      return this.res.error(HttpStatus.BAD_REQUEST, 'ERROR.BAD_REQ', error);
    }
  }

  async manualDispatch(req: any, params: any): Promise<any> {
    const orgId = req['user']['org_id'];
    const qrModels = {
      master: this.orgMasterBoxQrcodeModel(orgId),
    };

    const dispatchData = {
      dispatch_id: params.dispatch_data._id,
      dispatch_from: params.dispatch_data.dispatch_from,
      billing_company: params.dispatch_data.billing_company,
      customer_id: params.dispatch_data.customer_id,
      customer_type_id: params.dispatch_data.customer_type_id,
      customer_type_name: params.dispatch_data.customer_type_name,
      customer_name: params.dispatch_data.customer_name,
      customer_mobile: params.dispatch_data.mobile,
      order_date: params.dispatch_data.order_date,
      order_id: params.dispatch_data.order_id,
      order_no: params.dispatch_data.order_no,
      qr_master_box_code: params.master_box,
      qr_master_box_id: toObjectId(params.master_box_id)
    };

    const checkUpdate = await qrModels.master.findOne({
      qr_master_box_code: params.master_box,
      $or: [{ order_id: null }, { order_id: { $exists: false } }],
    }).lean();

    if (!checkUpdate) {
      await qrModels.master.updateOne(
        { qr_master_box_code: params.master_box },
        {
          $set: { order_id: toObjectId(params.dispatch_data.order_id), order_no: params.dispatch_data.order_no }
        }
      );
    }

    const saveObj = {
      ...req['createObj'],
      ...dispatchData,
      product_id: params.dispatch_item.product_id
    };

    const newDispatch = new this.manualDispatchModel(saveObj);
    const savedDispatch = await newDispatch.save();

    if (savedDispatch) {
      return {
        statusMsg: "DISPATCH.ok",
        statusCode: HttpStatus.OK,
      };
    } else {
      return {
        statusMsg: "ERROR.INTERNAL_SERVER_ERROR",
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
      };
    }
  }
}
