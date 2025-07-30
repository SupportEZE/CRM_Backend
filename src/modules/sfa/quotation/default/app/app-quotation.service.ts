import { HttpStatus, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { QuotationModel } from '../models/quotation.model';
import { ResponseService } from 'src/services/response.service';
import {
  commonSearchFilter,
  getCurrentYearMonthsRange,
  toObjectId,
} from 'src/common/utils/common.utils';
import { QuotationType } from '../web/dto/quotation.dto';
import { CustomerTypeModel } from 'src/modules/master/customer-type/models/customer-type.model';
import { CustomerTypeService } from 'src/modules/master/customer-type/web/customer-type.service';
@Injectable()
export class AppQuotationService {
  constructor(
    @InjectModel(QuotationModel.name)
    private quotationModel: Model<QuotationModel>,
    @InjectModel(CustomerTypeModel.name)
    private customerTypeModel: Model<CustomerTypeModel>,
    private readonly res: ResponseService,
    private readonly customerTypeService: CustomerTypeService,
  ) {}
  async read(req: Request, params: any): Promise<any> {
    try {
      let match: Record<string, any> = {
        is_delete: 0,
        org_id: req['user']['org_id'],
        created_id: req['user']['_id'],
      };

      const activeStatus = params.activeTab;
      if (
        ![
          global.QUOTATION_STATUS[1],
          global.QUOTATION_STATUS[2],
          global.QUOTATION_STATUS[3],
        ].includes(activeStatus)
      ) {
        return this.res.error(HttpStatus.BAD_REQUEST, 'ERROR.BAD_REQ');
      }

      Object.assign(
        match,
        commonSearchFilter(params?.filters, ['quotation_id', 'customer_name']),
      );

      if (activeStatus === global.QUOTATION_STATUS[1]) {
        match = { ...match, status: global.QUOTATION_STATUS[1] };
      } else if (activeStatus === global.QUOTATION_STATUS[2]) {
        match = { ...match, status: global.QUOTATION_STATUS[2] };
      } else if (activeStatus === global.QUOTATION_STATUS[3]) {
        match = { ...match, status: global.QUOTATION_STATUS[3] };
      }

      const page: number = params?.page || global.PAGE;
      const limit: number = params?.limit || global.LIMIT;
      const skip: number = (page - 1) * limit;

      const res: Record<string, any>[] = await this.quotationModel
        .find(match)
        .skip(skip)
        .limit(limit);

      const approvedCount: number = await this.quotationModel.countDocuments({
        ...match,
        status: global.QUOTATION_STATUS[1],
      });
      const pendingCount: number = await this.quotationModel.countDocuments({
        ...match,
        status: global.QUOTATION_STATUS[2],
      });
      const rejectCount: number = await this.quotationModel.countDocuments({
        ...match,
        status: global.QUOTATION_STATUS[3],
      });

      const result: Record<string, any> = res.map(
        ({ _doc, cart_item = [] }) => ({
          ..._doc,
          total_item: cart_item.length,
          total_qty: cart_item.reduce((sum, { qty = 0 }) => sum + qty, 0),
        }),
      );

      const data: any = {
        result,
        activeTab: {
          approved_count: approvedCount,
          pending_count: pendingCount,
          reject_count: rejectCount,
        },
      };

      let total = 0;
      if (activeStatus === global.QUOTATION_STATUS[1]) {
        total = approvedCount;
      } else if (activeStatus === global.QUOTATION_STATUS[2]) {
        total = pendingCount;
      } else if (activeStatus === global.QUOTATION_STATUS[3]) {
        total = rejectCount;
      }
      return this.res.pagination(data, total, page, limit);
    } catch (error) {
      return this.res.error(HttpStatus.BAD_REQUEST, 'ERROR.BAD_REQ', error);
    }
  }

  async detail(req: Request, params: any): Promise<any> {
    try {
      const match: Record<string, any> = {
        org_id: req['user']['org_id'],
        is_delete: 0,
        _id: toObjectId(params._id),
      };
      const result: Record<string, any> = await this.quotationModel
        .findOne(match)
        .lean();
      if (!result)
        return this.res.error(HttpStatus.BAD_REQUEST, 'ERROR.NOT_FOUND');

      const cart_item = result.cart_item || [];
      const total_item = cart_item.length;
      const total_qty = cart_item.reduce((sum, { qty = 0 }) => sum + qty, 0);

      result.total_item = total_item;
      result.total_qty = total_qty;
      return this.res.success('SUCCESS.FETCH', result);
    } catch (error) {
      return this.res.error(HttpStatus.BAD_REQUEST, 'ERROR.BAD_REQ', error);
    }
  }

  async updateStage(req: Request, params: any): Promise<any> {
    try {
      const { _id, stage, reason } = params;
      const exist: Record<string, any> = await this.quotationModel
        .findOne({ _id, is_delete: 0 })
        .exec();
      if (!exist)
        return this.res.error(HttpStatus.BAD_REQUEST, 'ERROR.NOT_FOUND');

      const updateObj: Record<string, any> = {
        stage,
        ...(reason !== undefined && { reason }),
      };
      await this.quotationModel
        .findOneAndUpdate({ _id: params._id }, updateObj, { new: true })
        .exec();

      await this.quotationModel.updateOne({ _id: params._id }, updateObj);
      return this.res.success('SUCCESS.UPDATE');
    } catch (error) {
      return this.res.error(HttpStatus.BAD_REQUEST, 'ERROR.BAD_REQ', error);
    }
  }

  async customerWiseQuotation(req: Request, params: any): Promise<any> {
    try {
      const orgId: number = req['user']['org_id'];
      let match: Record<string, any> = {
        org_id: orgId,
        is_delete: 0,
        created_id: req['user']['_id'],
      };

      params.login_type_ids = [
        global.LOGIN_TYPE_ID['SUB_PRIMARY'],
        global.LOGIN_TYPE_ID['PRIMARY'],
        global.LOGIN_TYPE_ID['SECONDARY'],
        global.LOGIN_TYPE_ID['INFLUENCER'],
      ];
      params.internalCall = true;

      const [enquiryCount, siteCount, customerTypes] = await Promise.all([
        this.quotationModel.countDocuments({
          ...match,
          quotation_type: QuotationType.Enquiry,
        }),
        this.quotationModel.countDocuments({
          ...match,
          quotation_type: QuotationType.Site,
        }),
        this.customerTypeService.readDropdown(req, params),
      ]);

      const customer_count = await Promise.all(
        customerTypes.map(async ({ value, label }: any) => {
          const count = await this.quotationModel.countDocuments({
            org_id: orgId,
            is_delete: 0,
            customer_type_id: toObjectId(value),
          });

          return {
            value: value,
            label: label,
            count,
          };
        }),
      );

      return this.res.success('SUCCESS.FETCH', {
        enquiryCount,
        siteCount,
        customer_count,
      });
    } catch (error) {
      return this.res.error(HttpStatus.BAD_REQUEST, 'ERROR.BAD_REQ', error);
    }
  }
}
