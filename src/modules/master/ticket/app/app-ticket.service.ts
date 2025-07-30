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
import { TicketService } from '../web/ticket.service';
import { SharedUserService } from '../../user/shared-user.service';
import { WorkingActivityType } from '../../user/models/user-working-activity.model';

@Injectable()
export class AppTicketService {
  constructor(
    @InjectModel(TicketModel.name) private ticketModel: Model<TicketModel>,
    @InjectModel(CustomerModel.name)
    private customerModel: Model<CustomerModel>,
    private readonly res: ResponseService,
    private readonly ticketService: TicketService,
    private readonly sharedUserService: SharedUserService,
  ) {}

  async readTicket(req: any, params: any): Promise<any> {
    try {
      let match: Record<string, any> = {
        is_delete: 0,
        org_id: req['user']['org_id'],
      };

      if (global.CUSTOMER_LOGIN_TYPES.includes(req['user']['login_type_id'])) {
        match = { ...match, customer_id: req['user']['_id'] };
      } else {
        params.user_id = req['user']['_id'];
        const assigned_customers =
          await this.sharedUserService.getAssignCustomers(req, params);

        match = {
          ...match,
          $or: [
            { created_id: req['user']['_id'] },
            {
              customer_id: {
                $in: Array.isArray(assigned_customers)
                  ? assigned_customers.map((c: any) => c.customer_id)
                  : [],
              },
            },
          ],
        };
      }

      let sorting: Record<string, 1 | -1> = { _id: -1 };
      if (params?.sorting && Object.keys(params.sorting).length !== 0) {
        sorting = params.sorting;
      }

      const filters: Record<string, any> = commonFilters(params?.filters);
      match = { ...match, ...filters };

      const totalCountData = await this.ticketModel.countDocuments(match);
      const total: number = totalCountData;

      if (params?.activeTab) {
        match['status'] = params.activeTab;
      }

      const page: number = parseInt(params?.page) || global.PAGE;
      const limit: number = parseInt(params?.limit) || global.LIMIT;
      const skip: number = (page - 1) * limit;

      const result: Record<string, any>[] = await this.ticketModel
        .find(match)
        .sort(sorting)
        .skip(skip)
        .limit(limit);

      return this.res.pagination(result, total, page, limit);
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
      if (!data) return this.res.success('SUCCESS.DETAIL', null);
      data.files = await this.ticketService.getDocument(toObjectId(data._id));
      return this.res.success('SUCCESS.DETAIL', data);
    } catch (error) {
      return this.res.error(HttpStatus.BAD_REQUEST, 'ERROR.BAD_REQ', error);
    }
  }

  async submitFeedback(req: Request, params: any): Promise<any> {
    try {
      const customer_id = req['user']['_id'];
      const exist: Record<string, any> = await this.ticketModel
        .findOne({ _id: params._id, status: 'Complete', is_delete: 0 })
        .exec();
      if (!exist)
        return this.res.error(
          HttpStatus.BAD_REQUEST,
          'ERROR.BAD_REQ',
          'Record not found with given id.',
        );

      const updateObj = {
        ...req['updateObj'],
        ...params,
      };
      await this.ticketModel.updateOne({ _id: params._id }, updateObj);

      return this.res.success('TICKET.APP.FEEDBACK_SUBMITTED');
    } catch (error) {
      return this.res.error(HttpStatus.BAD_REQUEST, 'ERROR.BAD_REQ', error);
    }
  }
}
