import { Injectable, HttpStatus } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { RedeemRequestModel } from '../models/redeem-request.model';
import { Model } from 'mongoose';
import { ResponseService } from 'src/services/response.service';
import { toObjectId, commonFilters } from 'src/common/utils/common.utils';
import { CustomerBankDetailModel } from 'src/modules/master/customer/default/models/customer-bank-detail.model';
import { TransferStatus } from './dto/redeem-request.dto';
import { LedgerService } from '../../ledger/web/ledger.service';
import { NotificationService } from 'src/shared/rpc/notification.service';
import { GiftGalleryVoucherModel } from '../../gift-gallery/models/gift-gallery-vouchers.model';
import { GiftGalleryModel } from '../../gift-gallery/models/gift-gallery.model';

const enum source {
  STATUS = 'status',
  TRANSFER = 'transfer',
}
const enum apiName {
  STATUS = 'status',
  TRANSFER = 'transfer',
}
@Injectable()
export class RedeemRequestService {
  constructor(
    @InjectModel(RedeemRequestModel.name)
    private redeemRequestModel: Model<RedeemRequestModel>,
    @InjectModel(CustomerBankDetailModel.name)
    private customerBankDetailModel: Model<CustomerBankDetailModel>,
    @InjectModel(GiftGalleryVoucherModel.name)
    private giftGalleryVoucherModel: Model<GiftGalleryVoucherModel>,
    @InjectModel(GiftGalleryModel.name)
    private giftGalleryModel: Model<GiftGalleryModel>,
    private readonly res: ResponseService,
    private readonly notificationService: NotificationService,
    private readonly ledgerService: LedgerService,
  ) {}

  async read(req: any, params: any): Promise<any> {
    try {
      let match = {};
      if (params._id) {
        match = {
          is_delete: 0,
          org_id: req['user']['org_id'],
          customer_id: toObjectId(params._id),
        };
      } else {
        match = { is_delete: 0, org_id: req['user']['org_id'] };
      }
      const filters = params?.filters || {};

      let redeemTypeFilter = {};
      if (params.redeemType) {
        redeemTypeFilter = { gift_type: params.redeemType };
      }

      const statusCounters: any = {};
      const statuses = global.REDEEM_REQUEST_STATUS;
      for (const status of statuses) {
        const statusCount = await this.redeemRequestModel.countDocuments({
          ...match,
          ...redeemTypeFilter,
          status: status,
        });
        statusCounters[status] = statusCount;
      }

      let statusFilter = {};
      if (params.activeTab) {
        statusFilter = { status: params.activeTab };
      }

      match = {
        ...match,
        ...commonFilters(filters),
        ...statusFilter,
        ...redeemTypeFilter,
      };

      const page: number = params?.page || global.PAGE;
      const limit: number = params?.limit || global.LIMIT;
      const skip: number = (page - 1) * limit;

      const total = await this.redeemRequestModel.countDocuments(match);
      const redeem = await this.redeemRequestModel
        .find(match)
        .sort({ created_at: 1 })
        .skip(skip)
        .limit(limit)
        .exec();

      const data: any = {
        redeem: redeem,
        statusCounters: statusCounters,
      };

      return this.res.pagination(data, total, page, limit);
    } catch (error) {
      return this.res.error(HttpStatus.BAD_REQUEST, 'ERROR.BAD_REQ', error);
    }
  }

