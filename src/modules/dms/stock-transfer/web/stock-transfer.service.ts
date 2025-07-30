import { HttpStatus, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { CustomerStockModel } from '../models/company-customer-stock.model';
import { CustomerStockItemModel } from '../models/company-customer-stock-item.model';
import { CustomerToCustomerStockItemModel } from '../models/customer-customer-stock-item.model';
import { StockTransferDocsModel } from '../models/stock-transfer-docs.model';
import { CustomerToCustomerStockModel } from '../models/customer-customer-stock.model';
import mongoose, { Model, Types } from 'mongoose';
import { ResponseService } from 'src/services/response.service';
import { toObjectId, commonFilters, commonSearchFilter, nextSeq } from 'src/common/utils/common.utils';
import { S3Service } from 'src/shared/rpc/s3.service';
import { ProductModel } from 'src/modules/master/product/models/product.model';
import { SharedCustomerService } from 'src/modules/master/customer/shared-customer.service';
import { Status } from './dto/stock-transfer.dto';
import { SharedProductService } from 'src/modules/master/product/shared-product-service';
import { AppLedgerService } from 'src/modules/loyalty/ledger/app/app-ledger.service';
@Injectable()
export class StockTransferService {
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
    private readonly sharedProductService: SharedProductService,
    private readonly appLedgerService: AppLedgerService,
  ) { }
  async CustomerStockRead(req: Request, params: any): Promise<any> {
    try {
      const orgId = req['user']['org_id'];
      const customerId = toObjectId(params.customer_id);
      const activeTab = params.activeTab || 'Stock';

      let sorting: Record<string, 1 | -1> = { _id: -1 };
      if (params?.sorting && Object.keys(params.sorting).length !== 0) {
        sorting = params.sorting;
      }

      const filters: Record<string, any> = commonFilters(params?.filters);
      const page: number = params?.page || global.PAGE;
      const limit: number = params?.limit || global.LIMIT;
      const skip: number = (page - 1) * limit;

      const commonMatch: Record<string, any> = {
        is_delete: 0, org_id: orgId, customer_id: customerId,
        ...filters,
      };

      const stockCount: number = await this.customerStockItemModel.countDocuments({
        ...commonMatch,
        total_quantity: { $gt: 0 },
      });

      const filteredProducts = await this.productModel.find({
        is_delete: 0, org_id: orgId,
        ...filters,
      }, { _id: 1, product_name: 1, product_code: 1 }).lean();

      const customerStockItems = await this.customerStockItemModel.find({ is_delete: 0, org_id: orgId, customer_id: customerId }, { product_id: 1 }).lean();
      const customerStockProductIds = customerStockItems.map(p => p.product_id.toString());

      const outOfStockProducts = filteredProducts.filter(
        (p) => !customerStockProductIds.includes(p._id.toString())
      );

      const outOfStockCount = outOfStockProducts.length;
      const status_counts = { Stock: stockCount, Out_of_stock: outOfStockCount, All: stockCount + outOfStockCount, };
      if (activeTab === 'Stock') {
        const match = {
          ...commonMatch,
          total_quantity: { $gt: 0 },
        };

        const total = await this.customerStockItemModel.countDocuments(match);
        const result = await this.customerStockItemModel.find(match).skip(skip).limit(limit).sort(sorting).lean();

        const resultWithExtras = await Promise.all(
          result.map(async (item) => {
            let customer_mobile = '';
            if (item.customer_id) {
              const customerInfo = await this.sharedCustomerService.fetchCustomerInfo(req, {
                customer_id: item.customer_id,
              });
              customer_mobile = customerInfo?.mobile || '';
            }
            return {
              ...item,
              customer_mobile,
            };
          })
        );
        const data: any = { result: resultWithExtras, status_counts, };
        return this.res.pagination(data, total, page, limit);
      }

      if (activeTab === 'Out of stock') {
        const total = outOfStockCount;
        const paginated = outOfStockProducts.slice(skip, skip + limit);

        const resultWithExtras = paginated.map((p) => ({
          product_id: p._id, product_name: p.product_name, product_code: p.product_code, total_quantity: 0,
          stock_status: 'Out of stock',
        }));

        const data: any = { result: resultWithExtras, status_counts, };
        return this.res.pagination(data, total, page, limit);
      }
      return this.res.error(HttpStatus.BAD_REQUEST, 'STOCK_TRANSFER.INVALID_TAB');
    } catch (error) {
      return this.res.error(HttpStatus.BAD_REQUEST, 'ERROR.BAD_REQ', error);
    }
  }

  async CustomerToCustomerCreate(req: any, params: any): Promise<any> {
    try {
      const orgId: number = req['user']['org_id'];
      const {
        sender_customer_id,
        sender_customer_type_id,
        receiver_customer_id,
        receiver_customer_type_id,
        receiver_customer_name,
        receiver_login_type_id,
        bill_number,
        selectedItems
      } = params;

      const exist: Record<string, any> = await this.customerToCustomerStockModel.findOne({
        is_delete: 0,
        org_id: orgId,
        sender_customer_id: toObjectId(sender_customer_id),
        receiver_customer_id: toObjectId(receiver_customer_id),
        bill_number,
      });
      if (exist) return this.res.error(HttpStatus.BAD_REQUEST, 'WARNING.ALREADY_EXIST');

      const productIds = selectedItems.map((item) => toObjectId(item.value));
      const products = await this.productModel.find({ _id: { $in: productIds }, org_id: orgId, is_delete: 0, }).lean();

      for (const item of selectedItems) {
        const product = products.find((p) => p._id.toString() === item.value);
        if (!product) return this.res.error(HttpStatus.BAD_REQUEST, 'STOCK_TRANSFER.PRODUCT_NOT_FOUND');

        const senderStock = await this.customerToCustomerStockItemModel.findOne({ org_id: orgId, customer_id: toObjectId(sender_customer_id), product_id: product._id, });
        if (!senderStock || senderStock.total_quantity < item.qty) {
          return this.res.error(HttpStatus.BAD_REQUEST, `INSUFFICIENT_STOCK for product ${product.product_name}`
          );
        }
      }

      const seq = {
        modelName: this.customerToCustomerStockModel,
        idKey: 'transfer_id',
        prefix: 'TRANS'
      }
      const transferId = await nextSeq(req, seq)
      
      let status: string;
      if (req['user']['login_type_id'] === 2) {
        status = Status.Approved;
      } else if ([global.LOGIN_TYPE_ID['PRIMARY'], global.LOGIN_TYPE_ID['SECONDARY']].includes(params.sender_login_type_id) &&
        params.sender_login_type_id === req['user']['login_type_id']
      ) {
        status = Status.Approved;;
      } else {
        status = Status.Pending;;
      }

      const total_item_quantity = selectedItems.reduce((sum, item) => sum + item.qty, 0);
      const total_item_count = selectedItems.length;

      const userName = req['user']['name'];
      const now = new Date();

      let label = '';
      let message = '';
      if (status === Status.Approved) {
        label = Status.Approved;
        message = `Stock transfer status changed to Approved and done by ${userName}`;
      } else if (status === Status.Pending) {
        label = Status.Pending;
        message = `Stock transfer status changed to Pending`;
      }

      const statusUpdateObj: Record<string, any> = {
        label,
        message,
        status_update_date: now
      };

      const saveObj: Record<string, any> = {
        ...req['createObj'],
        ...params,
        sender_customer_type_id: toObjectId(sender_customer_type_id),
        sender_customer_id: toObjectId(sender_customer_id),
        receiver_customer_type_id: toObjectId(receiver_customer_type_id),
        receiver_customer_id: toObjectId(receiver_customer_id),
        status,
        total_item_quantity,
        total_item_count,
        transfer_id: transferId,
        transaction_type: 'Outgoing',
        selected_item: selectedItems.map((item: any) => ({
          ...item,
          product_id: toObjectId(item.value)
        })),
        status_tracking: [
          {
            label: "Request Submitted",
            message: `${req['user']['name']} has submitted a stock transfer request. ${transferId}`,
            status_update_date: new Date()
          },
          statusUpdateObj
        ]
      };
      const document = new this.customerToCustomerStockModel(saveObj);
      const insert = await document.save();
      if (!insert || !insert._id) {
        return this.res.error(HttpStatus.INTERNAL_SERVER_ERROR, 'ERROR.BAD_REQ');
      }

      if (status === Status.Approved) {
        await Promise.all(selectedItems.map(async (item) => {
          const product = products.find((p) => p._id.toString() === item.value);
          const productId = product._id;
          const product_name = product.product_name;
          const qty = item.qty;
          const transactionType = 'Outgoing'

          await this.pointTransferToCustomer(req, {
            product_id: productId,
            qty,
            sender_customer_id: toObjectId(sender_customer_id),
            sender_customer_type_id: toObjectId(sender_customer_type_id),
            receiver_customer_id: toObjectId(receiver_customer_id),
            receiver_customer_name: receiver_customer_name,
            receiver_customer_type_id: toObjectId(receiver_customer_type_id),
            receiver_login_type_id: receiver_login_type_id,
            product_name: product_name,
            transfer_id: transferId,
            transaction_type: transactionType
          });
        }));
      }
      return this.res.success('SUCCESS.CREATE', { inserted_id: insert._id });
    } catch (error) {
      return this.res.error(HttpStatus.BAD_REQUEST, 'ERROR.BAD_REQ', error);
    }
  }

  private async pointTransferToCustomer(req: Request, params: any): Promise<any> {
    const {
      product_id, qty, sender_customer_id, receiver_customer_id, receiver_customer_name,
      receiver_login_type_id, receiver_customer_type_id, product_name, transfer_id
    } = params;

    const pointsPerUnitList: any = await this.sharedProductService.fetchPointCatgoryByProductId(
      req,
      product_id,
      receiver_customer_type_id
    );

    if (!pointsPerUnitList) {
      throw new Error('Point category not found for the given customer type and product');
    }

    const pointPerUnit = pointsPerUnitList.point_value || 0;
    const point = pointPerUnit * qty;

    const senderStock = await this.customerToCustomerStockItemModel.findOne({
      org_id: req['user']['org_id'],
      customer_id: toObjectId(sender_customer_id),
      product_id: toObjectId(product_id),
    });

    if (senderStock) {
      senderStock.total_quantity = Math.max(senderStock.total_quantity - qty, 0);
      await senderStock.save();
    }

    const dateStr = new Date().toISOString().split('T')[0].replace(/-/g, '');

    const ledgerParams = {
      customer_id: toObjectId(receiver_customer_id),
      customer_name: receiver_customer_name,
      login_type_id: receiver_login_type_id,
      customer_type_id: toObjectId(receiver_customer_type_id),
      transaction_type: global.TRANSACTION_TYPE[0],
      points: point,
      remark: `Points Credited for product "${product_name}" against Transfer ID ${transfer_id}.`,
      transaction_id: `STK-${point}-${dateStr}`,
      creation_type: global.CREATION_TYPE[15]
    };
    await this.appLedgerService.create(req, ledgerParams);
  }

  private async pointReturnFromCustomer(req: Request, params: any): Promise<any> {
    const {
      product_id, qty, sender_customer_id, sender_customer_type_id, sender_customer_name,
      sender_login_type_id, product_name, receiver_customer_id, transfer_id
    } = params;

    const pointsPerUnitList: any = await this.sharedProductService.fetchPointCatgoryByProductId(
      req,
      product_id,
      sender_customer_type_id
    );

    if (!pointsPerUnitList) {
      throw new Error('Point category not found for the given customer type and product');
    }
    const pointPerUnit = pointsPerUnitList?.point_value ?? 0;
    const point = pointPerUnit * qty;

    const receiverStock = await this.customerToCustomerStockItemModel.findOne({
      org_id: req['user']['org_id'],
      customer_id: toObjectId(receiver_customer_id),
      product_id: toObjectId(product_id),
    });

    receiverStock.total_quantity = Math.max(receiverStock.total_quantity + qty, 0);
    await receiverStock.save();

    const dateStr = new Date().toISOString().split('T')[0].replace(/-/g, '');
    const ledgerParams = {
      customer_id: toObjectId(sender_customer_id),
      customer_name: sender_customer_name,
      login_type_id: sender_login_type_id,
      customer_type_id: toObjectId(sender_customer_type_id),
      transaction_type: global.TRANSACTION_TYPE[1],
      points: point,
      remark: `Points Debited for product "${product_name}" against Transfer ID ${transfer_id}.`,
      transaction_id: `STK-${point}-${dateStr}`,
      creation_type: global.CREATION_TYPE[15]
    };
    await this.appLedgerService.create(req, ledgerParams);
  }

  async CustomerToCustomerStockRead(req: Request, params: any): Promise<any> {
    try {
      const orgId = req['user']['org_id'];
      const match: any = { is_delete: 0, org_id: orgId, transaction_type: 'Outgoing', };

      const sorting: Record<string, 1 | -1> = params?.sorting && Object.keys(params.sorting).length > 0 ? params.sorting : { _id: -1 };
      const filters: Record<string, any> = commonFilters(params?.filters);

      if (params?._id) {
        if (params?.mainTab === 'Purchase Request') {
          match['receiver_customer_id'] = toObjectId(params._id);
        } else {
          match['sender_customer_id'] = toObjectId(params._id);
        }
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

      const result = await this.customerToCustomerStockModel.find(match).skip(skip).limit(limit).sort(sorting).select('-created_unix_time').lean();
      const allStatuses = ['Pending', 'Approved', 'Reject', 'All'];

      const statusMatch: any = { is_delete: 0, org_id: orgId, transaction_type: 'Outgoing', };

      if (params?._id) {
        if (params?.mainTab === 'Purchase Request') {
          statusMatch['receiver_customer_id'] = toObjectId(params._id);
        } else {
          statusMatch['sender_customer_id'] = toObjectId(params._id);
        }
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

  async detail(req: Request, params: any): Promise<any> {
    try {
      const match: Record<string, any> = {
        org_id: req['user']['org_id'],
        _id: params._id,
        is_delete: 0,
      };
      const result: Record<string, any> = await this.customerToCustomerStockModel.findOne(match).lean();
      if (!result) return this.res.error(HttpStatus.NOT_FOUND, 'ERROR.NOT_FOUND');

      const contactList = await this.sharedCustomerService.getContactPerson(req, { customer_id: result.sender_customer_id });
      result.sender_contact_person_name = contactList?.[0]?.contact_person_name || '';

      const customer_info = await this.sharedCustomerService.fetchCustomerInfo(req, { customer_id: result.sender_customer_id });
      result.sender_customer_mobile = customer_info?.mobile || '';
      result.sender_full_address = customer_info?.full_address || '';

      const receiver_info = await this.sharedCustomerService.fetchCustomerInfo(req, { customer_id: result.receiver_customer_id });
      result.receiver_customer_mobile = receiver_info?.mobile || '';
      result.receiver_full_address = receiver_info?.full_address || '';

      if (Array.isArray(result.selected_item)) {
        const receiverTypeId = result.receiver_customer_type_id;

        result.selected_item = await Promise.all(result.selected_item.map(async (item: any) => {
          const pointData = await this.sharedProductService.fetchPointCatgoryByProductId(
            req,
            item.product_id.toString(),
            receiverTypeId.toString()
          );
          return {
            ...item,
            point_value: pointData?.point_value || 0,
            point_category_name: pointData?.point_category_name || null
          };
        }));
      }

      if (result._id) {
        result.files = await this.getDocument(result._id, global.THUMBNAIL_IMAGE);
      }

      return this.res.success('SUCCESS.FETCH', result);
    } catch (error) {
      return this.res.error(HttpStatus.BAD_REQUEST, 'ERROR.BAD_REQ', error);
    }
  }

  async status(req: Request, params: any): Promise<any> {
    try {
      const { status, remarks } = params;
      const exist: Record<string, any> = await this.customerToCustomerStockModel.findOne({ _id: toObjectId(params._id), is_delete: 0 }).lean();
      if (!exist) return this.res.success('WARNING.NOT_EXIST');

      const userName = req['user']['name'];
      const now = new Date();

      let label = '';
      let message = '';

      if (status === Status.Approved) {
        label = Status.Approved;
        message = `Stock transfer status changed to Approved and done by ${userName}`;
      } else if (status === Status.Reject) {
        label = 'Reject';
        message = `Stock transfer status changed to Reject and done by ${userName}`;
      }

      const statusUpdateObj: Record<string, any> = {
        label,
        message,
        status_update_date: now
      };

      const updateObj: Record<string, any> = {
        ...req['updateObj'],
        status: params.status,
        remarks: params.remarks,
        $push: {
          order_tracking_status: statusUpdateObj
        }
      };
      await this.customerToCustomerStockModel.updateOne({ _id: toObjectId(params._id) },
        updateObj
      );

      if (params.status === Status.Approved) {
        const orgId = req['user']['org_id'];
        const selectedItems = exist.selected_item || [];
        const productIds = selectedItems.map(item => toObjectId(item.value));
        const products = await this.productModel.find({ _id: { $in: productIds }, org_id: orgId, is_delete: 0 }).lean();

        await Promise.all(selectedItems.map(async (item) => {
          const product = products.find((p) => p._id.toString() === item.value);
          const productId = product._id;
          const product_name = product.product_name;
          const qty = item.qty;
          const transactionType = 'Outgoing'

          await this.pointTransferToCustomer(req, {
            product_id: productId,
            qty,
            sender_customer_id: toObjectId(exist.sender_customer_id),
            sender_customer_type_id: toObjectId(exist.sender_customer_type_id),
            sender_customer_name: exist.sender_customer_name,
            receiver_customer_id: toObjectId(exist.receiver_customer_id),
            receiver_customer_name: exist.receiver_customer_name,
            receiver_customer_type_id: toObjectId(exist.receiver_customer_type_id),
            receiver_login_type_id: exist.receiver_login_type_id,
            product_name: product_name,
            transfer_id: exist.exist,
            transaction_type: transactionType
          });
        }));
      }
      return this.res.success('SUCCESS.STATUS_UPDATE');
    } catch (error) {
      return this.res.error(HttpStatus.BAD_REQUEST, 'ERROR.BAD_REQ', error);
    }
  }

  async CustomerToCompanyReturnCreate(req: any, params: any): Promise<any> {
    try {
      const orgId = req['user']['org_id'];
      const { sender_customer_id, sender_customer_type_id, sender_customer_type_name, sender_customer_name, bill_number, bill_date, bill_amount, selectedItems, } = params;
      const exist = await this.customerStockModel.findOne({ is_delete: 0, org_id: orgId, customer_id: toObjectId(sender_customer_id), invoice_number: bill_number, });
      if (exist) return this.res.error(HttpStatus.BAD_REQUEST, 'WARNING.ALREADY_EXIST');

      const productIds = selectedItems.map((item) => toObjectId(item.value));
      const products = await this.productModel.find({ _id: { $in: productIds }, org_id: orgId, is_delete: 0 }).lean();

      for (const item of selectedItems) {
        const product = products.find((p) => p._id.toString() === item.value);
        if (!product) {
          return this.res.error(HttpStatus.BAD_REQUEST, `PRODUCT.NOT_FOUND`);
        }

        const senderStock = await this.customerStockItemModel.findOne({ org_id: orgId, customer_id: toObjectId(sender_customer_id), product_id: product._id, });

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
        status: 'Approved',
        selected_item: selectedItems

      };

      const document = new this.customerStockModel(saveObj);
      const insert = await document.save();

      // Deduct stock from sender
      for (const item of selectedItems) {
        const product = products.find((p) => p._id.toString() === item.value);
        const productId = product._id;
        const qty = item.qty;

        const senderStock = await this.customerStockItemModel.findOne({ org_id: orgId, customer_id: toObjectId(sender_customer_id), product_id: productId, });

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
      let match: any = { is_delete: 0, org_id: req['user']['org_id'], transaction_type: 'Return', status: 'Approved' };
      let sorting: Record<string, 1 | -1> = { _id: -1 };

      if (params?.sorting && Object.keys(params.sorting).length !== 0) sorting = params.sorting;

      if (params?._id) {
        match['customer_id'] = toObjectId(params._id);
        const filters: Record<string, any> = commonFilters(params?.filters);
        match = { ...match, ...filters };
      } else {
        const filters: Record<string, any> = commonFilters(params?.filters);
        match = { ...match, ...filters };
      }

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

      const allStatuses = ['Approved'];

      const statusMatch: any = { is_delete: 0, org_id: req['user']['org_id'], transaction_type: 'Return', };

      if (params?._id) {
        statusMatch['customer_id'] = toObjectId(params._id);
      }

      const tabWiseCounts = await this.customerStockModel.aggregate([
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

      result.product_detail = await this.customerStockItemModel.find({ org_id: req['user']['org_id'], customer_id: toObjectId(result.customer_id) }).lean();

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

  async readDropdown(req: Request, params: any): Promise<any> {
    try {
      let match: any = { is_delete: 0, org_id: req['user']['org_id'], customer_id: toObjectId(params.customer_id) };
      let sorting: Record<string, 1 | -1> = { _id: -1 };

      const searchableFields = ['product_name'];

      const filters = commonSearchFilter(params?.filters, searchableFields);
      match = { ...match, ...filters };

      const page: number = Math.max(1, parseInt(params?.page, 10) || global.PAGE);
      const limit: number = Math.max(1, parseInt(params?.limit, 10) || global.LIMIT);
      const skip: number = (page - 1) * limit;

      let data: any = await this.customerStockItemModel
        .find(match, { product_name: 1, product_code: 1, customer_id: 1, product_id: 1, total_quantity: 1 })
        .sort(sorting)
        .limit(limit)
        .lean()

      data = data.map((row: any) => {
        return {
          label: row.product_name,
          product_code: row.product_code,
          value: row.product_id,
          customer_id: row.customer_id,
          total_quantity: row.total_quantity
        }
      })
      return this.res.success('SUCCESS.FETCH', data);
    } catch (error) {
      return this.res.error(HttpStatus.BAD_REQUEST, 'ERROR.BAD_REQ', error);
    }
  }

  async CustomerToCustomerReturnCreate(req: any, params: any): Promise<any> {
    try {
      const orgId: number = req['user']['org_id'];
      const { sender_customer_id, sender_customer_type_id, sender_customer_name, sender_login_type_id, receiver_customer_id, receiver_customer_name, receiver_customer_type_id, receiver_login_type_id, bill_number, selectedItems } = params;
      const exist = await this.customerToCustomerStockModel.findOne({ is_delete: 0, org_id: orgId, sender_customer_id: toObjectId(sender_customer_id), receiver_customer_id: toObjectId(receiver_customer_id), bill_number, });
      if (exist) return this.res.error(HttpStatus.BAD_REQUEST, 'WARNING.ALREADY_EXIST');

      const productIds = selectedItems.map((item) => toObjectId(item.value));
      const products = await this.productModel.find({ _id: { $in: productIds }, org_id: orgId, is_delete: 0, }).lean();

      for (const item of selectedItems) {
        const product = products.find((p) => p._id.toString() === item.value);
        if (!product) return this.res.error(HttpStatus.BAD_REQUEST, `PRODUCT.NOT_FOUND`);

        const senderStock = await this.customerToCustomerStockItemModel.findOne({ org_id: orgId, customer_id: toObjectId(sender_customer_id), product_id: product._id, });
        if (!senderStock || senderStock.total_quantity < item.qty) {
          return this.res.error(
            HttpStatus.BAD_REQUEST,
            `INSUFFICIENT_STOCK for product ${product.product_name}`
          );
        }
      }

      const seq = {
        modelName: this.customerToCustomerStockModel,
        idKey: 'transfer_id',
        prefix: 'TRANS'
      }
      const transferId = await nextSeq(req, seq)

      const total_item_quantity = selectedItems.reduce((sum, item) => sum + item.qty, 0);
      const total_item_count = selectedItems.length;

      const saveObj: Record<string, any> = {
        ...req['createObj'],
        ...params,
        sender_customer_type_id: toObjectId(sender_customer_type_id),
        sender_customer_id: toObjectId(sender_customer_id),
        receiver_customer_type_id: toObjectId(receiver_customer_type_id),
        receiver_customer_id: toObjectId(receiver_customer_id),
        status: 'Approved',
        total_item_quantity,
        total_item_count,
        transfer_id: transferId,
        transaction_type: 'Return',
        selected_item: selectedItems
      };
      const document = new this.customerToCustomerStockModel(saveObj);
      const insert = await document.save();

      await Promise.all(selectedItems.map(async (item) => {
        const product = products.find((p) => p._id.toString() === item.value);
        const productId = product._id;
        const product_name = product.product_name;
        const qty = item.qty;

        await this.pointReturnFromCustomer(req, {
          product_id: productId,
          qty,
          sender_customer_id: toObjectId(sender_customer_id),
          sender_customer_type_id: toObjectId(sender_customer_type_id),
          sender_customer_name: sender_customer_name,
          sender_login_type_id: sender_login_type_id,
          receiver_customer_id: toObjectId(receiver_customer_id),
          receiver_customer_name: receiver_customer_name,
          receiver_customer_type_id: toObjectId(receiver_customer_type_id),
          receiver_login_type_id: receiver_login_type_id,
          product_name: product_name,
          transfer_id: transferId
        });
      }));
      return this.res.success('SUCCESS.CREATE', { inserted_id: insert._id });
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

      result.product_detail = await this.customerToCustomerStockItemModel.find({ org_id: req['user']['org_id'], customer_id: toObjectId(result.receiver_customer_id) }).lean();

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