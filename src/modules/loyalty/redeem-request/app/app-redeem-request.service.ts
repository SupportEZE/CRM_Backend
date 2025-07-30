import { Injectable, HttpStatus } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { RedeemRequestModel } from '../models/redeem-request.model';
import { Model } from 'mongoose';
import { ResponseService } from 'src/services/response.service';
import {
  toObjectId,
  appCommonFilters,
  nextSeq,
} from 'src/common/utils/common.utils';
import { CustomerKycDetailModel } from '../../../master/customer/default/models/customer-kyc-details.model';
import { CustomerBankDetailModel } from '../../../master/customer/default/models/customer-bank-detail.model';
import { GiftGalleryModel } from './../../gift-gallery/models/gift-gallery.model';
import { AppLedgerService } from '../../ledger/app/app-ledger.service';
import { NotificationService } from 'src/shared/rpc/notification.service';
import { GiftGalleryService } from '../../gift-gallery/web/gift-gallery.service';

@Injectable()
export class AppRedeemRequestService {
  constructor(
    @InjectModel(RedeemRequestModel.name)
    private redeemRequestModel: Model<RedeemRequestModel>,
    @InjectModel(CustomerKycDetailModel.name)
    private customerKycDetailModel: Model<CustomerKycDetailModel>,
    @InjectModel(CustomerBankDetailModel.name)
    private customerBankDetailModel: Model<CustomerBankDetailModel>,
    @InjectModel(GiftGalleryModel.name)
    private giftGalleryModel: Model<GiftGalleryModel>,
    private readonly appLedgerService: AppLedgerService,
    private readonly notificationService: NotificationService,
    private readonly giftGalleryService: GiftGalleryService,
    private readonly res: ResponseService,
  ) {}

  async create(req: Request, params: any): Promise<any> {
    try {
      const {
        _id,
        login_type_id,
        customer_type_id,
        customer_name,
        mobile,
        customer_type_name,
      } = req['user'];
      let { gift_id, claim_point, payment_mode } = params;
      const balance = await this.appLedgerService.balance(_id);
      if (balance < 1) {
        return this.res.error(
          HttpStatus.BAD_REQUEST,
          'REDEEM.INSUFFICIENT_BALANCE',
          'Insufficient Balance.',
        );
      }

      const giftDetail = await this.giftGalleryModel
        .findOne({
          _id: toObjectId(gift_id),
          status: global.STATUS[1],
        })
        .exec();

      if (!giftDetail) {
        return this.res.error(HttpStatus.BAD_REQUEST, 'REDEEM.NO_GIFT_FOUND');
      }

      let cashValue = 0;

      if (giftDetail.gift_type === global.GIFT_TYPE[1]) {
        const allowedPaymentModes = global.PAYMENT_MODE;
        if (!allowedPaymentModes.includes(payment_mode)) {
          return this.res.error(
            HttpStatus.BAD_REQUEST,
            'ERROR.BAD_REQ',
            'Invalid Payment Mode.',
          );
        }

        const kycStatus = await this.customerKycDetailModel
          .findOne({
            customer_id: _id,
            kyc_status: global.APPROVAL_STATUS[4],
          })
          .exec();

        if (!kycStatus) {
          return this.res.error(HttpStatus.CONFLICT, 'REDEEM.KYC_NOT_VERIFIED');
        }

        cashValue = giftDetail.point_value * claim_point;

        if (claim_point > balance) {
          return this.res.error(
            HttpStatus.CONFLICT,
            'REDEEM.INSUFFICIENT_BALANCE',
          );
        }
      } else if (
        giftDetail.gift_type === global.GIFT_TYPE[0] ||
        giftDetail.gift_type === global.GIFT_TYPE[2]
      ) {
        claim_point = giftDetail.point_value;
        if (claim_point > balance) {
          return this.res.error(
            HttpStatus.CONFLICT,
            'REDEEM.INSUFFICIENT_BALANCE',
          );
        }
      } else {
        return this.res.error(
          HttpStatus.BAD_REQUEST,
          'ERROR.BAD_REQ',
          'Invalid Gift Type',
        );
      }

      const seq = {
        modelName: this.redeemRequestModel,
        idKey: 'req_id',
        prefix: 'REQ',
      };

      const req_id = await nextSeq(req, seq);

      const redeemRequestData = {
        ...req['createObj'],
        req_id,
        gift_id: giftDetail._id,
        claim_point: claim_point,
        cash_value: cashValue ?? 0,
        point_value: giftDetail.point_value ?? 0,
        title: giftDetail.title,
        status: global.APPROVAL_STATUS[0],
        transfer_status: global.APPROVAL_STATUS[0],
        customer_id: _id,
        customer_name,
        customer_mobile: mobile,
        login_type_id,
        customer_type_id,
        customer_type_name,
        gift_type: giftDetail.gift_type,
        gift_shipping_address: params.gift_shipping_address,
        payment_mode,
        state: req['user']['state'],
        district: req['user']['district'],
      };

      if (giftDetail.gift_type === global.GIFT_TYPE[1]) {
        const bankDetails = await this.customerBankDetailModel
          .findOne({
            customer_id: _id,
          })
          .exec();

        if (!bankDetails) {
          if (params.payment_mode === global.PAYMENT_MODE_TYPE[1]) {
            return this.res.error(
              HttpStatus.NOT_FOUND,
              'REDEEM.BANK_DETAILS_NOT_FOUND',
            );
          } else {
            return this.res.error(
              HttpStatus.NOT_FOUND,
              'REDEEM.UPI_DETAILS_NOT_FOUND',
            );
          }
        }
        if (params.payment_mode === global.PAYMENT_MODE_TYPE[2]) {
          if (!bankDetails.upi_id || bankDetails.upi_id === '') {
            return this.res.error(
              HttpStatus.NOT_FOUND,
              'REDEEM.UPI_DETAILS_NOT_FOUND',
            );
          }
        }

        if (params.payment_mode === global.PAYMENT_MODE_TYPE[1]) {
          if (
            !bankDetails.account_no ||
            !bankDetails.ifsc_code ||
            !bankDetails.bank_name ||
            !bankDetails.beneficiary_name
          ) {
            return this.res.error(
              HttpStatus.NOT_FOUND,
              'REDEEM.BANK_DETAILS_NOT_FOUND',
            );
          }

          if (
            bankDetails.account_no === '' ||
            bankDetails.ifsc_code === '' ||
            bankDetails.bank_name === '' ||
            bankDetails.beneficiary_name === ''
          ) {
            return this.res.error(
              HttpStatus.NOT_FOUND,
              'REDEEM.BANK_DETAILS_NOT_FOUND',
            );
          }
        }

        if (bankDetails) {
          redeemRequestData.account_no = bankDetails.account_no ?? '';
          redeemRequestData.ifsc_code = bankDetails.ifsc_code ?? '';
          redeemRequestData.bank_name = bankDetails.bank_name ?? '';
          redeemRequestData.beneficiary_name =
            bankDetails.beneficiary_name ?? '';
          redeemRequestData.upi_id = bankDetails.upi_id ?? '';
        }
      }

      const redeemRequest = new this.redeemRequestModel(redeemRequestData);
      const savedRequest = await redeemRequest.save();

      if (savedRequest._id) {
        const ledgerParams = {
          customer_id: _id,
          customer_name,
          login_type_id,
          customer_type_id,
          transaction_type: global.TRANSACTION_TYPE[1],
          points: claim_point,
          remark: `Points redeemed against redeem ID ${req_id}`,
          transaction_id: req_id + 'D',
          creation_type: global.CREATION_TYPE[1],
        };

        await this.appLedgerService.create(req, ledgerParams);
      } else {
        return this.res.error(
          HttpStatus.BAD_REQUEST,
          'ERROR.INTERNAL_SERVER_ERROR',
          'Failed to create redeem request.',
        );
      }
      return this.res.success('SUCCESS.CREATE');
    } catch (error) {
      return this.res.error(
        HttpStatus.BAD_REQUEST,
        'ERROR.BAD_REQ',
        error?.message || 'An unexpected error occurred.',
      );
    }
  }

