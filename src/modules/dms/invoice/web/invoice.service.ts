import { HttpStatus, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { InvoiceModel } from '../models/invoice.model';
import { InvoicePaymentModel } from '../../payment/models/invoice-payment.model';
import { InvoiceItemModel } from '../models/invoice-item.model';
import { InvoiceDocsModel } from '../models/invoice-docs.model';
import mongoose, { Model, Types } from 'mongoose';
import { ResponseService } from 'src/services/response.service';
import { toObjectId, commonFilters, Like } from 'src/common/utils/common.utils';
import { isObject } from 'class-validator';
import { S3Service } from 'src/shared/rpc/s3.service';
import { CustomerModel } from 'src/modules/master/customer/default/models/customer.model';
import { SharedCustomerService } from 'src/modules/master/customer/shared-customer.service';
import { CustomerStockModel } from 'src/modules/dms/stock-transfer/models/company-customer-stock.model';
import { CustomerStockItemModel } from 'src/modules/dms/stock-transfer/models/company-customer-stock-item.model';
import * as moment from 'moment';

@Injectable()
export class InvoiceService {
  constructor(
    @InjectModel(InvoiceModel.name) private invoiceModel: Model<InvoiceModel>,
    @InjectModel(InvoicePaymentModel.name)
    private invoicePaymentModel: Model<InvoicePaymentModel>,
    @InjectModel(InvoiceItemModel.name)
    private invoiceItemModel: Model<InvoiceItemModel>,
    @InjectModel(InvoiceDocsModel.name)
    private invoiceDocsModel: Model<InvoiceDocsModel>,
    @InjectModel(CustomerModel.name)
    private customerModel: Model<CustomerModel>,
    @InjectModel(CustomerStockModel.name)
    private customerStockModel: Model<CustomerStockModel>,
    @InjectModel(CustomerStockItemModel.name)
    private customerStockItemModel: Model<CustomerStockItemModel>,

    private readonly res: ResponseService,
    private readonly s3Service: S3Service,
    private readonly sharedCustomerService: SharedCustomerService,
  ) {}

  async create(req: any, params: any): Promise<any> {
    try {
      const {
        customer_id,
        billing_date,
        customer_type_id,
        invoice_items = [],
      } = params;

      const org_id = req['user']['org_id'];

      // Check for existing billing for the same date & customer
      const match: Record<string, any> = {
        is_delete: 0,
        org_id,
        customer_id: toObjectId(customer_id),
        billing_date,
      };

      const existing = await this.invoiceModel.findOne(match).lean();
      if (existing) {
        return this.res.error(HttpStatus.BAD_REQUEST, 'WARNING.ALREADY_EXIST');
      }

      // Generate unique invoice number
      const latest = await this.invoiceModel
        .findOne({ org_id })
        .sort({ invoice_number: -1 })
        .lean();
      let newNumber = 1;
      if (latest?.invoice_number) {
        const lastNum = parseInt(latest.invoice_number.replace('INV', ''), 10);
        if (!isNaN(lastNum)) {
          newNumber = lastNum + 1;
        }
      }
      const invoice_number = `INV${String(newNumber).padStart(6, '0')}`;

      // Create invoice document
      const invoicePayload = {
        ...req['createObj'],
        ...params,
        org_id,
        invoice_number,
        customer_id: toObjectId(customer_id),
        customer_type_id: toObjectId(customer_type_id),
        billing_date: new Date(billing_date),
      };

      const invoiceDoc = new this.invoiceModel(invoicePayload);
      const savedInvoice = await invoiceDoc.save();

      // Create invoice items
      if (invoice_items.length > 0) {
        const itemPayload = invoice_items.map((item) => ({
          ...item,
          org_id,
          invoice_id: savedInvoice._id,
          product_id: toObjectId(item.product_id),
          ...req['createObj'],
        }));

        await this.invoiceItemModel.insertMany(itemPayload);
      }

      return this.res.success('SUCCESS.CREATE', {
        inserted_id: savedInvoice._id,
      });
    } catch (error) {
      return this.res.error(HttpStatus.BAD_REQUEST, 'ERROR.BAD_REQ', error);
    }
  }

  async read(req: Request, params: any): Promise<any> {
    try {
      let match: Record<string, any> = {
        is_delete: 0,
        org_id: req['user']['org_id'],
      };
      if (params._id) {
        match = { ...match, customer_id: toObjectId(params._id) };
      }
      let sorting: Record<string, 1 | -1> = { _id: -1 };

      if (params?.sorting && Object.keys(params.sorting).length !== 0) {
        sorting = params.sorting;
      }

      if (params?.activeTab && params.activeTab !== 'All') {
        match['grn_status'] = params.activeTab;
      }

      const filters: Record<string, any> = commonFilters(params?.filters);
      match = { ...match, ...filters };

      const page: number = params?.page || global.PAGE;
      const limit: number = params?.limit || global.LIMIT;
      const skip: number = (page - 1) * limit;

      const total = await this.invoiceModel.countDocuments(match);

      const allStatuses = ['Pending', 'Received', 'Reject', 'All'];

      const tabWiseCounts = await this.invoiceModel.aggregate([
        {
          $match: {
            is_delete: 0,
            org_id: req['user']['org_id'],
          },
        },
        {
          $group: {
            _id: '$grn_status',
            count: { $sum: 1 },
          },
        },
      ]);

      const rawStatusCounts = tabWiseCounts.reduce(
        (acc, cur) => {
          acc[cur._id] = cur.count;
          return acc;
        },
        {} as Record<string, number>,
      );

      const status_counts = allStatuses.reduce(
        (acc, status) => {
          acc[status] = rawStatusCounts[status] || 0;
          return acc;
        },
        {} as Record<string, number>,
      );

      status_counts['All'] = Object.values(status_counts).reduce(
        (a, b) => a + b,
        0,
      );

      const result = await this.invoiceModel
        .find(match)
        .skip(skip)
        .limit(limit)
        .sort(sorting)
        .lean();

      const resultWithExtras = await Promise.all(
        result.map(async (item) => {
          let customer_mobile = '';
          let paid_amount = '';
          let balance_amount = '';

          if (item.customer_id) {
            const customerInfo =
              await this.sharedCustomerService.fetchCustomerInfo(req, {
                customer_id: item.customer_id,
              });
            customer_mobile = customerInfo?.mobile || '';
          }

          return {
            ...item,
            customer_mobile,
            paid_amount,
            balance_amount,
          };
        }),
      );

      const data: any = {
        result: resultWithExtras,
        status_counts,
      };

      return this.res.pagination(data, total, page, limit);
    } catch (error) {
      return this.res.error(HttpStatus.BAD_REQUEST, 'ERROR.BAD_REQ', error);
    }
  }

  async readGraph(req: Request, params: any): Promise<any> {
    try {
      const orgId = req['user']['org_id'];
      const matchBase: Record<string, any> = {
        is_delete: 0,
        org_id: orgId,
      };

      if (params.customer_id) {
        matchBase.customer_id = toObjectId(params.customer_id);
      }

      const monthData: {
        month: string;
        invoice: number;
        payment: number;
      }[] = [];

      for (let i = 0; i < 12; i++) {
        const startOfMonth = moment()
          .utc()
          .startOf('month')
          .subtract(i, 'months');
        const endOfMonth = moment().utc().endOf('month').subtract(i, 'months');
        const monthName = startOfMonth.format('MMMM');

        const invoiceMonthlyMatch = {
          ...matchBase,
          billing_date: {
            $gte: startOfMonth.toDate(),
            $lte: endOfMonth.toDate(),
          },
        };

        const paymentMonthlyMatch = {
          ...matchBase,
          payment_date: {
            $gte: startOfMonth.toDate(),
            $lte: endOfMonth.toDate(),
          },
        };

        const [invoiceAgg, paymentAgg] = await Promise.all([
          this.invoiceModel.aggregate([
            { $match: invoiceMonthlyMatch },
            {
              $group: {
                _id: null,
                total_invoice: { $sum: '$net_amount_with_tax' },
              },
            },
          ]),
          this.invoicePaymentModel.aggregate([
            { $match: paymentMonthlyMatch },
            {
              $group: {
                _id: null,
                total_payment: { $sum: '$payment_amount' },
              },
            },
          ]),
        ]);

        const invoice = invoiceAgg[0]?.total_invoice || 0;
        const payment = paymentAgg[0]?.total_payment || 0;

        monthData.push({
          month: monthName,
          invoice,
          payment,
        });
      }

      const [overallInvoiceAgg, overallPaymentAgg] = await Promise.all([
        this.invoiceModel.aggregate([
          { $match: matchBase },
          {
            $group: {
              _id: null,
              total_invoice: { $sum: '$net_amount_with_tax' },
              total_invoice_count: { $sum: 1 },
            },
          },
        ]),
        this.invoicePaymentModel.aggregate([
          { $match: matchBase },
          {
            $group: {
              _id: null,
              total_payment: { $sum: '$payment_amount' },
              total_payment_count: { $sum: 1 },
            },
          },
        ]),
      ]);

      const overallInvoice = overallInvoiceAgg[0]?.total_invoice || 0;
      const overallPayment = overallPaymentAgg[0]?.total_payment || 0;
      const overallInvoiceCount =
        overallInvoiceAgg[0]?.total_invoice_count || 0;
      const overallPaymentCount =
        overallPaymentAgg[0]?.total_payment_count || 0;

      const response = {
        months: monthData.reverse(),
        totals: {
          total_invoice: overallInvoice,
          total_payment: overallPayment,
          total_invoice_count: overallInvoiceCount,
          total_payment_count: overallPaymentCount,
        },
      };

      return this.res.success('SUCCESS.FETCH', response);
    } catch (error) {
      return this.res.error(HttpStatus.BAD_REQUEST, 'ERROR.BAD_REQ', error);
    }
  }

  async detail(req: Request, params: any): Promise<any> {
    try {
      params._id = toObjectId(params._id);

      const match: Record<string, any> = {
        org_id: req['user']['org_id'],
        _id: params._id,
        is_delete: 0,
      };

      const result: Record<string, any> = await this.invoiceModel
        .findOne(match)
        .lean();
      if (!result)
        return this.res.error(HttpStatus.NOT_FOUND, 'ERROR.NOT_FOUND');

      result.item_info = await this.invoiceItemModel
        .find({ org_id: req['user']['org_id'], invoice_id: params._id })
        .lean();

      const contactList = await this.sharedCustomerService.getContactPerson(
        req,
        { customer_id: result.customer_id },
      );
      result.contact_person_name = contactList?.[0]?.contact_person_name || '';

      const customer_info = await this.sharedCustomerService.fetchCustomerInfo(
        req,
        { customer_id: result.customer_id },
      );

      result.customer_mobile = customer_info?.mobile || '';
      result.full_address = customer_info?.full_address || '';

      result.paid_amount = '';
      result.balance_amount = '';

      if (result._id) {
        result.files = await this.getDocument(
          result._id,
          global.THUMBNAIL_IMAGE,
        );
      }

      return this.res.success('SUCCESS.FETCH', result);
    } catch (error) {
      return this.res.error(HttpStatus.BAD_REQUEST, 'ERROR.BAD_REQ', error);
    }
  }

  async status(req: Request, params: any): Promise<any> {
    try {
      params._id = toObjectId(params._id);

      const exist = await this.invoiceModel
        .findOne({ _id: params._id, is_delete: 0 })
        .lean();
      if (!exist) return this.res.success('WARNING.NOT_EXIST');

      const updateObj = {
        ...req['updateObj'],
        grn_status: params.grn_status,
        remarks: params.remarks,
      };

      await this.invoiceModel.updateOne({ _id: params._id }, updateObj);

      if (params.grn_status === 'Received') {
        await this.insertCustomerStockOnGRNReceived(req, params._id);
      }

      return this.res.success('SUCCESS.STATUS_UPDATE');
    } catch (error) {
      return this.res.error(HttpStatus.BAD_REQUEST, 'ERROR.BAD_REQ', error);
    }
  }

  async insertCustomerStockOnGRNReceived(
    req: Request,
    bill_id: Types.ObjectId,
  ): Promise<void> {
    const bill = await this.invoiceModel
      .findOne({ _id: bill_id, is_delete: 0 })
      .lean();
    if (!bill) return;

    const items = await this.invoiceItemModel
      .find({ invoice_id: bill_id })
      .lean();
    if (!items || items.length === 0) return;

    // Check if a customer stock entry already exists for this invoice
    let stockDoc = await this.customerStockModel.findOne({
      org_id: bill.org_id,
      customer_id: bill.customer_id,
      invoice_number: bill.invoice_number,
      is_delete: 0,
    });

    if (!stockDoc) {
      // Create new customer stock document
      stockDoc = await this.customerStockModel.create({
        org_id: bill.org_id,
        login_type_id: bill.login_type_id,
        customer_type_id: bill.customer_type_id,
        customer_type_name: bill.customer_type_name,
        customer_id: bill.customer_id,
        customer_code: bill.customer_code,
        customer_name: bill.customer_name,
        invoice_number: bill.invoice_number,
        stock_date: new Date(),
        total_item_count: items.length,
        total_item_quantity: items.reduce(
          (sum, item) => sum + (item.total_quantity || 0),
          0,
        ),
        remarks: bill.remarks || '',
        ...req['createObj'],
      });
    }

    // Loop through each item and upsert
    for (const item of items) {
      const existingItem = await this.customerStockItemModel.findOne({
        org_id: bill.org_id,
        customer_id: bill.customer_id,
        product_id: item.product_id,
        is_delete: 0,
      });

      if (existingItem) {
        // Update existing item quantity
        await this.customerStockItemModel.updateOne(
          { _id: existingItem._id },
          {
            $inc: { total_quantity: item.total_quantity || 0 },
            ...req['updateObj'],
          },
        );
      } else {
        // Create new item
        await this.customerStockItemModel.create({
          org_id: bill.org_id,
          customer_id: bill.customer_id,
          product_id: item.product_id,
          product_name: item.product_name,
          product_code: item.product_code,
          total_quantity: item.total_quantity || 0,
          ...req['createObj'],
        });
      }
    }
  }

  async upload(files: Express.Multer.File[], req: any): Promise<any> {
    try {
      req.body.module_name = Object.keys(global.SUB_MODULES).find(
        (key) => global.SUB_MODULES[key] === global.SUB_MODULES['Invoice'],
      );
      let response = await this.s3Service.uploadMultiple(
        files,
        req,
        this.invoiceDocsModel,
      );
      return this.res.success('SUCCESS.CREATE', response);
    } catch (error) {
      return this.res.error(
        HttpStatus.BAD_REQUEST,
        'Error uploading files to S3',
        error,
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
    return this.s3Service.getDocumentsByRowId(this.invoiceDocsModel, id, type);
  }

  async getDocumentByDocsId(req: any, params: any): Promise<any> {
    const doc = await this.s3Service.getDocumentsById(
      this.invoiceDocsModel,
      params._id,
    );
    return this.res.success('SUCCESS.FETCH', doc);
  }

  async getSaleUsingCustomerId(req: any, params: any): Promise<any> {
    try {
      const matchStage = {
        $match: {
          org_id: req['user']['_id'],
          is_delete: 0,
          customer_id: { $in: params.customer_ids },
          billing_date: {
            $gte: params.start,
            $lte: params.end,
          },
        },
      };

      const groupStage = {
        $group: {
          _id: null,
          total_net_amount_with_tax: {
            $sum: {
              $toDouble: '$net_amount_with_tax',
            },
          },
          count: { $sum: 1 },
        },
      };

      const result = await this.invoiceModel.aggregate([
        matchStage,
        groupStage,
      ]);

      if (result.length === 0) {
        return {
          total_net_amount_with_tax: 0,
          count: 0,
        };
      }

      return {
        total_net_amount_with_tax: result[0].total_net_amount_with_tax,
        count: result[0].count,
      };
    } catch (error) {
      throw error;
    }
  }
}