  async status(req: Request, params: any): Promise<any> {
    try {
      const exist = await this.redeemRequestModel.findById(params._id).exec();
      if (!exist) {
        return this.res.error(
          HttpStatus.CONFLICT,
          'WARNING.ALREADY_EXIST',
          'Request not found.',
        );
      }

      const updateObj = {
        ...req['updateObj'],
        ...params,
      };

      const status = await this.redeemRequestModel.updateOne(
        { _id: params._id },
        { $set: updateObj },
      );

      if (status) {
        if (params.status === 'Reject') {
          const ledgerParams = {
            customer_id: exist.customer_id,
            customer_name: exist.customer_name,
            login_type_id: exist.login_type_id,
            customer_type_id: exist.customer_type_id,
            transaction_type: global.TRANSACTION_TYPE[1],
            points: exist.claim_point,
            remark: `${exist.claim_point} point(s) credited against redeem request reject.`,
            transaction_id: exist.req_id + 'c',
            creation_type: global.CREATION_TYPE[6],
          };

          await this.ledgerService.create(req, ledgerParams);
        }
      }

      params.template_id = 2;
      params.account_ids = [
        {
          account_ids: exist.customer_id,
          login_type_id: exist.login_type_id,
        },
      ];

      params.variables = {
        status: params.status,
      };
      params.push_notify = true;
      params.in_app = true;

      this.notificationService.notify(req, params);
      return this.res.success('SUCCESS.UPDATE');
    } catch (error) {
      return this.res.error(
        HttpStatus.BAD_REQUEST,
        'ERROR.BAD_REQ',
        error?.message || 'An unexpected error occurred.',
      );
    }
  }
  async transfer(req: Request, params: any): Promise<any> {
    try {
      const exist = await this.redeemRequestModel.findById(params._id).exec();
      if (!exist) {
        return this.res.error(
          HttpStatus.CONFLICT,
          'ERROR.BAD_REQ',
          'Request id not found.',
        );
      }
      const gift = await this.giftGalleryModel.findById(exist.gift_id).exec();
      params.gift_type = global.GIFT_TYPE[0];

      if (
        exist.gift_type === global.GIFT_TYPE[1] &&
        params.transfer_status === TransferStatus.Transfered
      ) {
        const bankDetails = await this.customerBankDetailModel
          .findOne({
            customer_id: exist.customer_id,
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
        if (exist.payment_mode === global.PAYMENT_MODE_TYPE[2]) {
          if (!bankDetails.upi_id || bankDetails.upi_id === '') {
            return this.res.error(
              HttpStatus.NOT_FOUND,
              'REDEEM.UPI_DETAILS_NOT_FOUND',
            );
          }
        }

        if (exist.payment_mode === global.PAYMENT_MODE_TYPE[1]) {
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
        params.gift_type = global.GIFT_TYPE[1];
      }
      let vouchers: any;
      if (
        exist.gift_type === global.GIFT_TYPE[2] &&
        params.transfer_status === TransferStatus.Transfered
      ) {
        vouchers = await this.giftGalleryVoucherModel
          .findOne({
            voucher_type_id: gift.voucher_type_id,
            is_delete: 0,
            org_id: req['user']['org_id'],
            customer_id: { $exists: false },
          })
          .exec();

        if (!vouchers) {
          return this.res.error(
            HttpStatus.NOT_FOUND,
            'REDEEM.NO_VOUCHER_FOUND',
          );
        }

        params.gift_type = global.GIFT_TYPE[2];
      }

      const updateObj = {
        ...req['updateObj'],
        ...params,
        voucher_code: vouchers?.voucher_code ?? '',
      };

      const redeem = await this.redeemRequestModel.updateOne(
        { _id: params._id },
        { $set: updateObj },
      );

      if (
        redeem &&
        vouchers &&
        exist.gift_type === global.GIFT_TYPE[2] &&
        params.transfer_status === TransferStatus.Transfered
      ) {
        const updatevoucherObj = {
          ...req['updateObj'],
          login_type_id: exist.login_type_id,
          customer_type_id: exist.customer_type_id,
          customer_type_name: exist.customer_type_name,
          customer_id: exist.customer_id,
          customer_name: exist.customer_name,
          redeem_id: exist._id,
          req_id: exist.req_id,
        };

        const voucherUpdate = await this.giftGalleryVoucherModel.updateOne(
          { _id: vouchers._id },
          { $set: updatevoucherObj },
        );
      }

      params.template_id = 1;
      params.account_ids = [
        {
          account_ids: exist.customer_id,
          login_type_id: exist.login_type_id,
        },
      ];

      params.variables = {
        status: params.transfer_status,
      };
      params.push_notify = true;
      params.in_app = true;

      this.notificationService.notify(req, params);
      return this.res.success('SUCCESS.UPDATE');
    } catch (error) {
      return this.res.error(HttpStatus.BAD_REQUEST, 'ERROR.BAD_REQ', error);
    }
  }

  async giftRecived(req: Request, params: any): Promise<any> {
    try {
      const exist = await this.redeemRequestModel.findById(params._id).exec();
      if (!exist) {
        return this.res.error(
          HttpStatus.BAD_REQUEST,
          'ERROR.BAD_REQ',
          'Request not found.',
        );
      }

      const updateObj = {
        ...req['updateObj'],
        recieved_date: new Date(),
      };

      await this.redeemRequestModel.updateOne(
        { _id: params._id },
        { $set: updateObj },
      );

      return this.res.success('SUCCESS.UPDATE');
    } catch (error) {
      return this.res.error(HttpStatus.BAD_REQUEST, 'ERROR.BAD_REQ', error);
    }
  }
}
