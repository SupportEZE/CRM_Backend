import { Injectable, HttpStatus } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { toObjectId } from 'src/common/utils/common.utils';
import { ResponseService } from 'src/services/response.service';
import { Model } from 'mongoose';
import { LeaderBoardModel } from '../models/leader-board.model';
import { S3Service } from 'src/shared/rpc/s3.service';
import { CustomerLeaderBoardModel } from 'src/modules/master/customer/default/models/customer-leaderboard.model';
import { CustomerModel } from 'src/modules/master/customer/default/models/customer.model';
import { LeaderBoardGiftsModel } from '../models/leader-board-gifts.model';
import { LedgerModel } from 'src/modules/loyalty/ledger/models/ledger.model';
import { commonFilters } from 'src/common/utils/common.utils';
import { LeaderBoardDocsModel } from '../models/leader-board-docs.moel';

@Injectable()
export class LeaderBoardService {
  constructor(
    @InjectModel(LeaderBoardModel.name)
    private leaderboardModel: Model<LeaderBoardModel>,
    @InjectModel(LeaderBoardDocsModel.name)
    private leaderBoardDocsModel: Model<LeaderBoardDocsModel>,
    @InjectModel(LeaderBoardGiftsModel.name)
    private leaderboardgiftsModel: Model<LeaderBoardGiftsModel>,
    @InjectModel(LedgerModel.name) private ledgerModel: Model<LedgerModel>,
    @InjectModel(CustomerLeaderBoardModel.name)
    private customerLeaderBoardModel: Model<CustomerLeaderBoardModel>,

    @InjectModel(CustomerModel.name)
    private customerModel: Model<CustomerModel>,

    private readonly res: ResponseService,
    private readonly s3Service: S3Service,
  ) {}

  async create(req: Request, params: any): Promise<any> {
    try {
      let match = { org_id: req['user']['org_id'], is_delete: 0 };

      if(params?.customer_type_name) {
        match['customer_type_name'] =  params?.customer_type_name;
      }

      const exist = await this.leaderboardModel
        .find({
          ...match,
          state: { $in: params.state },
          $or: [
            {
              start_date: { $lte: new Date(params.start_date) },
              end_date: { $gte: new Date(params.start_date) },
            },
            {
              start_date: { $lte: new Date(params.end_date) },
              end_date: { $gte: new Date(params.end_date) },
            }
          ]
        })
        .exec();

      if (exist.length > 0) {
        return this.res.error(HttpStatus.CONFLICT, 'LEADERBOARD.ALREADY_EXIST');
      }

      const state_filter = { state: { $in: params.state } };
      const customerFilter = { ...match, ...state_filter };

      const statesCustomer = await this.customerModel
        .find(customerFilter)
        .exec();
      if (statesCustomer.length === 0) {
        return this.res.error(
          HttpStatus.BAD_REQUEST,
          'LEADERBOARD.NO_CUSTOMER',
        );
      }

      const customerIds = statesCustomer.map((customer) => customer._id);

      const gift_detail = params.gift_detail;
      delete params.gift_detail;

      const leaderboardSaveObj = {
        ...req['createObj'],
        ...params,
      };

      const leaderboardDocument = new this.leaderboardModel(leaderboardSaveObj);
      const leaderboardInsert = await leaderboardDocument.save();

      if (
        leaderboardInsert._id &&
        Array.isArray(gift_detail) &&
        gift_detail.length > 0
      ) {
        const giftPromises = gift_detail.map(async (data) => {
          const saveGift = {
            ...req['createObj'],
            ...data,
            leader_board_id: leaderboardInsert._id,
          };

          const gift = new this.leaderboardgiftsModel(saveGift);
          await gift.save();
        });

        await Promise.all(giftPromises);
      }

      const customerLeaderBoardPromises = customerIds.map(
        async (customerId) => {
          const customer = statesCustomer.find(
            (c) => c._id.toString() === customerId.toString(),
          );
          const customerName = customer ? customer.customer_name : 'Unknown';

          const customerSaveObj = {
            ...req['createObj'],
            timestamp: new Date(),
            leader_board_id: leaderboardInsert._id,
            customer_id: customerId,
            customer_name: customerName,
            total_points: 0,
          };

          const customerLeaderBoardDocument = new this.customerLeaderBoardModel(
            customerSaveObj,
          );
          await customerLeaderBoardDocument.save();
        },
      );

      await Promise.all(customerLeaderBoardPromises);
      const response = {
        inserted_id: leaderboardInsert._id,
      };
      return this.res.success('SUCCESS.CREATE', response);
    } catch (error) {
      return this.res.error(HttpStatus.BAD_REQUEST, 'ERROR.BAD_REQ', error);
    }
  }

  async read(req: any, params: any): Promise<any> {
    try {
      let match: Record<string, any> = {
        is_delete: 0,
        org_id: req['user']['org_id'],
      };
      let sorting: Record<string, 1 | -1> = { _id: -1 };
      const currentDate = new Date();

      if (params?.sorting && Object.keys(params.sorting).length !== 0) {
        sorting = params.sorting;
      }
      const filters: Record<string, any> = commonFilters(params.filters);

      if (params?.activeTab) {
        if (params.activeTab === 'Running') {
          match.end_date = { $gte: currentDate };
        } else if (params.activeTab === 'Expired') {
          match.end_date = { $lt: currentDate };
        }
      }
      match = { ...match, ...filters };
      const page: number = parseInt(params?.page) || global.PAGE;
      const limit: number = parseInt(params?.limit) || global.LIMIT;
      const skip: number = (page - 1) * limit;

      const totalCountData = await this.leaderboardModel.countDocuments(match);
      let result = await this.leaderboardModel
        .find(match)
        .skip(skip)
        .limit(limit)
        .sort(sorting)
        .exec();

      result = await Promise.all(
        result.map(async (leaderboard: any) => {
          const total_gifts = await this.leaderboardgiftsModel.countDocuments({
            leader_board_id: leaderboard._id,
          });
          return { ...leaderboard.toObject(), total_gifts };
        }),
      );

      return this.res.pagination(result, totalCountData, page, limit);
    } catch (error) {
      return this.res.error(HttpStatus.BAD_REQUEST, 'ERROR.BAD_REQ', error);
    }
  }

