import { Injectable, HttpStatus } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { ResponseService } from 'src/services/response.service';
import { AppLedgerService } from '../../ledger/app/app-ledger.service';
import { Model } from 'mongoose';
import { COLLECTION_CONST } from 'src/config/collection.constant';
import { ScanQrcodeModel, ScanQrcodeSchema } from '../models/scan-qrcode.model';
import { ItemQrcodeModel, ItemQrcodeSchema } from '../models/item-qrcode.model';
import { QrcodeRuleModel } from '../models/scan-qrcode-rules.model';
import { BoxQrcodeModel, BoxQrcodeSchema } from '../models/box-qrcode.model';
import { ProductModel } from 'src/modules/master/product/models/product.model';
import { CustomerModel } from 'src/modules/master/customer/default/models/customer.model';
import { BonusType } from 'src/modules/master/referral-bonus/web/dto/referral-bonus.dto';
import { CustomerTypeModel } from 'src/modules/master/customer-type/models/customer-type.model';
import {
  PointCatQrcodeModel,
  PointCatQrcodeSchema,
} from '../models/point-cat-qrcode.model';
import { PointCategoryModel } from 'src/modules/master/point-category/models/point-category.model';
import { PointCategoryMapModel } from 'src/modules/master/point-category/models/point-category-map.model';
import { ReferralBonusModel } from 'src/modules/master/referral-bonus/models/referral-bonus.model';
import { BonusModel } from '../../bonus/models/bonus.model';
import { BonusPointCategoryModel } from '../../bonus/models/bonu-point-category.model';
import {
  toObjectId,
  getFirstDayOfMonth,
  getLastDayOfMonth,
  appCommonFilters,
} from 'src/common/utils/common.utils';
import {
  QrcodeGeneratorModel,
  QrcodeGeneratorSchema,
} from '../models/qrcode-generator.model';
import { InsideBannerService } from 'src/shared/inside-banner/inside-banner.service';
import { DB_NAMES } from 'src/config/db.constant';

@Injectable()
export class AppQrcodeService {
  constructor(
    @InjectModel(ScanQrcodeModel.name, DB_NAMES().COUPON_DB)
    private DyanamicScanQrcodeModel: Model<ScanQrcodeModel>,
    @InjectModel(ItemQrcodeModel.name, DB_NAMES().COUPON_DB)
    private dynamicItmeQrcodeModel: Model<ItemQrcodeModel>,
    @InjectModel(QrcodeGeneratorModel.name, DB_NAMES().COUPON_DB)
    private dynamicQrcodeGeneratorModel: Model<QrcodeGeneratorModel>,
    @InjectModel(BoxQrcodeModel.name, DB_NAMES().COUPON_DB)
    private dynamicBoxQrcodeModel: Model<BoxQrcodeModel>,
    @InjectModel(QrcodeRuleModel.name)
    private qrcodeRuleModel: Model<QrcodeRuleModel>,
    @InjectModel(ProductModel.name) private productModel: Model<ProductModel>,
    @InjectModel(CustomerModel.name)
    private customerModel: Model<CustomerModel>,
    @InjectModel(CustomerTypeModel.name)
    private customerTypeModel: Model<CustomerTypeModel>,
    @InjectModel(PointCategoryModel.name)
    private pointCatModel: Model<PointCategoryModel>,
    @InjectModel(PointCategoryMapModel.name)
    private pointCatMapModel: Model<PointCategoryMapModel>,
    @InjectModel(BonusModel.name) private bonusModel: Model<BonusModel>,
    @InjectModel(ReferralBonusModel.name)
    private referralBonusModel: Model<ReferralBonusModel>,
    @InjectModel(BonusPointCategoryModel.name)
    private bonusPointCategoryModel: Model<BonusPointCategoryModel>,

    private readonly res: ResponseService,
    private readonly appLedgerService: AppLedgerService,
    private readonly insideBannerService: InsideBannerService,
  ) {}

  private orgQrcodeGeneratorModel(orgId: string): Model<QrcodeGeneratorModel> {
    const couponCollectionName = `${COLLECTION_CONST().CRM_QRCODES_GENERATOR}_${orgId}`;
    return this.dynamicQrcodeGeneratorModel.db.model<QrcodeGeneratorModel>(
      QrcodeGeneratorModel.name,
      QrcodeGeneratorSchema,
      couponCollectionName,
    );
  }

