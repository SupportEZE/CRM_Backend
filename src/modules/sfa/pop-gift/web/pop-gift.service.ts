import { HttpStatus, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { ResponseService } from 'src/services/response.service';
import { PopGiftTransactionModel } from '../models/pop-gift-transaction.model';
import { PopStockManageModel } from '../models/pop-stock-manage.model';
import { PopGiftModel } from '../models/pop-gift.model';
import { PopGiftDocsModel } from '../models/pop-gift-docs.model';
import { Model } from 'mongoose';
import {
  toObjectId,
  commonFilters,
  nextSeq,
  calculatePercentage,
} from 'src/common/utils/common.utils';
import { UserModel } from 'src/modules/master/user/models/user.model';
import { CustomerModel } from 'src/modules/master/customer/default/models/customer.model';
import { COLLECTION_CONST } from 'src/config/collection.constant';
import { S3Service } from 'src/shared/rpc/s3.service';
@Injectable()
export class PopGiftService {
  constructor(
    @InjectModel(PopGiftTransactionModel.name)
    private popGiftTransactionModel: Model<PopGiftTransactionModel>,
    @InjectModel(PopStockManageModel.name)
    private popStockManageModel: Model<PopStockManageModel>,
    @InjectModel(UserModel.name) private userModel: Model<UserModel>,
    @InjectModel(PopGiftModel.name) private popgiftModel: Model<PopGiftModel>,
    @InjectModel(PopGiftDocsModel.name)
    private popGiftDocsModel: Model<PopGiftDocsModel>,
    @InjectModel(CustomerModel.name)
    private customerModel: Model<CustomerModel>,
    private readonly res: ResponseService,
    private readonly s3Service: S3Service,
  ) {}
  async createPopGift(req: any, params: any): Promise<any> {
    try {
      const match: Record<string, any> = {
        is_delete: 0,
        org_id: req['user']['org_id'],
        product_name: params.product_name,
      };
      const exist: Record<string, any>[] = await this.popgiftModel
        .find(match)
        .exec();
      if (exist?.length > 0)
        return this.res.error(HttpStatus.BAD_REQUEST, 'WARNING.ALREADY_EXIST');

      const seq = {
        modelName: this.popgiftModel,
        idKey: 'product_code',
        prefix: 'PROD',
      };

      const product_code = await nextSeq(req, seq);
      const saveObj: Record<string, any> = {
        ...req['createObj'],
        ...params,
        product_code,
      };
      const document = new this.popgiftModel(saveObj);
      const insert = await document.save();
      return this.res.success('SUCCESS.CREATE', { inserted_id: insert._id });
    } catch (error) {
      return this.res.error(HttpStatus.BAD_REQUEST, 'ERROR.BAD_REQ', error);
    }
  }

  async readPopGift(req: Request, params: any): Promise<any> {
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
      const stockAgg = await this.popStockManageModel.aggregate([
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
        else if (s._id === 4) teamStock = s.total_stock;
        else if (s._id === 5) customerStock = s.total_stock;
      });

      const totalItems = await this.popgiftModel.countDocuments({
        is_delete: 0,
        org_id: orgId,
      });

      const distributed = teamStock + customerStock;
      const companyStockAndDistributed = companyStock + distributed;
      const distributionPercentage = calculatePercentage(
        distributed,
        companyStockAndDistributed,
      );

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
        const dataList = await this.popgiftModel
          .find(match)
          .skip(skip)
          .limit(limit)
          .sort(sorting)
          .lean();

        total = await this.popgiftModel.countDocuments(match);

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

            const stockAgg = await this.popStockManageModel.aggregate([
              { $match: stockMatch },
              {
                $group: {
                  _id: null,
                  total_stock: { $sum: '$stock_qty' },
                },
              },
            ]);

            item.stock_quantity = stockAgg[0]?.total_stock || 0;

            const lastTransaction = await this.popStockManageModel
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
        const tabId = activeTab === 'team_stock' ? 4 : 5;

        let tabMatch = {
          is_delete: 0,
          org_id: orgId,
          assigned_to_login_id: tabId,
        };
        tabMatch = { ...tabMatch, ...filters };

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

        const tabData = await this.popStockManageModel.aggregate(pipeline);
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

            const lastTransaction = await this.popStockManageModel
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

  async detailPopGift(req: Request, params: any): Promise<any> {
    try {
      const orgId = req['user']['org_id'];
      const isCompany = !!params._id;
      const isPopTransactionId = params.pop_transaction;
      let result: any = null;

      if (isPopTransactionId) {
        result = isCompany
          ? await this.popgiftModel
              .findOne({
                _id: toObjectId(params._id),
                org_id: orgId,
                is_delete: 0,
              })
              .lean()
          : { _id: null };
      } else {
        result = isCompany
          ? await this.popGiftTransactionModel
              .findOne({ _id: toObjectId(params._id), is_delete: 0 })
              .lean()
          : { _id: null };
      }
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
      return this.res.error(HttpStatus.BAD_REQUEST, 'ERROR.BAD_REQ', error);
    }
  }

  private async getTransactionDates(filter: any): Promise<any> {
    type LeanTransaction = { created_at: Date };

    const [first, last] = await Promise.all([
      this.popGiftTransactionModel
        .findOne({ ...filter, is_delete: 0 })
        .sort({ created_at: 1 })
        .select('created_at')
        .lean<LeanTransaction>(),

      this.popGiftTransactionModel
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
    const loginId = tab === 'Team' ? 4 : 5;

    return this.popStockManageModel.aggregate([
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
    return this.popStockManageModel.aggregate([
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
          from: COLLECTION_CONST().CRM_POP_GIFT,
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

      const totalCountData = await this.popGiftTransactionModel.aggregate([
        { $match: match },
        { $count: 'totalCount' },
      ]);
      const total =
        totalCountData.length > 0 ? totalCountData[0].totalCount : 0;

      const result = await this.popGiftTransactionModel
        .find(match)
        .skip(skip)
        .limit(limit)
        .sort(sorting)
        .lean();

      return {
        data: result,
        total,
        page,
        limit,
      };
    } catch (error) {
      return this.res.error(HttpStatus.BAD_REQUEST, 'ERROR.BAD_REQ', error);
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
        transaction_type,
        assigned_to_login_id,
      } = params;

      const productId = toObjectId(product_id);
      const saveObj: Record<string, any> = {
        ...req['createObj'],
        ...params,
        product_id: productId,
        created_login_id: req['user']['login_type_id'],
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
          assign_to_type,
          req,
        );
        if (!success)
          return this.res.error(
            HttpStatus.BAD_REQUEST,
            'POP_GIFT.ASSIGNED_FAILED',
          );
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
          return this.res.error(
            HttpStatus.BAD_REQUEST,
            'POP_GIFT.RETURN_FAILED',
          );
        await this.saveTransaction(saveObj);
      }

      return this.res.success('SUCCESS.CREATE');
    } catch (error) {
      return this.res.error(HttpStatus.BAD_REQUEST, 'ERROR.BAD_REQ', error);
    }
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
    await this.popStockManageModel.updateOne(
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
    assign_to_type: any,
    req: any,
  ): Promise<boolean> {
    const orgStock = await this.popStockManageModel.findOne({
      is_delete: 0,
      org_id: orgId,
      product_id: productId,
      assigned_to_login_id: orgId,
    });

    updateObj.updated_at = new Date();
    if (!orgStock || orgStock.stock_qty < qty) return false;

    await this.popStockManageModel.updateOne(
      { _id: orgStock._id },
      {
        $inc: { stock_qty: -qty },
        $set: updateObj,
      },
    );

    const existingStock = await this.popStockManageModel.findOne({
      is_delete: 0,
      org_id: orgId,
      product_id: productId,
      assigned_to_id: toObjectId(assigned_to_id),
    });

    if (existingStock) {
      await this.popStockManageModel.updateOne(
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
        assign_to_type: assign_to_type,
      };
      await new this.popStockManageModel(newStock).save();
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
    const customerStock = await this.popStockManageModel.findOne({
      is_delete: 0,
      org_id: orgId,
      product_id: productId,
      assigned_to_id: toObjectId(assigned_to_id),
    });
    updateObj.updated_at = new Date();
    if (!customerStock || customerStock.stock_qty < qty) return false;

    await this.popStockManageModel.updateOne(
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

    await this.popStockManageModel.updateOne(
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
    const document = new this.popGiftTransactionModel(data);
    await document.save();
  }

  async updatePopGift(req: any, params: any): Promise<any> {
    try {
      params._id = toObjectId(params._id);

      let match: Record<string, any> = {
        _id: params._id,
        org_id: req['user']['org_id'],
        is_delete: 0,
      };
      const exist: Record<string, any> = await this.popgiftModel
        .findOne(match)
        .exec();
      if (!exist)
        return this.res.error(HttpStatus.NOT_FOUND, 'WARNING.NOT_EXIST');
      const updateObj = {
        ...req['updateObj'],
        product_name: params.product_name,
        description: params.description,
      };
      await this.popgiftModel.updateOne(
        { _id: params._id },
        { $set: updateObj },
      );
      return this.res.success('SUCCESS.UPDATE');
    } catch (error) {
      return this.res.error(HttpStatus.BAD_REQUEST, 'ERROR.BAD_REQ', error);
    }
  }

  async deletePopGift(req: any, params: any): Promise<any> {
    try {
      const productId = toObjectId(params._id);
      const match: any = { _id: productId, is_delete: 0 };

      const exist = await this.popgiftModel.findOne(match).exec();
      if (!exist)
        return this.res.error(HttpStatus.NOT_FOUND, 'WARNING.NOT_EXIST');

      const updateObj = {
        ...req['updateObj'],
        is_delete: 1,
      };

      await this.popgiftModel.updateOne({ _id: productId }, updateObj);

      await this.popGiftTransactionModel.updateMany(
        { product_id: productId },
        { $set: { is_delete: 1, updated_at: new Date() } },
      );

      await this.popStockManageModel.updateMany(
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
        (key) => global.MODULES[key] === global.MODULES['Pop Gift'],
      );
      let response = await this.s3Service.uploadMultiple(
        files,
        req,
        this.popGiftDocsModel,
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
    return this.s3Service.getDocumentsByRowId(this.popGiftDocsModel, id, type);
  }

  async getDocumentByDocsId(req: any, params: any): Promise<any> {
    const doc = await this.s3Service.getDocumentsById(
      this.popGiftDocsModel,
      params._id,
    );
    return this.res.success('SUCCESS.FETCH', doc);
  }
}
