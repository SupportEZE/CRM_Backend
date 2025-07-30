import { HttpStatus, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { InvoiceModel } from '../models/invoice.model';
import { InvoiceItemModel } from '../models/invoice-item.model';
import { InvoiceDocsModel } from '../models/invoice-docs.model';
import mongoose, { Model, Types } from 'mongoose';
import { ResponseService } from 'src/services/response.service';
import {
  toObjectId,
  commonFilters,
  appCommonFilters,
} from 'src/common/utils/common.utils';
import { S3Service } from 'src/shared/rpc/s3.service';
import { CustomerModel } from 'src/modules/master/customer/default/models/customer.model';
import { SharedCustomerService } from 'src/modules/master/customer/shared-customer.service';
import { CustomerStockModel } from 'src/modules/dms/stock-transfer/models/company-customer-stock.model';
import { CustomerStockItemModel } from 'src/modules/dms/stock-transfer/models/company-customer-stock-item.model';

@Injectable()
export class AppInvoiceService {
  constructor(
    @InjectModel(InvoiceModel.name) private invoiceModel: Model<InvoiceModel>,
    @InjectModel(CustomerModel.name)
    private customerModel: Model<CustomerModel>,
    @InjectModel(InvoiceItemModel.name)
    private invoiceItemModel: Model<InvoiceItemModel>,
    @InjectModel(InvoiceDocsModel.name)
    private invoiceDocsModel: Model<InvoiceDocsModel>,
    @InjectModel(CustomerStockModel.name)
    private customerStockModel: Model<CustomerStockModel>,
    @InjectModel(CustomerStockItemModel.name)
    private customerStockItemModel: Model<CustomerStockItemModel>,

    private readonly res: ResponseService,
    private readonly s3Service: S3Service,
    private readonly sharedCustomerService: SharedCustomerService,
  ) {}

  async read(req: Request, params: any): Promise<any> {
    try {
      let match: Record<string, any> = {
        is_delete: 0,
        org_id: req['user']['org_id'],
        customer_id: req['user']['_id'],
      };
      let sorting: Record<string, 1 | -1> = { _id: -1 };
      if (params?.filters?.search) {
        const fieldsToSearch = ['invoice_number', 'order_number'];
        const searchQuery = appCommonFilters(params.filters, fieldsToSearch);
        match = { ...match, ...searchQuery };
      }

      if (params?.activeTab && params.activeTab) {
        match['grn_status'] = params.activeTab;
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

      const total = await this.invoiceModel.countDocuments(match);
      let result = await this.invoiceModel
        .find(match)
        .skip(skip)
        .limit(limit)
        .sort(sorting)
        .lean();

      const allStatuses = ['Pending', 'Received', 'Reject', 'All'];

      const tabWiseCounts = await this.invoiceModel.aggregate([
        {
          $match: {
            is_delete: 0,
            org_id: req['user']['org_id'],
            customer_id: req['user']['_id'],
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
      const data: any = { result, status_counts };

      return this.res.pagination(data, total, page, limit);
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
        customer_id: req['user']['_id'],
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
        .findOne({
          _id: params._id,
          is_delete: 0,
          customer_id: req['user']['_id'],
        })
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
}