  private orgItemQrcodeModel(orgId: string): Model<ItemQrcodeModel> {
    const couponCollectionName = `${COLLECTION_CONST().CRM_ITEM_QRCODES}_${orgId}`;
    return this.dynamicItmeQrcodeModel.db.model<ItemQrcodeModel>(
      ItemQrcodeModel.name,
      ItemQrcodeSchema,
      couponCollectionName,
    );
  }

  private orgBoxQrcodeModel(orgId: string): Model<BoxQrcodeModel> {
    const couponCollectionName = `${COLLECTION_CONST().CRM_BOX_QRCODES}_${orgId}`;
    return this.dynamicBoxQrcodeModel.db.model<BoxQrcodeModel>(
      BoxQrcodeModel.name,
      BoxQrcodeSchema,
      couponCollectionName,
    );
  }

  private orgPointCatQrcodeModel(orgId: string): Model<PointCatQrcodeModel> {
    const couponCollectionName = `${COLLECTION_CONST().CRM_POINT_CAT_QRCODES}_${orgId}`;
    return this.dynamicItmeQrcodeModel.db.model<PointCatQrcodeModel>(
      PointCatQrcodeModel.name,
      PointCatQrcodeSchema,
      couponCollectionName,
    );
  }

  private orgScanQrcodeModel(orgId: string): Model<ScanQrcodeModel> {
    const couponCollectionName = `${COLLECTION_CONST().CRM_SCAN_QRCODES}_${orgId}`;
    return this.DyanamicScanQrcodeModel.db.model<ScanQrcodeModel>(
      ScanQrcodeModel.name,
      ScanQrcodeSchema,
      couponCollectionName,
    );
  }

  async insideBanner(req: Request, params: any): Promise<any> {
    params.banner_name = global.INSIDE_BANNER[4];
    const inside_banner = await this.insideBannerService.read(req, params);

    return this.res.success('SUCCESS.FETCH', inside_banner);
  }

