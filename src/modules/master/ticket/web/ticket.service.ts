import { HttpStatus, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { TicketModel } from '../models/ticket.model';
import { Model } from 'mongoose';
import { ResponseService } from 'src/services/response.service';
import {
  toObjectId,
  commonFilters,
  nextSeq,
} from 'src/common/utils/common.utils';
import { CustomerModel } from 'src/modules/master/customer/default/models/customer.model';
import { UserModel } from 'src/modules/master/user/models/user.model';
import { CustomerTypeModel } from 'src/modules/master/customer-type/models/customer-type.model';
import { VisitActivityModel } from 'src/modules/sfa/activity/models/visit-activity.model';
import { NotificationService } from 'src/shared/rpc/notification.service';
import { S3Service } from 'src/shared/rpc/s3.service';
import { TicketDocsModel } from '../models/ticket-docs.model';
import { SharedUserService } from '../../user/shared-user.service';
import { SharedCustomerService } from '../../customer/shared-customer.service';
import { WorkingActivityType } from '../../user/models/user-working-activity.model';

@Injectable()
export class TicketService {
  constructor(
    @InjectModel(TicketDocsModel.name)
    private ticketDocsModel: Model<TicketDocsModel>,
    @InjectModel(TicketModel.name) private ticketModel: Model<TicketModel>,
    @InjectModel(UserModel.name) private userModel: Model<UserModel>,
    @InjectModel(CustomerModel.name)
    private customerModel: Model<CustomerModel>,
    @InjectModel(CustomerTypeModel.name)
    private customertypeModel: Model<CustomerTypeModel>,
    @InjectModel(VisitActivityModel.name)
    private visitActivityModel: Model<VisitActivityModel>,
    private readonly res: ResponseService,
    private readonly s3Service: S3Service,
    private readonly notificationService: NotificationService,
    private readonly sharedUserService: SharedUserService,
    private readonly sharedCustomerService: SharedCustomerService,
  ) {}

  async create(req: Request, params: any): Promise<any> {
    try {
      if (global.CUSTOMER_LOGIN_TYPES.includes(req['user']['login_type_id'])) {
        params.customer_id = req['user']['_id'];

        params.customer_detail = {
          customer_name: req['user']['customer_name'],
          mobile: req['user']['mobile'],
          login_type_id: req['user']['login_type_id'],
          login_type_name: req['user']['login_type_name'],
          customer_type_id: toObjectId(req['user']['customer_type_id']),
          customer_type_name: req['user']['customer_type_name'],
        };
      } else if (
        global.SYSTEM_USER_LOGIN_TYPES.includes(req['user']['login_type_id'])
      ) {
        params.customer_id = toObjectId(params.customer_id);
        params.user_id = [params.assign_to_user_id];
        let userDetail = await this.sharedUserService.getUsersByIds(
          req,
          params,
        );
        if (userDetail.length === 0)
          return this.res.error(
            HttpStatus.BAD_REQUEST,
            'ERROR.BAD_REQ',
            'Record not found with given user',
          );
        userDetail = userDetail[0];

        params.assign_to_user_detail = {
          login_type_id: userDetail['login_type_id'],
          login_type_name: userDetail['login_type_name'],
          mobile: userDetail['mobile'],
          user_code: userDetail['user_code'],
          name: userDetail['name'],
        };

        const customerDetails = await this.customerModel
          .findById(params.customer_id, {
            _id: 0,
            customer_name: 1,
            mobile: 1,
            login_type_id: 1,
            login_type_name: 1,
            customer_type_id: 1,
            customer_type_name: 1,
          })
          .lean();

        if (!customerDetails)
          return this.res.error(
            HttpStatus.BAD_REQUEST,
            'ERROR.BAD_REQ',
            'Record not found with given customer id',
          );

        params.customer_detail = customerDetails;
      } else {
        params.customer_id = toObjectId(params.customer_id);
        params.assign_to_user_id = req['user']['_id'];

        params.assign_to_user_detail = {
          login_type_id: req['user']['login_type_id'],
          login_type_name: req['user']['login_type_name'],
          mobile: req['user']['mobile'],
          user_code: req['user']['user_code'],
          name: req['user']['name'],
        };

        const customerDetails = await this.customerModel
          .findById(params.customer_id, {
            _id: 0,
            customer_name: 1,
            mobile: 1,
            login_type_id: 1,
            login_type_name: 1,
            customer_type_id: 1,
            customer_type_name: 1,
          })
          .lean();

        if (!customerDetails)
          return this.res.error(
            HttpStatus.BAD_REQUEST,
            'ERROR.BAD_REQ',
            'Record not found with given customer id',
          );

        params.customer_detail = customerDetails;
      }

      const exist: Record<string, any> = await this.ticketModel
        .findOne(
          {
            org_id: req['user']['org_id'],
            ticket_category: params.ticket_category,
            customer_id: params.customer_id,
            status: global.APPROVAL_STATUS[0],
            is_delete: 0,
          },
          {
            _id: 1,
          },
        )
        .exec();

      if (exist)
        return this.res.error(HttpStatus.CONFLICT, 'TICKET.ALREADY_EXIST');

      const seq = {
        modelName: this.ticketModel,
        idKey: 'ticket_no',
        prefix: 'TKT',
      };

      const ticket_no = await nextSeq(req, seq);

      if (params?.visit_activity_id)
        params.visit_activity_id = toObjectId(params.visit_activity_id);

      const saveObj = {
        ...req['createObj'],
        ...params,
        ticket_no: ticket_no,
      };

      const document = new this.ticketModel(saveObj);
      const insert = await document.save();
      if (insert) {
        if (
          req['user']['login_type_id'] === global.LOGIN_TYPE_ID['FIELD_USER']
        ) {
          const data = {
            working_activity_type: WorkingActivityType.TICKET_CREATED,
            working_activity_id: insert._id,
            display_name: params?.customer_detail?.customer_name || null,
          };
          this.sharedUserService.saveUserWorkingActivity(req, data);
        }
      }

      return this.res.success('TICKET.APP.CREATE', { inserted_id: insert._id });
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
      if (params?.sorting && Object.keys(params.sorting).length !== 0)
        sorting = params.sorting;

      const filters: Record<string, any> = commonFilters(params?.filters);
      Object.assign(match, filters);

      if (params?.activeTab && params.activeTab !== 'All') {
        match['status'] = params.activeTab;
      }

      if (params?.filters?.ticket_category) {
        match['ticket_category'] = params.filters.ticket_category;
      }
      if (params?.filters?.ticket_priority) {
        match['ticket_priority'] = params.filters.ticket_priority;
      }

      if (
        global.LOGIN_TYPE_ID_PERMISSION?.includes(req['user']['login_type_id'])
      ) {
        const userIds = await this.sharedUserService.getUsersIds(req, params);
        params.user_ids = userIds;
        const customerIds =
          await this.sharedCustomerService.getCustomersIdsByUserId(req, params);
        match.$or = [
          { created_id: { $in: userIds } },
          {
            customer_id: {
              $in: customerIds,
            },
          },
        ];
      }

      const page: number = parseInt(params?.page) || global.PAGE;
      const limit: number = parseInt(params?.limit) || global.LIMIT;
      const skip: number = (page - 1) * limit;

      const pipeline = [
        { $match: match },
        { $sort: sorting },
        { $project: { created_unix_time: 0 } },
      ];

      const totalCountData: Record<string, any>[] =
        await this.ticketModel.aggregate([
          ...pipeline,
          { $count: 'totalCount' },
        ]);

      const total: number =
        totalCountData.length > 0 ? totalCountData[0].totalCount : 0;

      let result: Record<string, any>[] = await this.ticketModel.aggregate([
        ...pipeline,
        { $skip: skip },
        { $limit: limit },
      ]);

      const allStatuses = ['Pending', 'Complete', 'Cancel', 'All'];

      const tabWiseCounts = await this.ticketModel.aggregate([
        {
          $match: match,
        },
        {
          $group: {
            _id: '$status',
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

      const tabWiseCategoryAndPriority = await this.ticketModel.aggregate([
        {
          $match: match,
        },
        {
          $facet: {
            ticket_category_counts: [
              { $group: { _id: '$ticket_category', count: { $sum: 1 } } },
            ],
            ticket_priority_counts: [
              { $group: { _id: '$ticket_priority', count: { $sum: 1 } } },
            ],
          },
        },
      ]);

      const formatCounts = (array: any[]) =>
        array.reduce((acc, item) => {
          acc[item._id] = item.count;
          return acc;
        }, {});

      const category_counts = formatCounts(
        tabWiseCategoryAndPriority[0].ticket_category_counts,
      );
      const priority_counts = formatCounts(
        tabWiseCategoryAndPriority[0].ticket_priority_counts,
      );

      result = await Promise.all(
        result.map(async (item: any) => {
          item.files = await this.getDocument(item._id, global.THUMBNAIL_IMAGE);
          return item;
        }),
      );

      const data: any = {
        result,
        status_counts,
        category_counts,
        priority_counts,
      };

      return this.res.pagination(data, total, page, limit);
    } catch (error) {
      return this.res.error(HttpStatus.BAD_REQUEST, 'ERROR.BAD_REQ', error);
    }
  }

  async detailTicket(req: Request, params: any): Promise<any> {
    try {
      let match: Record<string, any> = {
        org_id: req['user']['org_id'],
        _id: params._id,
        is_delete: 0,
      };
      let data: Record<string, any> = await this.ticketModel
        .findOne(match)
        .lean();

      data.files = await this.getDocument(data._id, global.BIG_THUMBNAIL_IMAGE);

      return this.res.success('SUCCESS.DETAIL', data);
    } catch (error) {
      return this.res.error(HttpStatus.BAD_REQUEST, 'ERROR.BAD_REQ', error);
    }
  }

  async closeTicket(req: Request, params: any): Promise<any> {
    try {
      const exist: Record<string, any> = await this.ticketModel
        .findOne({ _id: params._id, is_delete: 0 })
        .exec();
      if (!exist)
        return this.res.error(
          HttpStatus.BAD_REQUEST,
          'ERROR.BAD_REQ',
          'Record not found with given id.',
        );
      const customerExist: Record<string, any> = await this.customerModel
        .findOne({
          _id: exist.customer_id,
        })
        .exec();

      const updateObj = {
        ...req['updateObj'],
        status: params.status,
        status_remark: params.status_remark || 'Closed by admin',
      };

      await this.ticketModel.updateOne({ _id: params._id }, updateObj);

      params.template_id = 7;
      params.account_ids = [
        {
          account_ids: toObjectId(customerExist._id),
          login_type_id: customerExist.login_type_id,
        },
      ];

      params.variables = {
        status: params.status,
        ticket_id: exist.ticket_no,
      };
      params.push_notify = true;
      params.in_app = true;

      this.notificationService.notify(req, params);
      return this.res.success('TICKET.CLOSED');
    } catch (error) {
      return this.res.error(HttpStatus.BAD_REQUEST, 'ERROR.BAD_REQ', error);
    }
  }

  async upload(files: Express.Multer.File[], req: any): Promise<any> {
    try {
      req.body.module_name = Object.keys(global.MODULES).find(
        (key) => global.MODULES[key] === global.MODULES['Ticket'],
      );
      let response = await this.s3Service.uploadMultiple(
        files,
        req,
        this.ticketDocsModel,
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
    return this.s3Service.getDocumentsByRowId(this.ticketDocsModel, id, type);
  }

  async getDocumentByDocsId(req: any, params: any): Promise<any> {
    const doc = await this.s3Service.getDocumentsById(
      this.ticketDocsModel,
      params._id,
    );
    return this.res.success('SUCCESS.FETCH', doc);
  }

  async ticketCount(req, params): Promise<any> {
    params._id = toObjectId(params?.customer_id) || req['user']['_id'];

    if (!params.customer_id || !req['user']['org_id']) {
      return { count: 0, total_points: 0, bonus_points: 0 };
    }
    const count = await this.ticketModel
      .countDocuments({
        customer_id: params.customer_id,
        status: global.APPROVAL_STATUS[0],
      })
      .lean();
    return count;
  }
}
