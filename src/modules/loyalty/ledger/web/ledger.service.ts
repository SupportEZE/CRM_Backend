import { CreationType } from 'src/modules/loyalty/ledger/web/dto/ledger.dto';
import { Injectable, HttpStatus } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { LedgerModel } from '../models/ledger.model';
import { CustomerLeaderBoardModel } from 'src/modules/master/customer/default/models/customer-leaderboard.model';

import { LeaderBoardModel } from 'src/modules/loyalty/leader-board/models/leader-board.model';
import { CustomerModel } from 'src/modules/master/customer/default/models/customer.model';
import { RedeemRequestModel } from '../../redeem-request/models/redeem-request.model';
import mongoose, { Model, Types } from 'mongoose';
import { ResponseService } from 'src/services/response.service';
import { manual } from 'rimraf';
import { toObjectId, commonFilters, convertToUtcRange } from 'src/common/utils/common.utils';

@Injectable()
export class LedgerService {
  constructor(
    @InjectModel(LedgerModel.name) private ledgerModel: Model<LedgerModel>,
    @InjectModel(CustomerModel.name)
    private customerModel: Model<CustomerModel>,
    @InjectModel(LeaderBoardModel.name)
    private leaderBoardModel: Model<LeaderBoardModel>,
    @InjectModel(CustomerLeaderBoardModel.name)
    private customerLeaderBoardModel: Model<CustomerLeaderBoardModel>,
    @InjectModel(RedeemRequestModel.name)
    private redeemRequestModel: Model<RedeemRequestModel>,
    private readonly res: ResponseService,
  ) { }

  async read(req: Request, params: any): Promise<any> {
    try {
      const user = req['user'];
      const isInfluencer =
        user.login_type_id === global.LOGIN_TYPE_ID['INFLUENCER'];

      const match: any = {
        is_delete: 0,
        org_id: user.org_id,
        customer_id: isInfluencer ? user._id : toObjectId(params.customer_id),
      };

      const sorting: Record<string, 1 | -1> =
        params?.sorting && Object.keys(params.sorting).length > 0
          ? params.sorting
          : { timestamp: -1 };

      const filters = params?.filters || {};
      const filterMatch = commonFilters(filters);
      Object.assign(match, filterMatch);

      const page = parseInt(params?.page) || global.PAGE;
      const limit = parseInt(params?.limit) || global.LIMIT;
      const skip = (page - 1) * limit;

      const basePipeline = [
        { $match: match },
        { $project: { created_unix_time: 0 } },
        { $sort: sorting },
      ];

      const totalCountData = await this.ledgerModel.aggregate([
        ...basePipeline,
        { $count: 'totalCount' },
      ]);
      const total = totalCountData[0]?.totalCount || 0;

      const result = await this.ledgerModel.aggregate([
        ...basePipeline,
        { $skip: skip },
        { $limit: limit },
      ]);

      return this.res.pagination(result, total, page, limit);
    } catch (error) {
      return this.res.error(HttpStatus.BAD_REQUEST, 'ERROR.BAD_REQ', error);
    }
  }

  async readTransactionCustomerWise(req: Request, params: any): Promise<any> {
    try {
      if (!params.customer_id) {
        throw new Error('Customer Id not found');
      }
      let match: Record<string, any> = {
        is_delete: 0,
        org_id: req['user']['org_id'],
        customer_id: toObjectId(params.customer_id),
      };

      const filters = params?.filters || {};
      const { start, end } = params?.custom_date_range || {};

      if (start && end) {
        match.created_at = {
          $gte: new Date(start),
          $lt: new Date(end),
        };
      }

      const finalMatch = { ...match, ...commonFilters(filters) };

      const transactionTypeSumPipeline = [
        { $match: finalMatch },
        {
          $group: {
            _id: '$creation_type',
            total_amount: { $sum: '$points' },
          },
        },
      ];
      const transactionTypeSumData = await this.ledgerModel.aggregate(
        transactionTypeSumPipeline,
      );
      if (transactionTypeSumData.length === 0) {
        return { default_type: 0 };
      }

      const transactionTypeSums = transactionTypeSumData.reduce(
        (acc: Record<string, number>, item: any) => {
          acc[item._id] = item.total_amount || 0;
          return acc;
        },
        {},
      );

      return transactionTypeSums;
    } catch (error) {
      throw new Error(error);
    }
  }