  async create(req: Request, params: any): Promise<any> {
    try {
      const {
        org_id: orgId,
        login_type_id: loginTypeId,
        _id: customerId,
        customer_type_id: customerTypeId,
      } = req['user'];
      const qrCode = params.qr_code;
      let qrData;

      const qrModels = {
        generator: this.orgQrcodeGeneratorModel(orgId),
        item: this.orgItemQrcodeModel(orgId),
        pointCat: this.orgPointCatQrcodeModel(orgId),
        box: this.orgBoxQrcodeModel(orgId),
        scan: this.orgScanQrcodeModel(orgId),
      };

      const customer = await this.customerModel
        .findOne({
          _id: customerId,
          profile_status: global.APPROVAL_STATUS[1],
          is_delete: 0,
        })
        .exec();

      if (!customer)
        return this.res.error(HttpStatus.FORBIDDEN, 'QR.CUSTOMER_NOT_ACTIVE');

      const customerType = await this.customerTypeModel
        .findOne({
          _id: customer.customer_type_id,
          is_delete: 0,
        })
        .exec();

      if (!customerType)
        return this.res.error(
          HttpStatus.FORBIDDEN,
          'QR.CUSTOMER_TYPE_NOT_DEFINED',
        );

      let qrType = global.QRCODE_TYPE[3];
      qrData = await qrModels.pointCat
        .findOne({ qr_item_code: qrCode, is_delete: 0 })
        .exec();

      if (!qrData) {
        qrType = global.QRCODE_TYPE[1];
        qrData = await qrModels.item
          .findOne({ qr_item_code: qrCode, is_delete: 0 })
          .exec();
      }

      if (!qrData) {
        qrType = global.QRCODE_TYPE[2];
        qrData = await qrModels.box
          .findOne({ qr_box_code: qrCode, is_delete: 0 })
          .exec();
      }

      if (!qrData)
        return this.res.error(HttpStatus.NOT_FOUND, 'QR.QR_NOT_FOUND');

      const qrHistory = await qrModels.generator
        .findOne({ _id: qrData.qrcode_genrator_id })
        .exec();
      if (!qrHistory)
        return this.res.error(HttpStatus.NOT_FOUND, 'QR.HISTORY_NOT_FOUND');

      if (!customerType.allowed_qr_type.includes(qrType)) {
        return this.res.error(
          HttpStatus.FORBIDDEN,
          'QR.SCANNING_QR_NOT_ALLOWED',
        );
      }

      if (qrHistory.status === global.STATUS[0]) {
        return this.res.error(HttpStatus.FORBIDDEN, 'QR.SCANNING_INACTIVE');
      }

      const scanRule = await this.qrcodeRuleModel
        .findOne({
          org_id: orgId,
          qrcode_type: qrType,
          is_delete: 0,
        })
        .exec();

      if (scanRule) {
        const sharedTypes = (scanRule.shared_customer_type_ids || []).map(
          (id) => id.toString(),
        );

        if (sharedTypes.includes(customerTypeId.toString())) {
          const filteredSharedTypes = sharedTypes
            .filter((id) => id !== customerTypeId.toString())
            .map((id) => toObjectId(id));

          const existingSharedScan = await qrModels.scan
            .findOne({
              qr_id: qrData._id,
              is_delete: 0,
              customer_type_id: { $in: filteredSharedTypes },
            })
            .exec();

          if (existingSharedScan) {
            return this.res.error(
              HttpStatus.BAD_REQUEST,
              'QR.ALREADY_SCANNED_GROUP',
            );
          }
        }
      }

      const scanDateQuery =
        customerType.scan_limit_type === global.SCAN_LIMIT_TYPE[2]
          ? {
              scanned_date: {
                $gte: getFirstDayOfMonth(),
                $lte: getLastDayOfMonth(),
              },
            }
          : customerType.scan_limit_type === global.SCAN_LIMIT_TYPE[1]
            ? { scanned_date: new Date() }
            : null;

      if (!scanDateQuery)
        return this.res.error(
          HttpStatus.BAD_REQUEST,
          'QR.SCAN_LIMIT_UNDEFINED',
        );

      const scanCount = await qrModels.scan
        .countDocuments({
          is_delete: 0,
          org_id: orgId,
          ...scanDateQuery,
        })
        .exec();

      let boxItems: any[] = [];

      if ([global.QRCODE_TYPE[1], global.QRCODE_TYPE[3]].includes(qrType)) {
        if (scanCount + 1 > customerType.scan_limit) {
          return this.res.error(HttpStatus.FORBIDDEN, 'QR.LIMIT_REACHED');
        }

        const [scannedByUser, scannedByType] = await Promise.all([
          qrModels.scan
            .findOne({
              qr_id: qrData._id,
              is_delete: 0,
              scanned_id: customerId,
            })
            .exec(),
          qrModels.scan
            .findOne({
              qr_id: qrData._id,
              is_delete: 0,
              customer_type_id: customerTypeId,
            })
            .exec(),
        ]);

        if (scannedByUser)
          return this.res.error(HttpStatus.CONFLICT, 'QR.ALREADY_SCANNED');
        if (scannedByType)
          return this.res.error(
            HttpStatus.CONFLICT,
            'QR.ALREADY_SCANNED_BY_TYPE',
          );
      } else if (qrType === global.QRCODE_TYPE[2]) {
        boxItems = await qrModels.item
          .find({ qr_box_code: qrCode, is_delete: 0 })
          .exec();

        if (scanCount + boxItems.length > customerType.scan_limit) {
          return this.res.error(HttpStatus.FORBIDDEN, 'QR.LIMIT_REACHED');
        }

        for (const item of boxItems) {
          const [scannedByUser, scannedByType] = await Promise.all([
            qrModels.scan
              .findOne({
                qr_id: item._id,
                is_delete: 0,
                scanned_id: customerId,
              })
              .exec(),
            qrModels.scan
              .findOne({
                qr_id: item._id,
                is_delete: 0,
                customer_type_id: customerTypeId,
              })
              .exec(),
          ]);

          if (scannedByUser)
            return this.res.error(
              HttpStatus.CONFLICT,
              'QR.SOME_ITEMS_SCANNED_BY_SELF',
            );
          if (scannedByType)
            return this.res.error(
              HttpStatus.CONFLICT,
              'QR.SOME_ITEMS_SCANNED_BY_TYPE',
            );
        }
      } else {
        return this.res.error(HttpStatus.BAD_REQUEST, 'QR.QR_TYPE_NOT_FOUND');
      }

      let response;
      switch (qrType) {
        case global.QRCODE_TYPE[1]:
          response = await this.scanItemQrcodes(req, params, qrData);
          break;
        case global.QRCODE_TYPE[2]:
          response = await this.scanBoxQrcodes(req, params, qrData, boxItems);
          break;
        case global.QRCODE_TYPE[3]:
          response = await this.scanPointCatQrcodes(req, params, qrData);
          break;
        default:
          return this.res.error(HttpStatus.FORBIDDEN, 'QR.QR_TYPE_NOT_FOUND');
      }

      return response.statusCode === HttpStatus.OK
        ? this.res.success(response.statusMsg, response.data)
        : this.res.error(response.statusCode, response.statusMsg);
    } catch (error) {
      return this.res.error(HttpStatus.BAD_REQUEST, 'ERROR.BAD_REQ', error);
    }
  }

