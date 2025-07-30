import { Injectable, HttpStatus } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { LedgerModel } from '../models/ledger.model';
import { RedeemRequestModel } from '../../redeem-request/models/redeem-request.model';
import { Model } from 'mongoose';
import { ResponseService } from 'src/services/response.service';
import { LeaderBoardModel } from '../../leader-board/models/leader-board.model';
import { CustomerLeaderBoardModel } from 'src/modules/master/customer/default/models/customer-leaderboard.model';
import { appCommonFilters, toObjectId } from 'src/common/utils/common.utils';

@Injectable()
export class AppLedgerService {
  constructor(
    @InjectModel(LeaderBoardModel.name)
    private leaderBoardModel: Model<LeaderBoardModel>,
    @InjectModel(CustomerLeaderBoardModel.name)
    private customerLeaderBoardModel: Model<CustomerLeaderBoardModel>,
    @InjectModel(LedgerModel.name) private ledgerModel: Model<LedgerModel>,
    @InjectModel(RedeemRequestModel.name)
    private redeemRequestModel: Model<RedeemRequestModel>,
    private readonly res: ResponseService,
  ) {}

  async read(req: Request, params: any): Promise<any> {
    try {
      let match: any = {
        is_delete: 0,
        org_id: req['user']['org_id'],
        customer_id: params.customer_id,
      };
      let sorting: Record<string, 1 | -1> = { _id: -1 };
      if (params?.filters?.search) {
        const fieldsToSearch = [
          'customer_name',
          'transaction_type',
          'creation_type',
        ];
        const searchQuery = appCommonFilters(params.filters, fieldsToSearch);
        match = { ...match, ...searchQuery };
      }

      if (params?.customer_id) {
        match.customer_id = toObjectId(params.customer_id);
      } else {
        match.customer_id = req['user']['_id'];
      }

      const page = parseInt(params?.page) || global.PAGE;
      const limit = parseInt(params?.limit) || global.LIMIT;
      const skip = (page - 1) * limit;

      const pipeline = [
        {
          $match: match,
        },
        {
          $project: {
            created_unix_time: 0,
          },
        },
        {
          $sort: sorting,
        },
      ];

      const totalCountData = await this.ledgerModel.aggregate([
        ...pipeline,
        { $count: 'totalCount' },
      ]);

      const total =
        totalCountData.length > 0 ? totalCountData[0].totalCount : 0;

      let result: any = await this.ledgerModel.aggregate([
        ...pipeline,
        { $skip: skip },
        { $limit: limit },
      ]);

      return this.res.pagination(result, total, page, limit);
    } catch (error) {
      return this.res.error(HttpStatus.BAD_REQUEST, 'ERROR.BAD_REQ', error);
    }
  }

  async balance(id: Record<string, any>): Promise<any> {
    try {
      let balance: number = 0;
      const match = { customer_id: id };
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
      if (
        !Object.values(global.TRANSACTION_TYPE).includes(
          params.transaction_type,
        )
      ) {
        return {
          status: 'LEDGER.INVALID_TRANSACTION_TYPE',
          message: 'Invalid transaction type.',
        };
      }

      if (!Object.values(global.CREATION_TYPE).includes(params.creation_type)) {
        return {
          status: 'LEDGER.INVALID_CREATION_TYPE',
          message: 'Invalid Creation Type.',
        };
      }

      if (typeof params.points !== 'number' || params.points <= 0) {
        return {
          status: 'LEDGER.INVALID_POINTS',
          message: 'Points must be a positive number.',
        };
      }

      const balance = await this.balance(params.customer_id);

      if (balance === null || balance === undefined) {
        return {
          status: 'LEDGER.INVALID_BALANCE',
          message: 'Customer balance not found.',
        };
      }

      let newBalance = 0;

      if (params.transaction_type === 'credit') {
        newBalance = balance + params.points;
      } else if (params.transaction_type === 'debit') {
        if (balance < params.points) {
          return {
            status: 'LEDGER.INSUFFICIENT_BALANCE',
            message: 'Insufficient balance for debit.',
          };
        }
        newBalance = balance - params.points;
      }

      if (
        !params.customer_name ||
        !params.login_type_id ||
        !params.customer_type_id ||
        !params.creation_type
      ) {
        return {
          status: 'LEDGER.MISSING_FIELDS',
          message:
            'Missing required fields (customer_name, login_type_id, customer_type_id, creation_type).',
        };
      }

      const saveObj = {
        ...req['createObj'],
        timestamp: new Date(),
        customer_id: params.customer_id,
        customer_name: params.customer_name,
        login_type_id: params.login_type_id,
        customer_type_id: params.customer_type_id,
        transaction_type: params.transaction_type,
        points: params.points,
        balance: newBalance,
        remark: params.remark,
        transaction_id: params.transaction_id,
        creation_type: params.creation_type,
      };

      const document = new this.ledgerModel(saveObj);
      await document.save();

      await this.pointDistributionLeaderboard(req, params);

      return {
        status: 'SUCCESS.CREATE',
        message: 'Transaction successfully recorded.',
        new_balance: newBalance,
      };
    } catch (error) {
      throw new Error(error);
    }
  }

