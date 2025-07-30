import { HttpStatus, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { CustomerStockModel } from '../models/company-customer-stock.model';
import { CustomerStockItemModel } from '../models/company-customer-stock-item.model';
import { CustomerToCustomerStockItemModel } from '../models/customer-customer-stock-item.model';
import { StockTransferDocsModel } from '../models/stock-transfer-docs.model';
import { CustomerToCustomerStockModel } from '../models/customer-customer-stock.model';
import mongoose, { Model, Types } from 'mongoose';
import { ResponseService } from 'src/services/response.service';
import { toObjectId, commonFilters } from 'src/common/utils/common.utils';
import { S3Service } from 'src/shared/rpc/s3.service';
import { ProductModel } from 'src/modules/master/product/models/product.model';
import { SharedCustomerService } from 'src/modules/master/customer/shared-customer.service';
@Injectable()
export class AppStockTransferService {
  constructor(
    @InjectModel(CustomerStockItemModel.name) private customerStockItemModel: Model<CustomerStockItemModel>,
    @InjectModel(CustomerStockModel.name) private customerStockModel: Model<CustomerStockModel>,
    @InjectModel(ProductModel.name) private productModel: Model<ProductModel>,
    @InjectModel(CustomerToCustomerStockModel.name) private customerToCustomerStockModel: Model<CustomerToCustomerStockModel>,
    @InjectModel(CustomerToCustomerStockItemModel.name) private customerToCustomerStockItemModel: Model<CustomerToCustomerStockItemModel>,
    @InjectModel(StockTransferDocsModel.name) private stockTransferDocsModel: Model<StockTransferDocsModel>,
    private readonly res: ResponseService,
    private readonly s3Service: S3Service,
    private readonly sharedCustomerService: SharedCustomerService,

  ) { }
  async CustomerToCustomerStockRead(req: Request, params: any): Promise<any> {
    try {
      const orgId = req['user']['org_id'];
      const userId = toObjectId(req['user']['_id']);

      const match: any = { is_delete: 0, org_id: orgId, transaction_type: 'Outgoing', };
      const sorting: Record<string, 1 | -1> = params?.sorting && Object.keys(params.sorting).length > 0 ? params.sorting : { _id: -1 };
      const filters: Record<string, any> = commonFilters(params?.filters);

      if (params?.mainTab === 'Purchase Request') {
        match['receiver_customer_id'] = userId;
      } else {
        match['sender_customer_id'] = userId;
      }

      Object.assign(match, filters);

      if (params?.activeTab && params.activeTab !== "All") {
        match['status'] = params.activeTab;
      }

      const page: number = params?.page || global.PAGE;
      const limit: number = params?.limit || global.LIMIT;
      const skip: number = (page - 1) * limit;

      const totalCountData = await this.customerToCustomerStockModel.aggregate([
        { $match: match },
        { $count: "totalCount" }
      ]);
      const total = totalCountData.length > 0 ? totalCountData[0].totalCount : 0;

      const result = await this.customerToCustomerStockModel.find(match).skip(skip).limit(limit).sort(sorting).select('-created_unix_time')
        .lean();

      // Tab-wise status counts
      const allStatuses = ['Pending', 'Approved', 'Reject', 'All'];

      const statusMatch: any = { is_delete: 0, org_id: orgId, transaction_type: 'Outgoing', };

      if (params?.mainTab === 'Purchase Request') {
        statusMatch['receiver_customer_id'] = userId;
      } else {
        statusMatch['sender_customer_id'] = userId;
      }

      const tabWiseCounts = await this.customerToCustomerStockModel.aggregate([
        { $match: statusMatch },
        {
          $group: {
            _id: "$status",
            count: { $sum: 1 }
          }
        }
      ]);

      const rawStatusCounts = tabWiseCounts.reduce((acc, cur) => {
        acc[cur._id] = cur.count;
        return acc;
      }, {} as Record<string, number>);

      const status_counts = allStatuses.reduce((acc, status) => {
        acc[status] = rawStatusCounts[status] || 0;
        return acc;
      }, {} as Record<string, number>);

      status_counts['All'] = Object.values(status_counts).reduce((a, b) => a + b, 0);

      const data: any = { result, status_counts };
      return this.res.pagination(data, total, page, limit);

    } catch (error) {
      return this.res.error(HttpStatus.BAD_REQUEST, 'ERROR.BAD_REQ', error);
    }
  }

  async CustomerToCompanyReturnCreate(req: any, params: any): Promise<any> {
    try {
      const orgId = req['user']['org_id'];
      const { sender_customer_id, sender_customer_type_id, sender_customer_type_name, sender_customer_name, bill_number, bill_date, bill_amount, selectedItems, } = params;

      const exist = await this.customerStockModel.findOne({ is_delete: 0, org_id: orgId, customer_id: toObjectId(sender_customer_id), invoice_number: bill_number, });

      if (exist) {
        return this.res.error(HttpStatus.BAD_REQUEST, 'WARNING.ALREADY_EXIST');
      }

      const productIds = selectedItems.map((item) => toObjectId(item.value));
      const products = await this.productModel.find({ _id: { $in: productIds }, org_id: orgId, is_delete: 0 }).lean();

      // Validate stock
      for (const item of selectedItems) {
        const product = products.find((p) => p._id.toString() === item.value);
        if (!product) {
          return this.res.error(HttpStatus.BAD_REQUEST, `PRODUCT.NOT_FOUND`);
        }

        const senderStock = await this.customerStockItemModel.findOne({
          org_id: orgId, customer_id: toObjectId(sender_customer_id),
          product_id: product._id,
        });

        if (!senderStock || senderStock.total_quantity < item.qty) {
          return this.res.error(
            HttpStatus.BAD_REQUEST,
            `INSUFFICIENT_STOCK for product ${product.product_name}`
          );
        }
      }

      const total_item_quantity = selectedItems.reduce((sum, item) => sum + item.qty, 0);
      const total_item_count = selectedItems.length;

      const saveObj: Record<string, any> = {
        ...req['createObj'],
        org_id: orgId,
        login_type_id: req['user']['login_type_id'],
        customer_type_id: toObjectId(sender_customer_type_id),
        customer_type_name: sender_customer_type_name,
        customer_id: toObjectId(sender_customer_id),
        customer_name: sender_customer_name,
        invoice_number: bill_number,
        stock_date: bill_date,
        bill_amount: bill_amount,
        total_item_quantity,
        total_item_count,
        transaction_type: 'Return',
        status: 'Pending',
        selected_item: selectedItems

      };

      const document = new this.customerStockModel(saveObj);
      const insert = await document.save();

      // Deduct stock from sender
      for (const item of selectedItems) {
        const product = products.find((p) => p._id.toString() === item.value);
        const productId = product._id;
        const qty = item.qty;

        const senderStock = await this.customerStockItemModel.findOne({
          org_id: orgId, customer_id: toObjectId(sender_customer_id),
          product_id: productId,
        });

        senderStock.total_quantity = Math.max(senderStock.total_quantity - qty, 0);
        await senderStock.save();
      }

      return this.res.success('SUCCESS.CREATE', { inserted_id: insert._id });
    } catch (error) {
      return this.res.error(HttpStatus.BAD_REQUEST, 'ERROR.BAD_REQ', error);
    }
  }

  async CustomerToCompanyReturnRead(req: Request, params: any): Promise<any> {
    try {
      let match: any = { is_delete: 0, org_id: req['user']['org_id'], transaction_type: 'Return', customer_id: req['user']['_id'] };
      let sorting: Record<string, 1 | -1> = { _id: -1 };

      if (params?.sorting && Object.keys(params.sorting).length !== 0) sorting = params.sorting;

      const filters: Record<string, any> = commonFilters(params?.filters);
      match = { ...match, ...filters };

      if (params?.activeTab && params.activeTab !== "All") {
        match['status'] = params.activeTab;
      }

      const page: number = params?.page || global.PAGE;
      const limit: number = params?.limit || global.LIMIT;
      const skip: number = (page - 1) * limit;

      const pipeline = [
        { $match: match },
        { $sort: sorting },
        { $project: { created_unix_time: 0 } }
      ];

      const totalCountData: Record<string, any>[] = await this.customerStockModel.aggregate([
        ...pipeline,
        { $count: "totalCount" },
      ]);

      const total: number = totalCountData.length > 0 ? totalCountData[0].totalCount : 0;

      let result = await this.customerStockModel.find(match).skip(skip).limit(limit).sort(sorting).lean();

      const allStatuses = ['Pending', 'Approved', 'Reject', 'All'];

      const tabWiseCounts = await this.customerStockModel.aggregate([
        {
          $match: {
            is_delete: 0,
            org_id: req['user']['org_id'],
            transaction_type: 'Return',
            customer_id: req['user']['_id']
          }
        },
        {
          $group: {
            _id: "$status",
            count: { $sum: 1 }
          }
        }
      ]);

      const rawStatusCounts = tabWiseCounts.reduce((acc, cur) => {
        acc[cur._id] = cur.count;
        return acc;
      }, {} as Record<string, number>);

      const status_counts = allStatuses.reduce((acc, status) => {
        acc[status] = rawStatusCounts[status] || 0;
        return acc;
      }, {} as Record<string, number>);

      status_counts['All'] = Object.values(status_counts).reduce((a, b) => a + b, 0);

      const data: any = { result, status_counts };

      return this.res.pagination(data, total, page, limit);

    } catch (error) {
      return this.res.error(HttpStatus.BAD_REQUEST, 'ERROR.BAD_REQ', error);
    }
  }

  async CustomerToCompanyReturnDetail(req: Request, params: any): Promise<any> {
    try {
      params._id = toObjectId(params._id);

      const match: Record<string, any> = { org_id: req['user']['org_id'], _id: params._id, is_delete: 0, transaction_type: 'Return' };

      const result: Record<string, any> = await this.customerStockModel.findOne(match).lean();
      if (!result) return this.res.error(HttpStatus.NOT_FOUND, 'ERROR.NOT_FOUND');

      // result.product_detail = await this.customerStockItemModel.find({ org_id: req['user']['org_id'], customer_id: toObjectId(result.customer_id) }).lean();

      const contactList = await this.sharedCustomerService.getContactPerson(req, { customer_id: result.customer_id });
      result.customer_contact_person_name = contactList?.[0]?.contact_person_name || '';

      const customer_info = await this.sharedCustomerService.fetchCustomerInfo(req, { customer_id: result.customer_id });

      result.customer_mobile = customer_info?.mobile || '';
      result.customer_full_address = customer_info?.full_address || '';

      if (result._id) {
        result.files = await this.getDocument(result._id, global.THUMBNAIL_IMAGE);
      }

      return this.res.success('SUCCESS.FETCH', result);
    } catch (error) {
      return this.res.error(HttpStatus.BAD_REQUEST, 'ERROR.BAD_REQ', error);
    }
  }

  async CompanyReturnStatus(req: Request, params: any): Promise<any> {
    try {

      const exist: Record<string, any> = await this.customerStockModel.findOne({ _id: toObjectId(params._id), is_delete: 0 }).exec();
      if (!exist) return this.res.success('WARNING.NOT_EXIST');

      const updateObj = {
        ...req['updateObj'],
        status: params.status,
        remarks: params.remarks,
      };
      await this.customerStockModel.updateOne({ _id: toObjectId(params._id) }, updateObj);
      return this.res.success('SUCCESS.STATUS_UPDATE');
    } catch (error) {
      return this.res.error(HttpStatus.BAD_REQUEST, 'ERROR.BAD_REQ', error);
    }
  }

  async CustomerToCustomerStockReturnRead(req: Request, params: any): Promise<any> {
    try {
      const orgId = req['user']['org_id'];

      let match: any = { is_delete: 0, org_id: orgId, transaction_type: 'Return', status: 'Approved' };

      let sorting: Record<string, 1 | -1> = { _id: -1 };
      if (params?.sorting && Object.keys(params.sorting).length !== 0) {
        sorting = params.sorting;
      }

      if (params?.recevier_id) {
        match['receiver_customer_id'] = toObjectId(params.recevier_id);
      }

      if (params?.sender_id) {
        match['sender_customer_id'] = toObjectId(params.sender_id);
      }

      const filters: Record<string, any> = commonFilters(params?.filters);
      match = { ...match, ...filters };

      const page: number = params?.page || global.PAGE;
      const limit: number = params?.limit || global.LIMIT;
      const skip: number = (page - 1) * limit;

      const pipeline = [
        { $match: match },
        { $sort: sorting },
        { $project: { created_unix_time: 0 } }
      ];

      const totalCountData = await this.customerToCustomerStockModel.aggregate([
        ...pipeline,
        { $count: 'totalCount' }
      ]);

      const total: number = totalCountData.length > 0 ? totalCountData[0].totalCount : 0;

      const result = await this.customerToCustomerStockModel.find(match).skip(skip).limit(limit).sort(sorting).lean();

      const statusMatch: any = { is_delete: 0, org_id: orgId, transaction_type: 'Return', status: 'Approved' };

      if (params?.recevier_id) {
        statusMatch['receiver_customer_id'] = toObjectId(params.recevier_id);
      }

      if (params?.sender_id) {
        statusMatch['sender_customer_id'] = toObjectId(params.sender_id);
      }

      const tabWiseCounts = await this.customerToCustomerStockModel.aggregate([
        { $match: statusMatch },
        {
          $group: {
            _id: '$status',
            count: { $sum: 1 }
          }
        }
      ]);

      const rawStatusCounts = tabWiseCounts.reduce((acc, cur) => {
        acc[cur._id] = cur.count;
        return acc;
      }, {} as Record<string, number>);

      const allStatuses = ['Approved'];
      const status_counts = allStatuses.reduce((acc, status) => {
        acc[status] = rawStatusCounts[status] || 0;
        return acc;
      }, {} as Record<string, number>);

      const data: any = { result, status_counts };

      return this.res.pagination(data, total, page, limit);
    } catch (error) {
      return this.res.error(HttpStatus.BAD_REQUEST, 'ERROR.BAD_REQ', error);
    }
  }

  async CustomerToCustomerReturnDetail(req: Request, params: any): Promise<any> {
    try {
      params._id = toObjectId(params._id);

      const match: Record<string, any> = { org_id: req['user']['org_id'], _id: params._id, is_delete: 0, transaction_type: 'Return' };

      const result: Record<string, any> = await this.customerToCustomerStockModel.findOne(match).lean();
      if (!result) return this.res.error(HttpStatus.NOT_FOUND, 'ERROR.NOT_FOUND');

      // result.product_detail = await this.customerToCustomerStockItemModel.find({ org_id: req['user']['org_id'], customer_id: toObjectId(result.receiver_customer_id) }).lean();

      const contactList = await this.sharedCustomerService.getContactPerson(req, { customer_id: result.sender_customer_id });
      result.sender_contact_person_name = contactList?.[0]?.contact_person_name || '';

      const customer_info = await this.sharedCustomerService.fetchCustomerInfo(req, { customer_id: result.sender_customer_id });

      result.sender_customer_mobile = customer_info?.mobile || '';
      result.sender_full_address = customer_info?.full_address || '';

      const receiver_info = await this.sharedCustomerService.fetchCustomerInfo(req, { customer_id: result.receiver_customer_id });

      result.receiver_customer_mobile = receiver_info?.mobile || '';
      result.receiver_full_address = receiver_info?.full_address || '';

      if (result._id) {
        result.files = await this.getDocument(result._id, global.THUMBNAIL_IMAGE);
      }

      return this.res.success('SUCCESS.FETCH', result);
    } catch (error) {
      return this.res.error(HttpStatus.BAD_REQUEST, 'ERROR.BAD_REQ', error);
    }
  }


  async upload(files: Express.Multer.File[], req: any): Promise<any> {
    try {
      req.body.module_name = Object.keys(global.MODULES).find(
        key => global.MODULES[key] === global.MODULES['Company Stock']
      );
      let response = await this.s3Service.uploadMultiple(files, req, this.stockTransferDocsModel);
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
    return this.s3Service.getDocumentsByRowId(this.stockTransferDocsModel, id, type);
  }

  async getDocumentByDocsId(req: any, params: any): Promise<any> {
    const doc = await this.s3Service.getDocumentsById(this.stockTransferDocsModel, params._id);
    return this.res.success('SUCCESS.FETCH', doc);
  }
}