import { HttpStatus, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import {
  OzoneQuotationModel,
  OzoneQuotatioStatus,
} from '../models/ozone-quotation.model';
import { ResponseService } from 'src/services/response.service';
import {
  calculatePercentage,
  commonFilters,
  commonSearchFilter,
  getCurrentYearMonthsRange,
  nextSeq,
  readTemplateFile,
  toObjectId,
} from 'src/common/utils/common.utils';
import { PdfService } from 'src/shared/rpc/pdf.service';
import { SharedCustomerService } from 'src/modules/master/customer/shared-customer.service';
import { GlobalService } from 'src/shared/global/global.service';
import { QuotationType } from './dto/ozone-quotation.dto';
import { DB_NAMES } from 'src/config/db.constant';
import { S3Service } from 'src/shared/rpc/s3.service';
import { newOzoneQuotationDocsModel } from '../models/ozone-quotation-docs.mode';
import { OzoneEnquiryModel } from '../../../enquiry/ozone/models/ozone-enquiry.model';
import { OzoneEnquiryService } from '../../../enquiry/ozone/web/ozone-enquiry.service';
import { COLLECTION_CONST } from 'src/config/collection.constant';
import { SharedUserService } from 'src/modules/master/user/shared-user.service';

@Injectable()
export class OzoneQuotationService {
  constructor(
    @InjectModel(OzoneQuotationModel.name, DB_NAMES().CUSTOM_DB)
    private ozoneQuotationModel: Model<OzoneQuotationModel>,
    @InjectModel(OzoneEnquiryModel.name, DB_NAMES().CUSTOM_DB)
    private OzoneEnquiryModel: Model<OzoneEnquiryModel>,
    @InjectModel(newOzoneQuotationDocsModel.name, DB_NAMES().CUSTOM_DB)
    private ozoneQuotationDocsModel: Model<newOzoneQuotationDocsModel>,
    private readonly res: ResponseService,
    private readonly pdfService: PdfService,
    private readonly sharedCustomerService: SharedCustomerService,
    private readonly sharedUserService: SharedUserService,
    private readonly globalService: GlobalService,
    private readonly ozoneEnquiryService: OzoneEnquiryService,
    private readonly s3Service: S3Service,
  ) {}

  async create(req: any, params: any): Promise<any> {
    try {
      if (
        params.quotation_type === QuotationType.Enquiry ||
        params.quotation_type === QuotationType.Site
      ) {
        delete params.customer_type_name;
        delete params.customer_type_id;
      }

      const seq = {
        modelName: this.ozoneQuotationModel,
        idKey: 'quotation_id',
        prefix: 'QUOT',
      };
      const newQuotationId = await nextSeq(req, seq);

      if (params.quotation_type === QuotationType.Customer) {
        params.customer_type_id = toObjectId(params.customer_type_id);
      }

      params.customer_id = toObjectId(params.customer_id);

      let saveObj: Record<string, any> = {
        ...req['createObj'],
        ...params,
        quotation_id: newQuotationId,
      };
      saveObj.cart_item = saveObj.cart_item.map((item) => ({
        ...item,
        product_id: toObjectId(item.product_id),
        mrp: item.mrp ?? 0,
        total_Amount: item.total_Amount ?? item.qty * item.mrp,
        discount_value: item.discount_value ?? 0,
        Price_after_discount:
          item.Price_after_discount ??
          (item.total_Amount ?? item.qty * item.mrp) -
            (item.discount_value ?? 0),
      }));
      saveObj.status = 'Pending';

      const enquiryId = toObjectId(params.enquiry_id);
      params.enquiryId = enquiryId;
      const distributorId =
        await this.ozoneEnquiryService.getEnquiryDistributor(req, params);

      if (distributorId) {
        saveObj.distributor_id = distributorId;
      }

      const document = new this.ozoneQuotationModel(saveObj);
      const insert = await document.save();

      if (!insert || !insert._id) {
        return this.res.error(HttpStatus.BAD_REQUEST, 'ERROR.BAD_REQ');
      }

      const enquiryExists = await this.OzoneEnquiryModel.findOne({
        _id: enquiryId,
        is_delete: 0,
      }).lean();

      if (enquiryExists) {
        await this.ozoneEnquiryService.statusUpdate(req, {
          _id: params.enquiry_id,
          status: 'Quotation',
          remarks: params.remarks,
          followup_date: params.followup_date,
          created_by_type: req.user?.login_type,
          assign_to_user_id: req.user?._id,
          assign_to_user_name: req.user?.name,
          technical_designation: req.user?.technical_designation,
          platform: params.platform,
          app_id: params.app_id,
        });
      }
      return this.res.success('SUCCESS.CREATE', { inserted_id: insert._id });
    } catch (error) {
      return this.res.error(HttpStatus.BAD_REQUEST, 'ERROR.BAD_REQ', error);
    }
  }

  async read(req: Request, params: any): Promise<any> {
    try {
      const orgId: number = req['user']['org_id'];
      const match: Record<string, any> = {
        is_delete: 0,
        org_id: orgId,
      };

      const filters: Record<string, any> = commonFilters(params?.filters);
      const activeStatus = params.activeTab;

      if (
        ![
          OzoneQuotatioStatus.PENDING,
          OzoneQuotatioStatus.WIN,
          OzoneQuotatioStatus.LOST,
        ].includes(activeStatus)
      ) {
        return this.res.error(HttpStatus.BAD_REQUEST, 'ERROR.BAD_REQ');
      }

      const finalMatch: Record<string, any> = {
        ...match,
        ...filters,
        status: activeStatus,
      };

      const countBaseMatch: Record<string, any> = {
        ...match,
        ...filters,
      };

      if (
        global.LOGIN_TYPE_ID_PERMISSION?.includes(req['user']['login_type_id'])
      ) {
        const userIds: any[] = await this.sharedUserService.getUsersIds(
          req,
          params,
        );
        // countBaseMatch.created_id = { $in: userIds };

        const enquiryAssigned =
          await this.ozoneEnquiryService.getAssignedEnquiries(req, params);

        finalMatch.$or = [
          { created_id: { $in: userIds } },
          { enquiry_id: { $in: enquiryAssigned.map((e) => e._id.toString()) } },
        ];

        countBaseMatch.$or = [
          { created_id: { $in: userIds } },
          { enquiry_id: { $in: enquiryAssigned.map((e) => e._id.toString()) } },
        ];
      }

      const page: number = params?.page || global.PAGE;
      const limit: number = params?.limit || global.LIMIT;
      const skip: number = (page - 1) * limit;

      const quotations = await this.ozoneQuotationModel.aggregate([
        {
          $match: finalMatch,
        },
        {
          $lookup: {
            from: COLLECTION_CONST().CRM_OZONE_ENQUIRY,
            let: { enquiryIdStr: '$enquiry_id' },
            pipeline: [
              {
                $match: {
                  $expr: {
                    $eq: ['$_id', { $toObjectId: '$$enquiryIdStr' }],
                  },
                },
              },
              {
                $project: {
                  _id: 1,
                  enquiry_id: 1,
                  quotation_number: 1,
                  created_at: 1,
                  company_name: '$enquiry_data.company_name',
                  state: '$enquiry_data.state',
                  city: '$enquiry_data.city',
                  pincode: '$enquiry_data.pincode',
                  type: '$enquiry_data.customer_type',
                },
              },
            ],
            as: 'enquiry_data',
          },
        },
        {
          $unwind: {
            path: '$enquiry_data',
            preserveNullAndEmptyArrays: true,
          },
        },
        {
          $sort: {
            created_at: -1,
          },
        },
        {
          $skip: skip,
        },
        {
          $limit: limit,
        },
      ]);

      const result = quotations.map((doc: any) => {
        const cartItems = doc.cart_item || [];
        const totalItem = cartItems.length;
        const totalQty = cartItems.reduce(
          (sum: number, item: any) => sum + (item.qty || 0),
          0,
        );

        return {
          _id: doc._id,
          status: doc.status,
          quotation_id: doc.quotation_id,
          enquiry_id: doc.enquiry_id,
          created_name: doc.created_name,
          created_at: doc.created_at,
          updated_at: doc.updated_at,
          total_item: totalItem,
          total_qty: totalQty,
          total_amount: doc.total_amount ?? 0,
        };
      });

      const [win_count, pending_count, lost_count] = await Promise.all([
        this.ozoneQuotationModel.countDocuments({
          ...countBaseMatch,
          status: OzoneQuotatioStatus.WIN,
        }),
        this.ozoneQuotationModel.countDocuments({
          ...countBaseMatch,
          status: OzoneQuotatioStatus.PENDING,
        }),
        this.ozoneQuotationModel.countDocuments({
          ...countBaseMatch,
          status: OzoneQuotatioStatus.LOST,
        }),
      ]);

      let total = 0;
      if (activeStatus === OzoneQuotatioStatus.WIN) total = win_count;
      else if (activeStatus === OzoneQuotatioStatus.PENDING)
        total = pending_count;
      else if (activeStatus === OzoneQuotatioStatus.LOST) total = lost_count;

      const data: any = {
        result,
        activeTab: { win_count, pending_count, lost_count },
      };
      return this.res.pagination(data, total, page, limit);
    } catch (error) {
      return this.res.error(HttpStatus.BAD_REQUEST, 'ERROR.BAD_REQ', error);
    }
  }

  async detail(req: Request, params: any): Promise<any> {
    try {
      const quotationId = new Types.ObjectId(params._id);
      const orgId = req['user']['org_id'];

      const quotations = await this.ozoneQuotationModel.aggregate([
        {
          $match: {
            _id: quotationId,
            org_id: orgId,
            is_delete: 0,
          },
        },
        {
          $lookup: {
            from: COLLECTION_CONST().CRM_OZONE_ENQUIRY,
            let: { enquiryIdStr: '$enquiry_id' },
            pipeline: [
              {
                $match: {
                  $expr: {
                    $eq: ['$_id', { $toObjectId: '$$enquiryIdStr' }],
                  },
                },
              },
              {
                $project: {
                  created_at: 1,
                  quotation_id: 1,
                  contact_number: 1,
                  company_name: 1,
                  customer_name: 1,
                  email: 1,
                  city: 1,
                  state: 1,
                  pincode: 1,
                  customer_type: 1,
                },
              },
            ],
            as: 'customer_details',
          },
        },
        {
          $unwind: {
            path: '$customer_details',
            preserveNullAndEmptyArrays: true,
          },
        },
      ]);

      const quotation = quotations[0];

      if (!quotation) {
        return this.res.error(HttpStatus.BAD_REQUEST, 'ERROR.NOT_FOUND');
      }
      params.user_id = quotation.created_id;
      let quotationCreatorUser = await this.sharedUserService.getUsersByIds(
        req,
        params,
      );

      params.customer_id = quotation.created_id;
      let quotationCreatorCustomer = {
        customer_name: '',
        email: '',
        mobile: '',
      };
      if (!quotationCreatorUser) {
        quotationCreatorCustomer =
          await this.sharedCustomerService.getCustomersByIds(req, params);
      }

      // 4. Merge into result
      const result = {
        ...quotation,
        created_name:
          quotationCreatorUser?.[0]?.name ||
          quotationCreatorCustomer.customer_name,
        created_email:
          quotationCreatorUser?.[0]?.email || quotationCreatorCustomer.email,
        created_mobile:
          quotationCreatorUser?.[0]?.mobile || quotationCreatorCustomer.mobile,
      };

      const cartItems = quotation?.cart_item || [];
      result.total_quantity = cartItems.reduce(
        (sum, item) => sum + (item.qty || 0),
        0,
      );
      result.total_items = cartItems.length;
      result.files = await this.getDocument(result._id, global.THUMBNAIL_IMAGE);

      return this.res.success('SUCCESS.FETCH', result);
    } catch (error) {
      return this.res.error(HttpStatus.BAD_REQUEST, 'ERROR.BAD_REQ', error);
    }
  }
  async addItem(req: Request, params: any): Promise<any> {
    try {
      const match: Record<string, any> = {
        org_id: req['user']['org_id'],
        _id: params._id,
      };
      const exist: Record<string, any> = await this.ozoneQuotationModel
        .findOne(match)
        .lean();
      if (!exist)
        return this.res.error(HttpStatus.BAD_REQUEST, 'ERROR.NOT_FOUND');

      const cartItems = params.cart_item;
      const updateObj: Record<string, any> = {
        cart_item: cartItems,
        sub_total: params.sub_total,
        total_discount: params.total_discount,
        gst: params.gst,
        total_amount: params.total_amount,
        ...req['updateObj'],
      };
      updateObj.cart_item = updateObj.cart_item.map((item) => ({
        ...item,
        product_id: toObjectId(item.product_id),
      }));
      await this.ozoneQuotationModel.updateOne({ _id: params._id }, updateObj);
      return this.res.success('SUCCESS.UPDATE');
    } catch (error) {
      return this.res.error(HttpStatus.BAD_REQUEST, 'ERROR.BAD_REQ', error);
    }
  }

  async updateStatus(req: Request, params: any): Promise<any> {
    try {
      let match: Record<string, any>;
      match = {
        org_id: req['user']['org_id'],
        _id: toObjectId(params._id),
      };
      let exist: Record<string, any> = await this.ozoneQuotationModel
        .findOne(match)
        .lean();
      if (!exist)
        return this.res.error(HttpStatus.BAD_REQUEST, 'ERROR.NOT_FOUND');

      const updateObj: Record<string, any> = {
        ...req['updateObj'],
        ...params,
      };

      params.enquiry_id = exist.enquiry_id;

      await this.ozoneQuotationModel.updateOne(
        { _id: toObjectId(params._id) },
        updateObj,
      );

      await this.ozoneEnquiryService.enquiryQuotationStatusUpdate(req, params);
      return this.res.success('SUCCESS.UPDATE');
    } catch (error) {
      return this.res.error(HttpStatus.BAD_REQUEST, 'ERROR.BAD_REQ', error);
    }
  }

  async delete(req: any, params: any): Promise<any> {
    try {
      let match: any = { _id: toObjectId(params._id) };
      const exist = await this.ozoneQuotationModel.findOne(match).exec();
      if (!exist)
        return this.res.error(HttpStatus.BAD_REQUEST, 'WARNING.NOT_EXIST');
      if (params?.is_delete && exist['is_delete'] === params?.is_delete)
        return this.res.error(HttpStatus.BAD_REQUEST, 'WARNING.ALREADY_DELETE');
      const updateObj: Record<string, any> = {
        ...req['updateObj'],
        ...params,
      };
      await this.ozoneQuotationModel.updateOne({ _id: params._id }, updateObj);
      return this.res.success('SUCCESS.DELETE');
    } catch (error) {
      return this.res.error(HttpStatus.BAD_REQUEST, 'ERROR.BAD_REQ', error);
    }
  }

  async readDashboardCount(req: Request, params: any): Promise<any> {
    try {
      const user = req['user'];
      const orgId: number = user['org_id'];
      const userId = user['_id'];

      let match: Record<string, any> = {
        is_delete: 0,
        org_id: orgId,
      };

      if (req?.url.includes(global.MODULE_ROUTES[23])) {
        match.created_id = userId;
      }

      const stageKeys = ['win', 'lost', 'negotiation'] as const;
      const stageMap = {
        win: global.QUOTATION_STAGES[1],
        lost: global.QUOTATION_STAGES[2],
        negotiation: global.QUOTATION_STAGES[3],
      };

      const statusMatch = {
        approved: { ...match, status: global.QUOTATION_STATUS[1] },
        rejected: { ...match, status: global.QUOTATION_STATUS[3] },
      };

      const getCount = (match: any) =>
        this.ozoneQuotationModel.countDocuments(match).exec();
      const getAmount = (match: any, groupBy: string) =>
        this.aggregateData(match, groupBy, 'total_amount');

      const stagePromises = stageKeys.map((key) => {
        const stageMatch = { ...match, stage: stageMap[key] };
        return Promise.all([
          getCount(stageMatch),
          getAmount(stageMatch, 'stage'),
        ]);
      });

      const [
        [win_count, total_win_amount],
        [lost_count, total_lost_amount],
        [negotiation_count, total_negotiation_amount],
      ] = await Promise.all(stagePromises);

      const [
        approved_count,
        reject_count,
        total_approved_amount,
        total_reject_amount,
      ] = await Promise.all([
        getCount(statusMatch.approved),
        getCount({ ...match, stage: stageMap.lost }),
        getAmount(statusMatch.approved, 'status'),
        getAmount(statusMatch.rejected, 'status'),
      ]);

      const [total_count, total_amount] = await Promise.all([
        getCount(match),
        getAmount(match, 'org_id'),
      ]);

      const coversion_percentage = calculatePercentage(win_count, total_count);

      return this.res.success('SUCCESS.FETCH', {
        approved_count,
        total_approved_amount,
        win_count,
        total_win_amount,
        lost_count,
        total_lost_amount,
        negotiation_count,
        total_negotiation_amount,
        reject_count,
        total_reject_amount,
        total_count,
        total_amount,
        coversion_percentage,
      });
    } catch (error) {
      return this.res.error(HttpStatus.BAD_REQUEST, 'ERROR.BAD_REQ', error);
    }
  }

  async aggregateData(
    match: Record<string, any>,
    groupBy: string,
    sumField: string | number = 1,
  ): Promise<number> {
    try {
      const pipeline: any[] = [
        { $match: match },
        {
          $group: {
            _id: `$${groupBy}`,
            total_amount:
              typeof sumField === 'number'
                ? { $sum: sumField }
                : { $sum: `$${sumField}` },
          },
        },
      ];

      const result = await this.ozoneQuotationModel.aggregate(pipeline).exec();

      if (!result || result.length === 0) {
        return 0;
      }
      return result.reduce((acc, curr) => acc + (curr.total_amount || 0), 0);
    } catch (error) {
      throw error;
    }
  }

  async exportPdf(req: Request, params: any): Promise<any> {
    try {
      const match: Record<string, any> = {
        org_id: req['user']['org_id'],
        is_delete: 0,
        _id: toObjectId(params._id),
      };

      const data: Record<string, any> = await this.ozoneQuotationModel
        .findOne(match)
        .exec();
      if (!data)
        return this.res.error(HttpStatus.BAD_REQUEST, 'ERROR.NOT_FOUND');

      const formatCurrency = (num: number) => `${num.toFixed(2)}`;

      const quotationData = {
        company_name: req['user']['org_name'],
        company_address: '123 Business Road, City, Country',
        company_email: 'info@yourcompany.com',
        company_phone: '+123456789',
        customer_name: data['customer_name'],
        customer_company: data['customer_name'],
        customer_email: '',
        quotation_date: new Date(data['created_at'])
          .toISOString()
          .split('T')[0],
        quotation_number: data['quotation_id'],
        items: data['cart_item'].map((item: any) => ({
          product_name: item.product_name,
          quantity: item.qty,
          unit_price: formatCurrency(item.price),
          total_price: formatCurrency(item.total_price),
          discount_percent: formatCurrency(item.discount_percent),
          gst_percent: formatCurrency(item.gst_percent),
          sub_total: formatCurrency(item.sub_total),
          net_amount: formatCurrency(item.net_amount),
        })),
        sub_total: formatCurrency(data['sub_total']),
        total_gst: formatCurrency(data['gst']),
        grand_total: formatCurrency(data['total_amount']),
        validity_period: data['valid_upto']
          ? new Date(data['valid_upto']).toISOString().split('T')[0]
          : '',
        payment_term: data['payment_term'],
        note: data['note'],
      };
      const html = readTemplateFile('quotation', quotationData);

      const pdfObj: Record<string, any> = {
        html,
        module_id: global.MODULES['Quotation'],
        module_name: 'Quotation',
        filename: `${data.quotation_id}.pdf`,
      };
      const response = await this.pdfService.htmlPdf(req, pdfObj);
      return this.res.success('SUCCESS.FETCH', response);
    } catch (error) {
      return this.res.error(HttpStatus.BAD_REQUEST, 'ERROR.BAD_REQ', error);
    }
  }

  async readDashboardGraph(req: Request, params: any): Promise<any> {
    try {
      const monthRanges: Record<string, any>[] = getCurrentYearMonthsRange();
      let match: Record<string, any> = {
        is_delete: 0,
        org_id: req['user']['org_id'],
        status: global.QUOTATION_STATUS[1],
      };

      if (req?.url.includes(global.MODULE_ROUTES[23])) {
        match.created_id = req['user']['_id'];
      }
      const STAGES: string = global.QUOTATION_STAGES;
      const monthlyData: Record<string, any>[] = [];

      for (const month of monthRanges) {
        const dateMatch: Record<string, any> = {
          ...match,
          created_at: { $gte: month.start, $lte: month.end },
        };

        const total: number =
          await this.ozoneQuotationModel.countDocuments(dateMatch);
        const win: number = await this.ozoneQuotationModel.countDocuments({
          ...dateMatch,
          stage: STAGES[1],
        });
        const lost: number = await this.ozoneQuotationModel.countDocuments({
          ...dateMatch,
          stage: STAGES[2],
        });
        const negotiation: number =
          await this.ozoneQuotationModel.countDocuments({
            ...dateMatch,
            stage: STAGES[3],
          });

        monthlyData.push({
          month: month.monthName,
          approved: total,
          win,
          lost,
          negotiation,
        });
      }
      return this.res.success('SUCCESS.FETCH', { data: monthlyData });
    } catch (error) {
      return this.res.error(HttpStatus.BAD_REQUEST, 'ERROR.BAD_REQ', error);
    }
  }

  async upload(files: Express.Multer.File[], req: any): Promise<any> {
    try {
      req.body.module_name = Object.keys(global.MODULES).find(
        (key) => global.MODULES[key] === global.MODULES['Quotation'],
      );
      let response = await this.s3Service.uploadMultiple(
        files,
        req,
        this.ozoneQuotationDocsModel,
      );
      return this.res.success('SUCCESS.CREATE', response);
    } catch (error) {
      return this.res.error(
        HttpStatus.BAD_REQUEST,
        'Error uploading files to S3',
        error?.message || error,
      );
    }
  }

  async getDocument(
    id: any,
    type:
      | typeof global.FULL_IMAGE
      | typeof global.THUMBNAIL_IMAGE
      | typeof global.BIG_THUMBNAIL_IMAGE = global.FULL_IMAGE,
  ): Promise<any> {
    return this.s3Service.getDocumentsByRowId(
      this.ozoneQuotationDocsModel,
      id,
      type,
    );
  }

  async detail_by_enquiry(req: Request, params: any): Promise<any> {
    try {
      const match: Record<string, any> = {
        enquiry_id: params.enquiry_id,
        is_delete: 0,
      };
      if (req['user']?.org_id) {
        match.org_id = req['user']['org_id'];
      }
      const quotations = await this.ozoneQuotationModel
        .find(match)
        .lean()
        .exec();
      return this.res.success('SUCCESS.FETCH', quotations);
    } catch (error) {
      return this.res.error(HttpStatus.BAD_REQUEST, 'ERROR.BAD_REQ', error);
    }
  }
}