  async scanItemQrcodes(
    req: Request,
    params: any,
    qrExist: any,
    combined_ledger: boolean = false,
  ): Promise<any> {
    try {
      const {
        org_id: orgId,
        login_type_id: loginTypeId,
        _id: customerId,
        customer_type_id: customerTypeId,
        customer_type_name: customerTypeName,
        mobile: customerMobile,
        customer_name: customerName,
        state,
      } = req['user'];

      const { qr_code: qrCode, is_manual_scan, lattitude, longitude } = params;
      const orgScanQrcodeModel = this.orgScanQrcodeModel(orgId);

      const pointCategoryMap = await this.pointCatMapModel
        .findOne({ product_id: qrExist.product_id })
        .exec();
      if (!pointCategoryMap) {
        return {
          statusCode: HttpStatus.BAD_REQUEST,
          statusMsg: 'QR.POINT_CAT_NOT_FOUND',
        };
      }

      const pointCategory = await this.pointCatModel
        .findOne({ _id: pointCategoryMap.point_category_id })
        .exec();
      if (!pointCategory) {
        return {
          statusCode: HttpStatus.BAD_REQUEST,
          statusMsg: 'QR.POINT_CATEGORY_NOT_MAPPED',
        };
      }

      const matchedPoint = pointCategory.point.find(
        (p: any) => p.customer_type_id.toString() === customerTypeId.toString(),
      );

      if (!matchedPoint) {
        return {
          statusCode: HttpStatus.BAD_REQUEST,
          statusMsg: 'QR.POINT_CAT_NOT_FOUND',
        };
      }

      const product = await this.productModel
        .findOne({ _id: qrExist.product_id })
        .exec();

      const bonus = await this.bonus(req, pointCategory._id);
      const referral = await this.referral(req, customerId);

      const referralPoints = referral.final_point || 0;
      const referralfrom = referral.customer_refree || '';

      const bonusPoints = bonus.bonus_point || 0;
      const bonus_id = bonus.bonus_id || '';

      let scan_type = global.QRCODE_TYPE[1];

      if (combined_ledger === true) {
        scan_type = global.QRCODE_TYPE[2];
      }

      const scanEntry = {
        ...req['createObj'],
        ...params,
        scanned_id: customerId,
        scanned_name: customerName,
        qr_id: qrExist._id,
        qr_code: qrCode,
        box_qr_code: qrExist.qr_box_code,
        qrcode_type: global.QRCODE_TYPE[1],
        scan_type: scan_type,
        total_points: matchedPoint.point_value,
        bonus_points: bonusPoints,
        bonus_id: bonus_id,
        point_category_id: pointCategory._id,
        point_category_name: pointCategory.point_category_name,
        login_type_id: loginTypeId,
        customer_type_id: customerTypeId,
        customer_type_name: customerTypeName,
        customer_mobile: customerMobile,
        product_id: qrExist.product_id,
        product_name: product?.product_name || '',
        product_code: product?.product_code || '',
        transaction_id: `${qrCode}${loginTypeId}${customerTypeId}${customerId}`,
        state,
        is_manual_scan,
        lattitude,
        longitude,
      };

      const scanResult = await new orgScanQrcodeModel(scanEntry).save();
      if (!scanResult) {
        return {
          statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
          statusMsg: 'QR.INTERNAL_SERVER_ERROR',
        };
      }

      if (combined_ledger === false) {
        const ledgerParams = {
          customer_id: customerId,
          customer_name: customerName,
          login_type_id: loginTypeId,
          customer_type_id: customerTypeId,
          transaction_type: global.TRANSACTION_TYPE[0],
          points: matchedPoint.point_value,
          remark: `${matchedPoint.point_value} Point credited against coupon code ${qrCode}`,
          transaction_id: qrCode,
          creation_type: global.CREATION_TYPE[2],
        };

        await this.appLedgerService.create(req, ledgerParams);

        if (bonusPoints > 0) {
          const bonusLedgerParams = {
            customer_id: customerId,
            customer_name: customerName,
            login_type_id: loginTypeId,
            customer_type_id: customerTypeId,
            transaction_type: global.TRANSACTION_TYPE[0],
            points: bonus.bonus_point,
            remark: `${bonus.bonus_point} Point credited against bonus id ${bonus.bonus_id}`,
            transaction_id: `${qrCode}-${bonus.bonus_id}`,
            creation_type: global.CREATION_TYPE[3],
          };

          await this.appLedgerService.create(req, bonusLedgerParams);
        }

        if (referral > 0) {
          const updateObj: Record<string, any> = {
            ...req['updateObj'],
            invitation: true,
          };

          const update = await this.customerModel.updateOne(
            { _id: params._id },
            updateObj,
          );

          const referralLedgerParams = {
            customer_id: customerId,
            customer_name: customerName,
            login_type_id: loginTypeId,
            customer_type_id: customerTypeId,
            transaction_type: global.TRANSACTION_TYPE[0],
            points: bonus.bonus_point,
            remark: `${referral.referralPoints} Point credited against referral to  ${referral.customer_refree.customer_name}`,
            transaction_id: ``,
            creation_type: global.CREATION_TYPE[12],
          };

          await this.appLedgerService.create(req, referralLedgerParams);
        }
      }

      return {
        statusCode: HttpStatus.OK,
        statusMsg: 'QR.SUCCESS_SCAN',
        total_points: matchedPoint.point_value,
        bonus_points: bonusPoints,
        bonus_id: bonus.bonus_id ?? '',
        point_cat_id: pointCategory._id,
        point_cat_name: pointCategory.point_category_name,
        product_name: product?.product_name || '',
        product_code: product?.product_code || '',
      };
    } catch (error) {
      return {
        statusCode: HttpStatus.BAD_REQUEST,
        statusMsg: 'ERROR.BAD_REQ',
        error,
      };
    }
  }