  async readTransactionTypeWise(req: Request, params: any): Promise<any> {
    try {
      if (!params.customer_type_id) {
        return this.res.error(
          HttpStatus.BAD_REQUEST,
          'ERROR.BAD_REQ',
          'Customer Type Id Missing',
        );
      }
      let match: Record<string, any> = {
        is_delete: 0,
        org_id: req['user']['org_id'],
        customer_type_id: params.customer_type_id,
      };

      if (!params.creation_type) {
        match = { ...match, creation_type: params.creation_type };
      }

      const filters = params?.filters || {};
      const { start, end } = params?.custom_date_range || {};

      if (start && end) {
        match.created_at = {
          $gte: new Date(start),
          $lt: new Date(end),
        };
      }

      const finalMatch = { ...match, ...commonFilters(filters) };

      const transactionTypeSumPipeline = [
        { $match: finalMatch },
        {
          $group: {
            _id: '$creation_type',
            total_amount: { $sum: '$points' },
          },
        },
      ];

      const transactionTypeSumData = await this.ledgerModel.aggregate(
        transactionTypeSumPipeline,
      );

      const transactionTypeSums = transactionTypeSumData.reduce(
        (acc: Record<string, number>, item: any) => {
          acc[item._id] = item.total_amount;
          return acc;
        },
        {},
      );

      return transactionTypeSums;
    } catch (error) {
      throw new Error(error);
    }
  }

  async balance(id: Record<string, any>): Promise<any> {
    try {
      let balance: number = 0;
      const match = { customer_id: id, is_delete: 0 };
      let latestLedger = await this.ledgerModel
        .findOne(match)
        .sort({ timestamp: -1 })
        .exec();
      if (latestLedger) return latestLedger.balance;
      return balance;
    } catch (error) {
      throw new Error(error);
    }
  }

  async create(req: Request, params: any): Promise<any> {
    try {
      params.customer_id = toObjectId(params.customer_id);
      params.customer_type_id = toObjectId(params.customer_type_id);

      const customerEntry = await this.customerModel
        .findOne({
          _id: params.customer_id,
        })
        .exec();

      if (!customerEntry) {
        return this.res.error(HttpStatus.NOT_FOUND, 'ERROR.NOT_FOUND');
      }

      const balance = await this.balance(params.customer_id);
      let newBalance = 0;

      if (params.transaction_type === 'credit') {
        newBalance = balance + params.points;
      } else if (params.transaction_type === 'debit') {
        newBalance = balance - params.points;
      } else {
        return 'Invalid transaction type.';
      }
      let indian_timestamp = convertToUtcRange(new Date(), new Date())
      const saveObj = {
        ...req['createObj'],
        timestamp: indian_timestamp.start,
        customer_id: params.customer_id,
        customer_name: params.customer_name,
        login_type_id: params.login_type_id,
        customer_type_id: params.customer_type_id,
        transaction_type: params.transaction_type,
        points: params.points,
        balance: newBalance,
        remark: params.remark,
        creation_type: params.creation_type ?? global.CREATION_TYPE[0],
      };

      const document = new this.ledgerModel(saveObj);
      const insert = await document.save();

      const updateObj = {
        transaction_id: insert.id,
      };

      await this.ledgerModel.updateOne(
        { _id: params._id },
        { $set: updateObj },
      );

      this.pointDistributionLeaderboard(req, params);
      return this.res.success('SUCCESS.CREATE');
    } catch (error) {
      return this.res.error(HttpStatus.BAD_REQUEST, 'ERROR.BAD_REQ', error);
    }
  }