  async read(req: Request, params: any): Promise<any> {
    try {
      if (params?.customer_id) {
        params.customer_id = toObjectId(params.customer_id);
      } else {
        params.customer_id = req['user']['_id'];
      }

      let match: Record<string, any> = {
        is_delete: 0,
        org_id: req['user']['org_id'],
        customer_id: params.customer_id,
      };
      let sorting: Record<string, 1 | -1> = { _id: -1 };
      if (params?.filters?.search) {
        const fieldsToSearch = ['customer_name', 'req_id'];
        const searchQuery = appCommonFilters(params.filters, fieldsToSearch);
        match = { ...match, ...searchQuery };
      }

      const page: number = Math.max(
        1,
        parseInt(params?.page, 10) || global.PAGE,
      );
      const limit: number = Math.max(
        1,
        parseInt(params?.limit, 10) || global.LIMIT,
      );
      const skip: number = (page - 1) * limit;

      let activetab = {};
      if (params.activeTab) {
        activetab = { gift_type: params.activeTab };
      }

      const gift = await this.redeemRequestModel.countDocuments({
        ...match,
        gift_type: global.GIFT_TYPE[0],
      });
      const cash = await this.redeemRequestModel.countDocuments({
        ...match,
        gift_type: global.GIFT_TYPE[1],
      });
      const voucher = await this.redeemRequestModel.countDocuments({
        ...match,
        gift_type: global.GIFT_TYPE[2],
      });

      match = { ...match, ...activetab };
      const result = await this.redeemRequestModel
        .find(match)
        .skip(skip)
        .sort(sorting)
        .limit(limit)
        .lean();

      const resultWithFiles = await Promise.all(
        result.map(async (item: any) => {
          item.files = await this.giftGalleryService.getDocument(
            toObjectId(item.gift_id),
            global.BIG_THUMBNAIL_IMAGE,
          );
          return item;
        }),
      );

      let total = 0;
      if (params.activeTab === global.GIFT_TYPE[0]) {
        total = gift;
      } else if (params.activeTab === global.GIFT_TYPE[1]) {
        total = cash;
      } else if (params.activeTab === global.GIFT_TYPE[2]) {
        total = voucher;
      }

      const finalresult: any = {
        result: resultWithFiles,
        activeTab: {
          gift_count: gift,
          cash_count: cash,
          voucher_count: voucher,
        },
      };

      return this.res.pagination(finalresult, total, page, limit);
    } catch (error) {
      return this.res.error(HttpStatus.BAD_REQUEST, 'ERROR.BAD_REQ', error);
    }
  }

  async detail(req: Request, params: any): Promise<any> {
    try {
      const match = { _id: toObjectId(params._id) };
      let redeem = await this.redeemRequestModel.findOne(match).lean();

      redeem['files'] = await this.giftGalleryService.getDocument(
        redeem.gift_id,
      );

      return this.res.success('SUCCESS.DETAIL', redeem);
    } catch (error) {
      return this.res.error(HttpStatus.BAD_REQUEST, 'ERROR.BAD_REQ', error);
    }
  }
}