  async scanPointCatQrcodes(
    req: Request,
    params: any,
    qrExist: any,
  ): Promise<any> {
    try {
      const {
        org_id: orgId,
        login_type_id: loginTypeId,
        _id: customerId,
        customer_type_id: customerTypeId,
        customer_type_name: customerTypeName,
        customer_name: customerName,
        mobile: customerMobile,
        state,
      } = req['user'];

      const { qr_code: qrCode, is_manual_scan, lattitude, longitude } = params;
      const orgScanQrcodeModel = this.orgScanQrcodeModel(orgId);

      const pointCategory = await this.pointCatModel
        .findOne({ _id: qrExist.point_category_id })
        .exec();
      if (!pointCategory) {
        return {
          statusCode: HttpStatus.BAD_REQUEST,
          statusMsg: 'QR.POINT_CATEGORY_NOT_MAPPED',
        };
      }

      const matchedPoint = pointCategory.point.find(
        (p: any) => p.customer_type_id.toString() === customerTypeId.toString(),
      );

      if (!matchedPoint) {
        return {
          statusCode: HttpStatus.BAD_REQUEST,
          statusMsg: 'QR.POINT_NOT_DEFINED',
        };
      }

      const bonus = await this.bonus(req, pointCategory._id);
      const referral = await this.referral(req, customerId);

      const referralPoints = referral.final_point || 0;
      const referralfrom = referral.customer_refree || '';
      const bonusPoints = bonus.bonus_point || 0;
      const bonus_id = bonus.bonus_id || '';

      const scanEntry = {
        ...req['createObj'],
        ...params,
        scanned_id: customerId,
        scanned_name: customerName,
        qr_id: qrExist._id,
        qr_code: qrCode,
        qrcode_type: global.QRCODE_TYPE[3],
        scan_type: global.QRCODE_TYPE[3],
        total_points: matchedPoint.point_value,
        bonus_points: bonusPoints,
        bonus_id: bonus_id,
        point_category_id: pointCategory._id,
        point_category_name: pointCategory.point_category_name,
        login_type_id: loginTypeId,
        customer_type_id: customerTypeId,
        customer_type_name: customerTypeName,
        customer_mobile: customerMobile,
        transaction_id: `${qrCode}${loginTypeId}${customerTypeId}${customerId}`,
        state,
        is_manual_scan,
        lattitude,
        longitude,
      };

      const scanSaved = await new orgScanQrcodeModel(scanEntry).save();
      if (!scanSaved) {
        return {
          statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
          statusMsg: 'QR.INTERNAL_SERVER_ERROR',
        };
      }

      const ledgerParams = {
        customer_id: customerId,
        customer_name: customerName,
        login_type_id: loginTypeId,
        customer_type_id: customerTypeId,
        transaction_type: global.TRANSACTION_TYPE[0],
        points: matchedPoint.point_value,
        remark: `${matchedPoint.point_value} Point credited against coupon code ${qrCode}`,
        transaction_id: qrCode,
        creation_type: global.CREATION_TYPE[2],
      };

      await this.appLedgerService.create(req, ledgerParams);

      if (bonusPoints > 0) {
        const bonusLedgerParams = {
          customer_id: customerId,
          customer_name: customerName,
          login_type_id: loginTypeId,
          customer_type_id: customerTypeId,
          transaction_type: global.TRANSACTION_TYPE[0],
          points: bonusPoints,
          remark: `${bonusPoints} Point credited against bonus id ${bonus.bonus_id}`,
          transaction_id: `${qrCode}-${bonus.bonus_id}`,
          creation_type: global.CREATION_TYPE[3],
        };

        await this.appLedgerService.create(req, bonusLedgerParams);
      }

      if (referral > 0) {
        const updateObj: Record<string, any> = {
          ...req['updateObj'],
          invitation: true,
        };

        const update = await this.customerModel.updateOne(
          { _id: params._id },
          updateObj,
        );

        const referralLedgerParams = {
          customer_id: customerId,
          customer_name: customerName,
          login_type_id: loginTypeId,
          customer_type_id: customerTypeId,
          transaction_type: global.TRANSACTION_TYPE[0],
          points: bonus.bonus_point,
          remark: `${referral.referralPoints} Point credited against referral to  ${referral.customer_refree.customer_name}`,
          transaction_id: ``,
          creation_type: global.CREATION_TYPE[12],
        };

        await this.appLedgerService.create(req, referralLedgerParams);
      }

      return {
        statusCode: HttpStatus.OK,
        statusMsg: 'QR.SUCCESS_SCAN',
        total_points: matchedPoint.point_value,
      };
    } catch (error) {
      return {
        statusCode: HttpStatus.BAD_REQUEST,
        statusMsg: 'ERROR.BAD_REQ',
        error,
      };
    }
  }

