import { HttpStatus, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { ResponseService } from 'src/services/response.service';
import { SparePartTransactionModel } from '../models/spare-part-transaction.model';
import { SpareStockManageModel } from '../models/spare-stock-manage.model';
import { SparePartModel } from '../models/spare-part.model';
import { SparePartDocsModel } from '../models/spare-part-docs.model';
import { Model } from 'mongoose';
import {
  toObjectId,
  commonFilters,
  commonSearchFilter,
} from 'src/common/utils/common.utils';
import { UserModel } from 'src/modules/master/user/models/user.model';
import { CustomerModel } from 'src/modules/master/customer/default/models/customer.model';
import { COLLECTION_CONST } from 'src/config/collection.constant';
import { S3Service } from 'src/shared/rpc/s3.service';
 import{ SparePartRoutes } from './spare-part.controller';

export class SparePartService {
  constructor(
    @InjectModel(SparePartTransactionModel.name)
    private sparePartTransactionModel: Model<SparePartTransactionModel>,
    @InjectModel(SpareStockManageModel.name)
    private spareStockManageModel: Model<SpareStockManageModel>,
    @InjectModel(UserModel.name) private userModel: Model<UserModel>,
    @InjectModel(SparePartModel.name)
    private sparePartModel: Model<SparePartModel>,
    @InjectModel(SparePartDocsModel.name)
    private sparePartDocsModel: Model<SparePartDocsModel>,
    @InjectModel(CustomerModel.name)
    private customerModel: Model<CustomerModel>,
    private readonly res: ResponseService,
    private readonly s3Service: S3Service,
  ) {}

  async createSparePart(req: any, params: any): Promise<any> {
    try {
      const match: Record<string, any> = {
        is_delete: 0,
        org_id: req['user']['org_id'],
        product_name: params.product_name,
      };
      const exist: Record<string, any>[] = await this.sparePartModel
        .find(match)
        .exec();
      if (exist?.length > 0)
        return this.res.error(HttpStatus.BAD_REQUEST, 'WARNING.ALREADY_EXIST');

      const latest = await this.sparePartModel
        .findOne({ org_id: req['user']['org_id'] })
        .sort({ created_at: -1 })
        .lean();

      let newNumber = 1;
      if (latest && latest.product_code) {
        const lastNum = parseInt(latest.product_code.replace('PROD', ''), 10);
        if (!isNaN(lastNum)) {
          newNumber = lastNum + 1;
        }
      }

      const product_code = `PROD${String(newNumber).padStart(6, '0')}`;
      const saveObj: Record<string, any> = {
        ...req['createObj'],
        ...params,
        product_code,
      };
      const document = new this.sparePartModel(saveObj);
      const insert = await document.save();
      return this.res.success('SUCCESS.CREATE', { inserted_id: insert._id });
    } catch (error) {
      return this.res.error(HttpStatus.BAD_REQUEST, 'ERROR.BAD_REQ', error);
    }
  }

  async readSparePart(req: Request, params: any): Promise<any> {
    try {
      const orgId = req['user']['org_id'];
      const userId = req['user']['_id'];

      let match: any = { is_delete: 0, org_id: orgId };
      let sorting: Record<string, 1 | -1> = { _id: -1 };

      if (params?.sorting && Object.keys(params.sorting).length !== 0) {
        sorting = params.sorting;
      }

      const filters: Record<string, any> = commonFilters(params?.filters);
      match = { ...match, ...filters };

      const page: number = params?.page || global.PAGE;
      const limit: number = params?.limit || global.LIMIT;
      const skip: number = (page - 1) * limit;

      // ----- Summary Section -----
      const stockAgg = await this.spareStockManageModel.aggregate([
        {
          $match: {
            is_delete: 0,
            org_id: orgId,
          },
        },
        {
          $group: {
            _id: '$assigned_to_login_id',
            total_stock: { $sum: '$stock_qty' },
          },
        },
      ]);

      let companyStock = 0;
      let teamStock = 0;
      let customerStock = 0;

      stockAgg.forEach((s) => {
        if (s._id === 2) companyStock = s.total_stock;
        else if (s._id === 12) teamStock = s.total_stock;
        else if (s._id === 5) customerStock = s.total_stock;
      });

      const totalItems = await this.sparePartModel.countDocuments({
        is_delete: 0,
        org_id: orgId,
      });

      const distributed = teamStock + customerStock;
      const distributionPercentage =
        companyStock + distributed > 0
          ? ((distributed / (companyStock + distributed)) * 100).toFixed(2)
          : '0.00';

      const summaryStats = {
        totalItems,
        companyStock,
        teamStock,
        customerStock,
        distributionPercentage: `${distributionPercentage}%`,
      };

      const activeTab = params?.activeTab || 'company_stock';
      let result: any[] = [];
      let total = 0;

      if (activeTab === 'company_stock') {
        const dataList = await this.sparePartModel
          .find(match)
          .skip(skip)
          .limit(limit)
          .sort(sorting)
          .lean();

        total = await this.sparePartModel.countDocuments(match);

        result = await Promise.all(
          dataList.map(async (item: any) => {
            item.files = await this.getDocument(
              item._id,
              global.THUMBNAIL_IMAGE,
            );

            const stockMatch = {
              product_id: toObjectId(item._id.toString()),
              org_id: orgId,
              assigned_to_id: toObjectId(userId),
              is_delete: 0,
            };

            const stockAgg = await this.spareStockManageModel.aggregate([
              { $match: stockMatch },
              {
                $group: {
                  _id: null,
                  total_stock: { $sum: '$stock_qty' },
                },
              },
            ]);

            item.stock_quantity = stockAgg[0]?.total_stock || 0;

            const lastTransaction = await this.spareStockManageModel
              .findOne(stockMatch)
              .sort({ updated_at: -1 })
              .select('updated_at')
              .lean<{ updated_at: Date }>();

            if (lastTransaction?.updated_at) {
              item.last_transaction_date = lastTransaction.updated_at;
              item.last_transaction_days = this.getDaysDiff(
                new Date(lastTransaction.updated_at),
              );
            } else {
              item.last_transaction_date = null;
              item.last_transaction_days = null;
            }

            return item;
          }),
        );
      } else {
        const tabId = activeTab === 'team_stock' ? 12 : 5;

        const tabMatch = {
          is_delete: 0,
          org_id: orgId,
          assigned_to_login_id: tabId,
        };

        const pipeline = [
          { $match: tabMatch },
          {
            $group: {
              _id: '$assigned_to_id',
              assigned_to_name: { $first: '$assigned_to_name' },
              total_stock: { $sum: '$stock_qty' },
              total_items: { $addToSet: '$product_id' },
              created_at: { $first: '$created_at' },
              created_name: { $first: '$created_name' },
            },
          },
          {
            $project: {
              assigned_to_id: '$_id',
              assigned_to_name: 1,
              total_stock: 1,
              created_at: 1,
              created_name: 1,
              total_items: { $size: '$total_items' },
            },
          },
          { $skip: skip },
          { $limit: limit },
        ];

        const tabData = await this.spareStockManageModel.aggregate(pipeline);
        total = tabData.length;

        result = await Promise.all(
          tabData.map(async (item: any) => {
            item.stock_quantity = item.total_stock;
            delete item.total_stock;

            if (activeTab === 'team_stock') {
              const teamUser = await this.userModel
                .findOne({ _id: item.assigned_to_id }, { mobile: 1 })
                .lean();
              item.mobile = teamUser?.mobile || null;
            } else if (activeTab === 'distributor_stock') {
              const customer = await this.customerModel
                .findOne({ _id: item.assigned_to_id }, { mobile: 1 })
                .lean();
              item.mobile = customer?.mobile || null;
            }

            const lastTransaction = await this.spareStockManageModel
              .findOne({
                assigned_to_id: item.assigned_to_id,
                is_delete: 0,
                org_id: orgId,
              })
              .sort({ updated_at: -1 })
              .select('updated_at')
              .lean<{ updated_at: Date }>();

            if (lastTransaction?.updated_at) {
              item.last_transaction_date = lastTransaction.updated_at;
              item.last_transaction_days = this.getDaysDiff(
                new Date(lastTransaction.updated_at),
              );
            } else {
              item.last_transaction_date = null;
              item.last_transaction_days = null;
            }

            return item;
          }),
        );
      }

      const data: any = { summaryStats, result };
      return this.res.pagination(data, total, page, limit);
    } catch (error) {
      return this.res.error(HttpStatus.BAD_REQUEST, 'ERROR.BAD_REQ', error);
    }
  }

  private getDaysDiff(date: Date): number {
    const today = new Date();
    const diffTime = Math.abs(today.getTime() - date.getTime());
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }

  async detailSparePart(req: Request, params: any): Promise<any> {
    try {
      const orgId = req['user']['org_id'];
      const isCompany = !!params._id;
      const result: any = isCompany
        ? await this.sparePartModel
            .findOne({
              _id: toObjectId(params._id),
              org_id: orgId,
              is_delete: 0,
            })
            .lean()
        : { _id: null };

      if (isCompany && !result) {
        return this.res.error(HttpStatus.NOT_FOUND, 'ERROR.NOT_FOUND');
      }

      if (isCompany && params._id) {
        Object.assign(
          result,
          await this.getTransactionDates({
            product_id: toObjectId(params._id),
            org_id: orgId,
          }),
        );
      }

      if (!isCompany && params.assigned_to_id) {
        Object.assign(
          result,
          await this.getTransactionDates({
            assigned_to_id: toObjectId(params.assigned_to_id),
            org_id: orgId,
          }),
        );
        Object.assign(
          result,
          await this.getAssignedToDetails(params.assigned_to_id),
        );
      }

      const transactionFilters: Record<string, any> = {
        org_id: orgId,
        is_delete: 0,
      };

      if (isCompany) {
        transactionFilters.product_id = toObjectId(params._id);

        if (params.activeTab === 'Incoming') {
          transactionFilters.$or = [
            { transaction_type: 'Return', assign_to_type: 'Customer' },
            { transaction_type: 'Return', assign_to_type: 'Team' },
            { transaction_type: 'Fresh Purchase', assign_to_type: 'Vendor' },
          ];
        } else if (params.activeTab === 'Outgoing') {
          transactionFilters.transaction_type = 'Assign';
          transactionFilters.assign_to_type = { $in: ['Customer', 'Team'] };
        } else if (['Team', 'Customer'].includes(params.activeTab)) {
          result.stock_history = await this.getCompanyStockByUserType(
            params._id,
            orgId,
            params.activeTab,
          );
          return this.res.success('SUCCESS.FETCH', result);
        }
      } else {
        transactionFilters.assigned_to_id = toObjectId(params.assigned_to_id);

        if (params.activeTab === 'Incoming') {
          transactionFilters.transaction_type = 'Assign';
        } else if (params.activeTab === 'Outgoing') {
          transactionFilters.transaction_type = 'Return';
        } else if (params.activeTab === 'Product') {
          result.stock_history = await this.getProductStockSummary(
            orgId,
            params.assigned_to_id,
          );
          return this.res.success('SUCCESS.FETCH', result);
        }
      }

      const stockHistory = await this.readManageStockInternal(req, {
        filters: transactionFilters,
        page: 1,
        limit: 50,
      });

      result.stock_history = stockHistory.data;
      return this.res.success('SUCCESS.FETCH', result);
    } catch (error) {
      console.error('Error in detailSparePart:', error);
      return this.res.error(HttpStatus.BAD_REQUEST, 'ERROR.BAD_REQ', error);
    }
  }

  private async getTransactionDates(filter: any): Promise<any> {
    type LeanTransaction = { created_at: Date };

    const [first, last] = await Promise.all([
      this.sparePartTransactionModel
        .findOne({ ...filter, is_delete: 0 })
        .sort({ created_at: 1 })
        .select('created_at')
        .lean<LeanTransaction>(),

      this.sparePartTransactionModel
        .findOne({ ...filter, is_delete: 0 })
        .sort({ created_at: -1 })
        .select('created_at')
        .lean<LeanTransaction>(),
    ]);

    const now = new Date();
    const lastDate = last?.created_at ? new Date(last.created_at) : null;
    const diffDays = lastDate
      ? Math.floor(
          Math.abs(now.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24),
        )
      : null;

    return {
      first_transaction_date: first?.created_at || null,
      last_transaction_date: lastDate,
      last_transaction_days: diffDays,
    };
  }

  private async getAssignedToDetails(assignedId: string): Promise<any> {
    const [user, customer] = await Promise.all([
      this.userModel.findOne({ _id: toObjectId(assignedId) }).lean(),
      this.customerModel.findOne({ _id: toObjectId(assignedId) }).lean(),
    ]);

    if (user) {
      return {
        assigned_to_name: user.name,
        mobile: user.mobile,
      };
    } else if (customer) {
      return {
        assigned_to_name: customer.customer_name,
        mobile: customer.mobile,
      };
    }
    return {};
  }

  private async getCompanyStockByUserType(
    productId: string,
    orgId: string,
    tab: 'Team' | 'Customer',
  ): Promise<any[]> {
    const loginId = tab === 'Team' ? 12 : 5;

    return this.spareStockManageModel.aggregate([
      {
        $match: {
          product_id: toObjectId(productId),
          org_id: orgId,
          assigned_to_login_id: loginId,
          is_delete: 0,
        },
      },
      {
        $group: {
          _id: '$assigned_to_id',
          total_stock: { $sum: '$stock_qty' },
          assigned_to_name: { $first: '$assigned_to_name' },
        },
      },
      {
        $project: {
          assigned_to_id: '$_id',
          assigned_to_name: 1,
          total_stock: 1,
          _id: 0,
        },
      },
    ]);
  }

  private async getProductStockSummary(
    orgId: string,
    assignedToId: string,
  ): Promise<any[]> {
    return this.spareStockManageModel.aggregate([
      {
        $match: {
          org_id: orgId,
          assigned_to_id: toObjectId(assignedToId),
          is_delete: 0,
        },
      },
      {
        $group: {
          _id: '$product_id',
          product_name: { $first: '$product_name' },
          stock_qty: { $sum: '$stock_qty' },
        },
      },
      {
        $lookup: {
          from: COLLECTION_CONST().CRM_SPARE_PART,
          localField: '_id',
          foreignField: '_id',
          as: 'product_info',
        },
      },
      { $unwind: { path: '$product_info', preserveNullAndEmptyArrays: true } },
      {
        $project: {
          product_id: '$_id',
          product_name: 1,
          stock_qty: 1,
          product_code: '$product_info.product_code',
          _id: 0,
        },
      },
    ]);
  }

  private async readManageStockInternal(
    req: Request,
    params: any,
  ): Promise<any> {
    try {
      const match = this.buildTransactionMatchFilter(req, params?.filters);
      let sorting: Record<string, 1 | -1> = { _id: -1 };
      const page = params?.page || global.PAGE;
      const limit = params?.limit || global.LIMIT;
      const skip = (page - 1) * limit;

      const totalCountData = await this.sparePartTransactionModel.aggregate([
        { $match: match },
        { $count: 'totalCount' },
      ]);
      const total =
        totalCountData.length > 0 ? totalCountData[0].totalCount : 0;

      const result = await this.sparePartTransactionModel
        .find(match)
        .skip(skip)
        .limit(limit)
        .sort(sorting)
        .lean();

      return { data: result, total, page, limit };
    } catch (error) {
      console.error('Error in readManageStockInternal:', error);
      throw new Error('Error while fetching stock transactions');
    }
  }

  private buildTransactionMatchFilter(
    req: Request,
    filters: Record<string, any> = {},
  ): Record<string, any> {
    const match: Record<string, any> = {
      is_delete: 0,
      org_id: req['user']['org_id'],
    };

    if (filters._id) {
      match.product_id = toObjectId(filters._id);
    }

    if (filters.assigned_to_id) {
      match.assigned_to_id = toObjectId(filters.assigned_to_id);
    }

    for (const [key, value] of Object.entries(filters)) {
      if (
        value !== undefined &&
        value !== null &&
        key !== '_id' &&
        key !== 'assigned_to_id'
      ) {
        match[key] = value;
      }
    }

    return match;
  }

  async readDropdown(req: Request, params: any): Promise<any> {
    try {
      let match: Record<string, any> = {
        is_delete: 0,
        org_id: req['user']['org_id'],
      };

      const sorting: Record<string, 1 | -1> = { _id: -1 };

      const spareParts: Record<string, any>[] = await this.sparePartModel
        .find(match)
        .exec();
      const productIds = spareParts.map((row: any) => row._id);

      if (productIds.length === 0) {
        return this.res.success('SUCCESS.FETCH', []);
      }

      match.product_id = { $in: productIds };
      match.assigned_to_id = toObjectId(params._id);

      const searchableFields = ['product_name'];
      const filters = commonSearchFilter(params.filters, searchableFields);
      match = { ...match, ...filters };

      const page = Math.max(1, parseInt(params?.page, 10) || global.PAGE);
      const limit = Math.max(1, parseInt(params?.limit, 10) || global.LIMIT);
      const skip = (page - 1) * limit;

      let data: Record<string, any>[] = await this.spareStockManageModel
        .find(match, {
          _id: 1,
          product_name: 1,
          product_id: 1,
          stock_qty: 1,
        })
        .sort(sorting)
        .skip(skip)
        .limit(limit)
        .lean();

      data = data.map((row: any) => {
        const matchedSpare = spareParts.find(
          (sp) => String(sp._id) === String(row.product_id),
        );
        return {
          _id: row._id,
          value: row.product_id,
          label: row.product_name,
          product_code: matchedSpare.product_code,
          mrp: matchedSpare?.mrp || 0,
        };
      });

      return this.res.success('SUCCESS.FETCH', data);
    } catch (error) {
      return this.res.error(HttpStatus.BAD_REQUEST, 'ERROR.BAD_REQ', error);
    }
  }

  async createManageStock(req: any, params: any): Promise<any> {
    try {
      const orgId = req['user']['org_id'];
      const {
        product_id,
        product_name,
        transaction_qty,
        assign_to_type,
        assigned_to_id,
        assigned_to_name,
        assigned_to_login_id,
        transaction_type,
        assign_from_type,
        assigned_from_id,
        assigned_from_name,
        assigned_from_login_id,
      } = params;

      const productId = toObjectId(product_id);

      const saveObj: Record<string, any> = {
        ...req['createObj'],
        ...params,
        product_id: productId,
        created_login_id: req['user']['login_type_id'],
        assigned_to_id: toObjectId(assigned_to_id),
        assigned_to_name,
      };

      const updateObj = { ...req['updateObj'] };

      if (
        transaction_type === 'Fresh Purchase' &&
        assign_to_type === 'Vendor'
      ) {
        await this.handleFreshPurchase(
          orgId,
          productId,
          req['user'],
          product_name,
          transaction_qty,
          updateObj,
        );
        await this.saveTransaction(saveObj);
      } else if (
        transaction_type === 'Assign' &&
        ['Customer', 'Team'].includes(assign_to_type)
      ) {
        const success = await this.assignStockToUser(
          orgId,
          productId,
          product_name,
          transaction_qty,
          assigned_to_id,
          assigned_to_login_id,
          assigned_to_name,
          updateObj,
          req,
        );
        if (!success)
          return this.res.error(HttpStatus.BAD_REQUEST, 'SPARE_PART.NOT_EXIST');
        await this.saveTransaction(saveObj);
      } else if (
        transaction_type === 'Return' &&
        ['Customer', 'Team'].includes(assign_to_type)
      ) {
        const success = await this.returnStockToOrg(
          orgId,
          productId,
          product_name,
          transaction_qty,
          assigned_to_id,
          req['user'],
          updateObj,
        );
        if (!success)
          return this.res.error(HttpStatus.BAD_REQUEST, 'SPARE_PART.NOT_EXIST');
        await this.saveTransaction(saveObj);
      } else if (
        transaction_type === 'External' &&
        ['Customer', 'Team'].includes(assign_to_type) &&
        ['Customer', 'Team'].includes(assign_from_type)
      ) {
        let effectiveAssignToType: string;

        if (assign_from_type === 'Customer') {
          effectiveAssignToType = 'Team';
        } else {
          effectiveAssignToType = 'Customer';
        }

        const senderInfo = {
          _id: assigned_from_id,
          login_type_id: req['user']['login_type_id'],
          name: assigned_from_name,
          assign_to_type: effectiveAssignToType,
        };

        const success = await this.assignStockUserToUser(
          orgId,
          productId,
          product_name,
          transaction_qty,
          assigned_to_id,
          assigned_to_login_id,
          assigned_to_name,
          senderInfo,
          updateObj,
          req,
        );

        if (!success)
          return this.res.error(HttpStatus.BAD_REQUEST, 'SPARE_PART.NOT_EXIST');

        await this.saveTransactionWithSender({
          ...saveObj,
          assigned_from_id: toObjectId(assigned_from_id),
          assigned_from_name,
          assign_from_type,
          assigned_from_login_id,
          assign_to_type: effectiveAssignToType,
        });
      }

      return this.res.success('SUCCESS.CREATE');
    } catch (error) {
      return this.res.error(HttpStatus.BAD_REQUEST, 'ERROR.BAD_REQ', error);
    }
  }

  private async assignStockUserToUser(
    orgId: any,
    productId: any,
    product_name: string,
    qty: number,
    receiver_id: any,
    receiver_login_id: any,
    receiver_name: string,
    sender: any, // {_id, login_type_id, name}
    updateObj: any,
    req: any,
  ): Promise<boolean> {
    updateObj.updated_at = new Date();

    // Subtract stock from sender
    const senderStock = await this.spareStockManageModel.findOne({
      is_delete: 0,
      org_id: orgId,
      product_id: productId,
      assigned_to_id: toObjectId(sender._id),
      assigned_to_login_id: sender.login_type_id,
    });

    if (!senderStock || senderStock.stock_qty < qty) return false;

    await this.spareStockManageModel.updateOne(
      { _id: senderStock._id },
      {
        $inc: { stock_qty: -qty },
        $set: updateObj,
      },
    );

    // Add stock to receiver
    const receiverStock = await this.spareStockManageModel.findOne({
      is_delete: 0,
      org_id: orgId,
      product_id: productId,
      assigned_to_id: toObjectId(receiver_id),
      assigned_to_login_id: receiver_login_id,
    });

    if (receiverStock) {
      await this.spareStockManageModel.updateOne(
        { _id: receiverStock._id },
        {
          $inc: { stock_qty: qty },
          $set: updateObj,
        },
      );
    } else {
      const newStock: Record<string, any> = {
        ...req['createObj'],
        org_id: orgId,
        product_id: productId,
        assigned_to_id: toObjectId(receiver_id),
        assigned_to_login_id: receiver_login_id,
        assigned_to_name: receiver_name,
        product_name,
        stock_qty: qty,
        assign_to_type: req['params']['assign_to_type'],
      };
      await new this.spareStockManageModel(newStock).save();
    }

    return true;
  }

  private async saveTransactionWithSender(data: any) {
    if (data.assigned_to_id && typeof data.assigned_to_id === 'string') {
      data.assigned_to_id = toObjectId(data.assigned_to_id);
    }
    if (data.product_id && typeof data.product_id === 'string') {
      data.product_id = toObjectId(data.product_id);
    }
    if (data.assigned_from_id && typeof data.assigned_from_id === 'string') {
      data.assigned_from_id = toObjectId(data.assigned_from_id);
    }

    const document = new this.sparePartTransactionModel(data);
    await document.save();
  }

  private async handleFreshPurchase(
    orgId: any,
    productId: any,
    user: any,
    product_name: string,
    qty: number,
    updateObj: any,
  ) {
    updateObj.updated_at = new Date();
    await this.spareStockManageModel.updateOne(
      {
        is_delete: 0,
        org_id: orgId,
        product_id: productId,
        assigned_to_login_id: orgId,
        assigned_to_id: toObjectId(user['_id']),
        assigned_to_name: user['name'],
        product_name,
      },
      {
        $inc: { stock_qty: qty },
        $set: updateObj,
      },
      { upsert: true },
    );
  }

  private async assignStockToUser(
    orgId: any,
    productId: any,
    product_name: string,
    qty: number,
    assigned_to_id: any,
    assigned_to_login_id: any,
    assigned_to_name: string,
    updateObj: any,
    req: any,
  ): Promise<boolean> {
    const orgStock = await this.spareStockManageModel.findOne({
      is_delete: 0,
      org_id: orgId,
      product_id: productId,
      assigned_to_login_id: orgId,
    });

    updateObj.updated_at = new Date();
    if (!orgStock || orgStock.stock_qty < qty) return false;

    await this.spareStockManageModel.updateOne(
      { _id: orgStock._id },
      {
        $inc: { stock_qty: -qty },
        $set: updateObj,
      },
    );

    const existingStock = await this.spareStockManageModel.findOne({
      is_delete: 0,
      org_id: orgId,
      product_id: productId,
      assigned_to_id: toObjectId(assigned_to_id),
    });

    if (existingStock) {
      await this.spareStockManageModel.updateOne(
        {
          _id: existingStock._id,
          assigned_to_login_id,
        },
        {
          $inc: { stock_qty: qty },
          $set: updateObj,
        },
      );
    } else {
      const newStock: Record<string, any> = {
        ...req['createObj'],
        org_id: orgId,
        product_id: productId,
        assigned_to_id: toObjectId(assigned_to_id),
        assigned_to_login_id,
        assigned_to_name,
        product_name,
        stock_qty: qty,
        assign_to_type: 'Customer',
      };
      await new this.spareStockManageModel(newStock).save();
    }
    return true;
  }

  private async returnStockToOrg(
    orgId: any,
    productId: any,
    product_name: string,
    qty: number,
    assigned_to_id: any,
    user: any,
    updateObj: any,
  ): Promise<boolean> {
    const customerStock = await this.spareStockManageModel.findOne({
      is_delete: 0,
      org_id: orgId,
      product_id: productId,
      assigned_to_id: toObjectId(assigned_to_id),
    });
    updateObj.updated_at = new Date();
    if (!customerStock || customerStock.stock_qty < qty) return false;

    await this.spareStockManageModel.updateOne(
      {
        is_delete: 0,
        org_id: orgId,
        product_id: productId,
        assigned_to_id: toObjectId(assigned_to_id),
      },
      {
        $inc: { stock_qty: -qty },
        $set: updateObj,
      },
    );

    await this.spareStockManageModel.updateOne(
      {
        is_delete: 0,
        org_id: orgId,
        product_id: productId,
        assigned_to_id: toObjectId(user['_id']),
        assigned_to_name: user['name'],
        product_name,
        assigned_to_login_id: orgId,
      },
      {
        $inc: { stock_qty: qty },
        $set: updateObj,
      },
      { upsert: true },
    );

    return true;
  }

  private async saveTransaction(data: any) {
    if (data.assigned_to_id && typeof data.assigned_to_id === 'string') {
      data.assigned_to_id = toObjectId(data.assigned_to_id);
    }
    if (data.product_id && typeof data.product_id === 'string') {
      data.product_id = toObjectId(data.product_id);
    }
    const document = new this.sparePartTransactionModel(data);
    await document.save();
  }

  async updateSparePart(req: any, params: any): Promise<any> {
    try {
      params._id = toObjectId(params._id);

      let match: Record<string, any> = {
        _id: params._id,
        org_id: req['user']['org_id'],
        is_delete: 0,
      };
      const exist: Record<string, any> = await this.sparePartModel
        .findOne(match)
        .exec();
      if (!exist)
        return this.res.error(HttpStatus.NOT_FOUND, 'WARNING.NOT_EXIST');
      const updateObj = {
        ...req['updateObj'],
        product_name: params.product_name,
        description: params.description,
        mrp: params.mrp,
      };
      await this.sparePartModel.updateOne(
        { _id: params._id },
        { $set: updateObj },
      );
      return this.res.success('SUCCESS.UPDATE');
    } catch (error) {
      return this.res.error(HttpStatus.BAD_REQUEST, 'ERROR.BAD_REQ', error);
    }
  }

  async deleteSparePart(req: any, params: any): Promise<any> {
    try {
      const productId = toObjectId(params._id);
      const match: any = { _id: productId, is_delete: 0 };

      const exist = await this.sparePartModel.findOne(match).exec();
      if (!exist)
        return this.res.error(HttpStatus.NOT_FOUND, 'WARNING.NOT_EXIST');

      const updateObj = {
        ...req['updateObj'],
        is_delete: 1,
      };

      await this.sparePartModel.updateOne({ _id: productId }, updateObj);

      await this.sparePartTransactionModel.updateMany(
        { product_id: productId },
        { $set: { is_delete: 1, updated_at: new Date() } },
      );

      await this.spareStockManageModel.updateMany(
        { product_id: productId },
        { $set: { is_delete: 1, updated_at: new Date() } },
      );

      return this.res.success('SUCCESS.DELETE');
    } catch (error) {
      return this.res.error(HttpStatus.BAD_REQUEST, 'ERROR.BAD_REQ', error);
    }
  }

  async upload(files: Express.Multer.File[], req: any): Promise<any> {
    try {
      req.body.module_name = Object.keys(global.MODULES).find(
        (key) => global.MODULES[key] === global.MODULES['Spare Part'],
      );
      let response = await this.s3Service.uploadMultiple(
        files,
        req,
        this.sparePartDocsModel,
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
      this.sparePartDocsModel,
      id,
      type,
    );
  }
  async webRead(req: Request, params: any): Promise<any> {
    try {
      const orgId = req['user']['org_id'];
  
      const filters: Record<string, any> = commonFilters(params?.filters);
      let match: Record<string, any> = {
        is_delete: 0,
        org_id: orgId,
        ...filters,
      };
  
      const sorting: Record<string, 1 | -1> = { _id: -1 };
  
      const page: number = params?.page || global.PAGE;
      let limit: number = params?.limit || global.LIMIT;
      const skip: number = (page - 1) * limit;
  
      if (req?.url.includes(SparePartRoutes.READ_DROPDOWN)) {
        limit = global.OPTIONS_LIMIT;
      }
  
      const pipeline: any[] = [
        { $match: match },
        {
          $lookup: {
            from: COLLECTION_CONST().CRM_SPARE_PART,
            localField: 'product_id',
            foreignField: '_id',
            as: 'product',
          },
        },
        { $unwind: '$product' },
        {
          $lookup: {
            from: COLLECTION_CONST().CRM_SPARE_PART_TRANSACTION,
            let: { pid: '$product_id', aid: '$assigned_to_id' },
            pipeline: [
              {
                $match: {
                  $expr: {
                    $and: [
                      { $eq: ['$product_id', '$$pid'] },
                      { $eq: ['$assigned_to_id', '$$aid'] },
                    ],
                  },
                },
              },
              { $sort: { created_at: -1 } },
              { $limit: 1 },
              { $project: { created_at: 1 } },
            ],
            as: 'last_txn',
          },
        },
        {
          $addFields: {
            qty: '$stock_qty',
            last_transaction_date: {
              $ifNull: [{ $arrayElemAt: ['$last_txn.created_at', 0] }, null],
            },
          },
        },
        {
          $project: {
            qty: 1,
            last_transaction_date: 1,
            'product._id': 1,
            'product.product_code': 1,
            'product.product_name': 1,
            'product.description': 1,
            'product.mrp': 1,
            assigned_to_id: 1,
          },
        },
        { $sort: sorting },
      ];
  
      const countPipeline = [...pipeline, { $count: 'total' }];
      const countResult = await this.spareStockManageModel.aggregate(countPipeline);
      const total = countResult[0]?.total || 0;
  
      if (req?.url.includes(SparePartRoutes.READ)) {
        pipeline.push({ $skip: skip }, { $limit: limit });
      } else if (req?.url.includes(SparePartRoutes.READ_DROPDOWN)) {
        pipeline.push({ $limit: limit });
      }
  
      const data = await this.spareStockManageModel.aggregate(pipeline);
  
      if (req?.url.includes(SparePartRoutes.READ_DROPDOWN)) {
        const dropdown = data.map((row: any) => ({
          value: row.product._id,
          product_code: row.product.product_code,
          label: row.product.product_name,
          description: row.product.description,
          qty: row.qty,
        }));
        return this.res.success('SUCCESS.FETCH', dropdown);
      }
  
      const formattedData = data.map((row: any) => ({
        _id: row.product._id,
        product_code: row.product.product_code,
        product_name: row.product.product_name,
        description: row.product.description,
        qty: row.qty,
        last_transaction_date: row.last_transaction_date,
      }));
  
      return this.res.pagination(formattedData, total, page, limit);
    } catch (error) {
      return this.res.error(HttpStatus.BAD_REQUEST, 'ERROR.BAD_REQ', error);
    }
  }
  
  
  async getDocumentByDocsId(req: any, params: any): Promise<any> {
    const doc = await this.s3Service.getDocumentsById(
      this.sparePartDocsModel,
      params._id,
    );
    return this.res.success('SUCCESS.FETCH', doc);
  }
}