  async readTransactionCustomerWise(req: Request, params: any): Promise<any> {
    try {
      let match: Record<string, any> = {
        is_delete: 0,
        org_id: req['user']['org_id'],
        customer_id: req['user']['_id'],
      };

      const { start, end } = params?.custom_date_range || {};

      if (start && end) {
        match.created_at = {
          $gte: new Date(start),
          $lt: new Date(end),
        };
      }

      const transactionTypeSumPipeline = [
        { $match: match },
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

  async wallet(req: Request, params: any): Promise<any> {
    try {
      let match: Record<string, any>;
      if (req?.url.includes(global.MODULE_ROUTES[27])) {
        match = { customer_id: toObjectId(params.customer_id) };
      } else {
        match = { customer_id: req['user']['_id'] };
      }

      const { start, end } = params?.custom_date_range || {};

      if (start && end) {
        match['created_at'] = {
          $gte: new Date(start),
          $lte: new Date(end),
        };
      }

      const data: Record<string, number> =
        await this.readTransactionCustomerWise(req, params);

      let total_earned = 0;
      let redeemed = 0;
      let pending_transfer = 0;

      const balance = await this.balance(req['user']['_id']);

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
        (data[global.CREATION_TYPE[14]] || 0) +
        (data[global.CREATION_TYPE[16]] || 0) -
        (data[global.CREATION_TYPE[6]] || 0);

      redeemed =
        (data[global.CREATION_TYPE[1]] || 0) -
        (data[global.CREATION_TYPE[4]] || 0);

      const redeemData = await this.redeemRequestModel
        .aggregate([
          { $match: match },
          {
            $group: {
              _id: null,
              total_claim_point: { $sum: '$claim_point' },
              last_redeem_date: { $max: '$created_at' },
            },
          },
        ])
        .exec();

      pending_transfer = redeemData[0]?.total_claim_point || 0;
      const last_redeem = redeemData[0]?.last_redeem_date || '';

      const last_transaction = await this.ledgerModel
        .findOne(
          {
            customer_id: req['user']['_id'],
          },
          { created_at: 1, points: 1, transaction_type: 1 },
        )
        .sort({ _id: -1 })
        .exec();

      const finalData = {
        total_earned,
        redeemed,
        pending_transfer,
        balance,
        last_transaction,
        last_redeem,
      };
      if (params?.internalCall) return finalData;
      return this.res.success('SUCCESS.FETCH', finalData);
    } catch (error) {
      return this.res.error(HttpStatus.BAD_REQUEST, 'ERROR.BAD_REQ', error);
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
      throw new Error(error);
    }
  }

  async readCustomerPointEarnByCategory(
    req: Request,
    params: any,
  ): Promise<any> {
    try {
      const orgId: number = req['user']['org_id'];
      const customerId = toObjectId(params.customer_id);

      const creationTypes: Record<string, any>[] = [
        global.CREATION_TYPE[2],
        global.CREATION_TYPE[3],
        global.CREATION_TYPE[7],
        global.CREATION_TYPE[8],
        global.CREATION_TYPE[9],
      ];

      const entries = await Promise.all(
        creationTypes.map(async (type) => {
          const aggregation = await this.ledgerModel.aggregate([
            {
              $match: {
                org_id: orgId,
                is_delete: 0,
                customer_id: customerId,
                creation_type: type,
              },
            },
            {
              $group: {
                _id: null,
                total_points: { $sum: '$points' },
                latest_date: { $max: '$created_at' },
              },
            },
          ]);

          const entry = aggregation[0];
          return {
            creation_type: type,
            points: entry?.total_points || 0,
            created_at: entry?.latest_date || null,
          };
        }),
      );

      const totalPoints = entries.reduce((sum, entry) => sum + entry.points, 0);
      const data = entries.map((item) => {
        const daysAgo = item.created_at
          ? Math.max(
              1,
              Math.floor(
                (Date.now() - new Date(item.created_at).getTime()) /
                  (1000 * 60 * 60 * 24),
              ),
            )
          : 0;

        return {
          creation_type: item.creation_type,
          points: item.points,
          percentage: totalPoints
            ? `${((item.points / totalPoints) * 100).toFixed(2)}%`
            : '0.00%',
          time_ago: `${daysAgo} day ↑`,
        };
      });
      return {
        total_points: totalPoints,
        growth_percent: '+2.74%',
        data,
      };
    } catch (error) {
      throw error;
    }
  }
}