  async wallet(req: Request, params: any): Promise<any> {
    try {
      params._id = toObjectId(params?.customer_id) || req['user']['_id'];

      if (!params.customer_id) {
        throw new Error('Customer Id not found');
      }
      params.customer_id = toObjectId(params.customer_id);

      const data: Record<string, number> =
        await this.readTransactionCustomerWise(req, params);

      let total_earned = 0;
      let redeemed = 0;
      let pending_transfer = 0;

      const balance = await this.balance(params.customer_id);

      total_earned =
        (data[global.CREATION_TYPE[0]] || 0) +
        (data[global.CREATION_TYPE[2]] || 0) +
        (data[global.CREATION_TYPE[3]] || 0) +
        (data[global.CREATION_TYPE[7]] || 0) +
        (data[global.CREATION_TYPE[8]] || 0) +
        (data[global.CREATION_TYPE[9]] || 0) +
        (data[global.CREATION_TYPE[10]] || 0) +
        (data[global.CREATION_TYPE[11]] || 0) +
        (data[global.CREATION_TYPE[12]] || 0) +
        (data[global.CREATION_TYPE[13]] || 0) +
        (data[global.CREATION_TYPE[14]] || 0) -
        (data[global.CREATION_TYPE[6]] || 0);

      redeemed =
        (data[global.CREATION_TYPE[1]] || 0) -
        (data[global.CREATION_TYPE[4]] || 0);

      const match = {
        customer_id: params.customer_id,
        transfer_status: global.APPROVAL_STATUS[0],
      };
      const pendingRedeem = await this.redeemRequestModel
        .aggregate([
          { $match: match },
          {
            $group: {
              _id: null,
              total_claim_point: { $sum: '$claim_point' },
            },
          },
        ])
        .exec();

      pending_transfer =
        pendingRedeem.length > 0 ? pendingRedeem[0].total_claim_point : 0;

      const finalData = { total_earned, redeemed, pending_transfer, balance };
      if (params?.internalCall) {
        return finalData
      }
      return this.res.success('SUCCESS.FETCH', finalData);
    } catch (error) {
      return this.res.error(
        HttpStatus.BAD_REQUEST,
        'ERROR.BAD_REQ',
        error?.message || 'An error occurred while fetching the data.',
      );
    }
  }

  async pointDistributionLeaderboard(req, params): Promise<any> {
    try {
      const customerEntry = await this.customerLeaderBoardModel
        .findOne({
          customer_id: params.customer_id,
        })
        .sort({ timestamp: -1 })
        .exec();

      if (customerEntry) {
        const leaderboard = await this.leaderBoardModel
          .findOne({
            _id: customerEntry.leader_board_id,
          })
          .exec();

        if (!leaderboard) {
          throw new Error('Leaderboard entry not found.');
        }

        const creation_type = params.creation_type ?? global.CREATION_TYPE[0];

        if (leaderboard.ledger_creation_type.includes(creation_type)) {
          const currentDate = new Date();

          if (leaderboard.end_date < currentDate) {
            let points = 0;
            if (creation_type === global.CREATION_TYPE[6]) {
              points = customerEntry.total_points - params.points;
            } else {
              points = customerEntry.total_points + params.points;
            }
            const updateObj = {
              ...req['updateObj'],
              total_points: points,
            };

            await this.customerLeaderBoardModel.updateOne(
              { _id: customerEntry._id },
              { $set: updateObj },
            );
          } else {
            return 'No Active Leaderboard';
          }
        } else {
          return 'Invalid creation type for leaderboard.';
        }
      } else {
        return 'Customer entry not found.';
      }

      return 'LEADERBOARD.POINTS_UPDATED';
    } catch (error) {
      throw new Error(
        error.message || 'An error occurred while updating leaderboard points.',
      );
    }
  }

  async getLast12MonthsPoints(
    req: Request,
    params: any,
  ): Promise<Array<{ month: string; total_points: number }>> {
    try {
      params._id = toObjectId(params?.customer_id) || req['user']['_id'];

      if (!params.customer_id) {
        throw new Error('Customer Id not found');
      }

      const customerId = toObjectId(params.customer_id);
      const orgId = req['user']['org_id'];

      const endDate = new Date();
      endDate.setHours(0, 0, 0, 0);
      const startDate = new Date(endDate);
      startDate.setMonth(endDate.getMonth() - 11);
      startDate.setDate(1);

      const match: Record<string, any> = {
        is_delete: 0,
        org_id: orgId,
        customer_id: customerId,
        created_at: { $gte: startDate, $lte: endDate },
      };

      const data = await this.ledgerModel.aggregate([
        { $match: match },
        {
          $group: {
            _id: {
              $dateToString: { format: '%Y-%m', date: '$created_at' },
            },
            total_points: { $sum: '$points' },
          },
        },
        { $sort: { _id: 1 } },
      ]);

      const pointsMap = new Map<string, number>();
      for (const entry of data) {
        pointsMap.set(entry._id, entry.total_points);
      }

      const result: Array<{ month: string; total_points: number }> = [];
      const current = new Date(endDate);

      for (let i = 11; i >= 0; i--) {
        const date = new Date(current.getFullYear(), current.getMonth() - i, 1);
        const monthStr = date.toISOString().slice(0, 7);
        result.push({
          month: monthStr,
          total_points: pointsMap.get(monthStr) || 0,
        });
      }

      return result;
    } catch (error) {
      throw new Error(error?.message || 'Failed to get last 12 months points');
    }
  }