  async scanBoxQrcodes(
    req: Request,
    params: any,
    qrExist: any,
    boxItems: any[],
  ): Promise<any> {
    try {
      const combined_ledger = true;

      const {
        org_id: orgId,
        login_type_id: loginTypeId,
        _id: customerId,
        customer_type_id: customerTypeId,
        customer_type_name: customerTypeName,
        mobile: customerMobile,
        customer_name: customerName,
        state,
      } = req['user'];

      const box_qr_code = params.qr_code;

      let final_points = 0;
      let bonus_points = 0;
      let bonus_id = '';

      for (const item of boxItems) {
        const scanParams = {
          ...params,
          qr_code: item.qr_item_code,
        };

        const result = await this.scanItemQrcodes(
          req,
          scanParams,
          item,
          combined_ledger,
        );

        if (result.statusCode !== HttpStatus.OK) {
          return {
            statusCode: result.statusCode,
            statusMsg: `QR.SCAN_FAILED_FOR_ITEM: ${item.qr_item_code} — ${result.statusMsg}`,
          };
        }

        const pointsToAdd = Number(result.total_points) || 0;
        final_points += pointsToAdd;

        const bonusPointsToAdd = Number(result.bonus_points) || 0;
        bonus_points += bonusPointsToAdd;
        bonus_id = result.bonus_id;
      }

      const ledgerParams = {
        customer_id: customerId,
        customer_name: customerName,
        login_type_id: loginTypeId,
        customer_type_id: customerTypeId,
        transaction_type: global.TRANSACTION_TYPE[0],
        points: final_points,
        remark: `${final_points} Point credited against coupon code ${box_qr_code}`,
        transaction_id: box_qr_code,
        creation_type: global.CREATION_TYPE[2],
      };

      await this.appLedgerService.create(req, ledgerParams);

      if (bonus_points > 0) {
        const bonusLedgerParams = {
          customer_id: customerId,
          customer_name: customerName,
          login_type_id: loginTypeId,
          customer_type_id: customerTypeId,
          transaction_type: global.TRANSACTION_TYPE[0],
          points: bonus_points,
          remark: `${bonus_points} Point credited against bonus id ${bonus_id}`,
          transaction_id: `${box_qr_code}-${bonus_id}`,
          creation_type: global.CREATION_TYPE[3],
        };

        await this.appLedgerService.create(req, bonusLedgerParams);
      }

      return {
        statusCode: HttpStatus.OK,
        statusMsg: 'QR.SUCCESS_SCAN',
      };
    } catch (error) {
      return {
        statusCode: HttpStatus.BAD_REQUEST,
        statusMsg: 'ERROR.BAD_REQ',
        error,
      };
    }
  }