  async detail(req: Request, params: any): Promise<any> {
    try {
      const match: Record<string, any>  = {
        org_id: req['user']['org_id'],
        _id: toObjectId(params._id),
        is_delete: 0,
      };

      const data = await this.leaderboardModel.findOne(match).lean();
      if (!data) {
        return this.res.error(
          HttpStatus.BAD_REQUEST,
          'ERROR.BAD_REQ',
          'No leaderboard found with given id',
        );
      }

      const { start_date, end_date, ledger_creation_type, min_eligiblity_points, state, customer_type_id } = data;

      const ledgers = await this.ledgerModel.aggregate([
        {
          $match: {
            customer_type_id: customer_type_id[0],
            transaction_type: 'credit',
            org_id: req['user']['org_id'],
            creation_type: { $in: ledger_creation_type },
            timestamp: {
              $gte: new Date(start_date).getTime(),
              $lte: new Date(end_date).getTime(),
            },
          },
        },
        {
          $group: {
            _id: '$customer_id',
            customer_name: { $first: '$customer_name' },
            total_points: { $sum: '$points' },
          },
        },
        {
          $lookup: {
            from: 'crm_customers', // Make sure this matches the actual collection name
            localField: '_id',
            foreignField: '_id',
            as: 'customer_info',
          },
        },
        { $unwind: '$customer_info' },
        {
          $match: {
            total_points: { $gte: min_eligiblity_points },
            'customer_info.state': state[0], // filter by state like 'asam'
          },
        },
      {
        $sort: { total_points: -1 },
      },
      {
        $limit: 10,
      },
    ]);

      // Step 2: Add ranks to each customer
      const customer_data = ledgers.map((c, i) => ({
        customer_id: c._id,
        customer_name: c.customer_name,
        state: state,
        total_points: c.total_points,
        rank: i + 1,
      }));

      // Step 3: Fetch leaderboard gifts
      const gift_detail = await this.leaderboardgiftsModel.find({ leader_board_id: data._id });

      // Step 4: Fetch attached files
      const files = await this.getDocument(toObjectId(params._id), global.BIG_THUMBNAIL_IMAGE);

      // Step 5: Final response structure
      return this.res.success('SUCCESS.FETCH', {
        ...data,
        customer_data,
        gift_detail,
        files,
      });
    } catch (error) {
      return this.res.error(HttpStatus.BAD_REQUEST, 'ERROR.BAD_REQ', error);
    }
  }

  async delete(req: Request, params: any): Promise<any> {
    try {
      let match: Record<string, any> = {
        org_id: req['user']['org_id'],
        _id: params._id,
        is_delete: 0,
      };

      let data: Record<string, any> = await this.leaderboardModel
        .findOne(match)
        .lean();
      if (!data)
        return this.res.error(
          HttpStatus.BAD_REQUEST,
          'ERROR.BAD_REQ',
          'No Leaderboard found with given id',
        );

      const updateObj = {
        ...req['updateObj'],
        is_delete: 1,
      };

      await this.leaderboardModel.updateOne(
        { _id: params._id },
        { $set: updateObj },
      );

      return this.res.success('SUCCESS.DELETE');
    } catch (error) {
      return this.res.error(HttpStatus.BAD_REQUEST, 'ERROR.BAD_REQ', error);
    }
  }

  async updateStatus(req: Request, params: any): Promise<any> {
    try {
      let match: Record<string, any> = {
        org_id: req['user']['org_id'],
        _id: params._id,
        is_delete: 0,
      };

      let data: Record<string, any> = await this.leaderboardModel
        .findOne(match)
        .lean();
      if (!data)
        return this.res.error(
          HttpStatus.BAD_REQUEST,
          'ERROR.BAD_REQ',
          'No Leaderboard found with given id',
        );

      const updateObj = {
        ...req['updateObj'],
        ...params,
      };

      await this.leaderboardModel.updateOne(
        { _id: params._id },
        { $set: updateObj },
      );

      return this.res.success('SUCCESS.UPDATE');
    } catch (error) {
      return this.res.error(HttpStatus.BAD_REQUEST, 'ERROR.BAD_REQ', error);
    }
  }

  async upload(files: Express.Multer.File[], req: any): Promise<any> {
    try {
      req.body.module_name = Object.keys(global.MODULES).find(
        (key) => global.MODULES[key] === global.MODULES['Leader Board'],
      );
      let response = await this.s3Service.uploadMultiple(
        files,
        req,
        this.leaderBoardDocsModel,
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
      this.leaderBoardDocsModel,
      id,
      type,
    );
  }

  async getDocumentByDocsId(req: any, params: any): Promise<any> {
    const doc = await this.s3Service.getDocumentsById(
      this.leaderBoardDocsModel,
      params._id,
    );
    return this.res.success('SUCCESS.FETCH', doc);
  }
}