  async getYearlyPointsComparison(req: Request, params: any): Promise<any> {
    try {
      params._id = toObjectId(params?.customer_id) || req['user']['_id'];
      if (!params.customer_id) {
        throw new Error('Customer Id not found');
      }

      const customerId = toObjectId(params.customer_id);
      const orgId = req['user']['org_id'];

      const now = new Date();
      const startDate = new Date(now.getFullYear() - 1, 0, 1); // Jan 1 of previous year
      const endDate = new Date(now.getFullYear(), 11, 31, 23, 59, 59); // Dec 31 of current year

      const match: Record<string, any> = {
        is_delete: 0,
        org_id: orgId,
        customer_id: customerId,
        created_at: { $gte: startDate, $lte: endDate },
      };

      const rawData = await this.ledgerModel.aggregate([
        { $match: match },
        {
          $group: {
            _id: {
              year: { $year: '$created_at' },
              month: { $month: '$created_at' },
            },
            total_points: { $sum: '$points' },
          },
        },
      ]);

      // Organize data into maps
      const monthlyData = { '2024': [], '2025': [] };
      const pointsMap = new Map<string, number>();

      rawData.forEach((entry) => {
        const year = entry._id.year;
        const month = String(entry._id.month).padStart(2, '0');
        const key = `${year}-${month}`;
        pointsMap.set(key, entry.total_points);
      });

      let total2024 = 0,
        total2025 = 0;
      for (let y of [2024, 2025]) {
        for (let m = 1; m <= 12; m++) {
          const key = `${y}-${String(m).padStart(2, '0')}`;
          const points = pointsMap.get(key) || 0;
          monthlyData[y.toString()].push({ month: key, total_points: points });
          if (y === 2024) total2024 += points;
          if (y === 2025) total2025 += points;
        }
      }

      const growthPercent =
        total2024 === 0
          ? total2025 > 0
            ? 100
            : 0
          : ((total2025 - total2024) / total2024) * 100;

      return {
        monthly_points: monthlyData,
        yearly_comparison: {
          '2024_total': total2024,
          '2025_total': total2025,
          growth_percent: parseFloat(growthPercent.toFixed(2)),
        },
      };
    } catch (error) {
      throw new Error(error?.message || 'Failed to get yearly points data.');
    }
  }

  async getPointsByType(req: Request, params: any): Promise<any> {
    try {
      const match: Record<string, any> = {
        is_delete: 0,
        org_id: req['user']['org_id'],
        customer_id: params.customer_ids?.map((id: any) => toObjectId(id)),
      };
      if (params?.creation_type) match.creation_type = params.creation_type;
      const data = await this.ledgerModel
        .find(match, {
          creation_type: 1,
          points: 1,
          customer_id: 1,
        })
        .sort({ created_at: -1 });
      return data;
    } catch (error) {
      throw error;
    }
  }

  async getCustomerPointsRankingData(req: Request, params: any): Promise<any> {
    try {
      const orgId = req['user']['org_id'];

      const customerObjectIds = params.customer_ids.map((id: any) =>
        toObjectId(id),
      );

      const match: Record<string, any> = {
        is_delete: 0,
        org_id: orgId,
        customer_id: { $in: customerObjectIds },
      };

      if (params?.creation_type) {
        match.creation_type = params.creation_type;
      }

      // 🔹 Aggregate total points per customer_id
      const result = await this.ledgerModel.aggregate([
        { $match: match },
        {
          $group: {
            _id: '$customer_id',
            total_points: { $sum: '$points' },
          },
        },
        {
          $project: {
            customer_id: '$_id',
            total_points: 1,
            _id: 0,
          },
        },
      ]);

      return result;
    } catch (error) {
      throw new Error(
        error?.message || 'Error in getCustomerPointsRankingData function',
      );
    }
  }
}