  async bonus(req: Request, point_id: any): Promise<any> {
    try {
      const {
        org_id: orgId,
        login_type_id: loginTypeId,
        customer_type_id: customerTypeId,
        state,
        district,
      } = req['user'];

      const nowUtc = new Date();
      let bonus_point = 0;
      let bonus_id: any;

      const match = {
        org_id: orgId,
        start_date: { $lte: nowUtc },
        end_date: { $gte: nowUtc },
        state: { $in: [state] },
        district: { $in: [district] },
        customer_type_id: { $in: [customerTypeId.toString()] },
        status: global.STATUS[1],
      };

      const bonus = await this.bonusModel.findOne(match).lean();

      if (bonus) {
        bonus_id = bonus._id;
        const match_point_cat = {
          bonus_id: bonus._id,
          point_category_id: point_id,
        };
        const bonus_point_cat = await this.bonusPointCategoryModel
          .findOne(match_point_cat)
          .lean();
        bonus_point = bonus_point_cat?.point_category_value || 0;
      }

      return { bonus_point, bonus_id };
    } catch (error) {
      throw error;
    }
  }

  async referral(req: Request, customerId: any): Promise<any> {
    try {
      let customer_refree = {};
      let points: any;
      let final_point = 0;
      const customer = await this.customerModel
        .findOne({ _id: customerId })
        .lean();
      if (customer.invitation === true) {
        return { final_point, customer_refree };
      }
      if (customer.form_data.referral_code) {
        customer_refree = await this.customerModel
          .findOne({ invitation_code: customer.form_data.referral_code })
          .lean();

        points = await this.referralBonusModel
          .findOne({
            bonus_type: BonusType.INVITE_FRIENDS,
            org_id: req['user']['org_id'],
            login_type_id: req['user']['login_type_id'],
            customer_type_id: toObjectId(req['user']['customer_type_id']),
            status: global.STATUS[1],
          })
          .lean();
        if (points) {
          final_point = points.bonus_point;
        }
      }
      return { final_point, customer_refree };
    } catch (error) {
      throw error;
    }
  }

  async readScanQr(req: Request, params: any): Promise<any> {
    try {
      const orgId = req['user']['org_id'];
      const orgScanQrcodeModel = this.orgScanQrcodeModel(orgId);

      if (params?.customer_id) {
        params.scanned_id = toObjectId(params.customer_id);
      } else {
        params.scanned_id = req['user']['_id'];
      }
      let match: Record<string, any> = {
        is_delete: 0,
        scanned_id: params.scanned_id,
      };
      let sorting: Record<string, 1 | -1> = { _id: -1 };

      if (params?.filters?.search) {
        const fieldsToSearch = ['qr_code'];
        const searchQuery = appCommonFilters(params.filters, fieldsToSearch);
        match = { ...match, ...searchQuery };
      }

      const page = Math.max(1, parseInt(params?.page) || global.PAGE);
      const limit = Math.max(1, parseInt(params?.limit) || global.LIMIT);
      const skip = (page - 1) * limit;

      const total = await orgScanQrcodeModel.countDocuments(match);
      const data = await orgScanQrcodeModel
        .find(match)
        .sort(sorting)
        .skip(skip)
        .limit(limit)
        .lean();

      return this.res.pagination(data, total, page, limit);
    } catch (error) {
      return this.res.error(
        HttpStatus.BAD_REQUEST,
        'ERROR.BAD_REQ',
        error?.message || 'An error occurred while fetching data.',
      );
    }
  }
}
