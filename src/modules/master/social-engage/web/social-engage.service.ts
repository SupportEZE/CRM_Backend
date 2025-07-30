import { Injectable, HttpStatus } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { ResponseService } from 'src/services/response.service';
import { Lts } from 'src/shared/translate/translate.service';
import { toObjectId, commonFilters } from 'src/common/utils/common.utils';
import { SocialEngageDefaultModel } from '../models/social-engage-default.model';
import { SocialEngageModel } from '../models/social-engage.model';
import { SocialEngageCustomersModel } from '../models/social-engage-customer.model';
import { CustomerModel } from '../../customer/default/models/customer.model';
import { S3Service } from 'src/shared/rpc/s3.service';
import { SocialEngageDocsModel } from '../models/social-engage-docs.model';
import { CustomerService } from '../../customer/default/web/customer.service';
import { NotificationService } from 'src/shared/rpc/notification.service';
import { LedgerService } from 'src/modules/loyalty/ledger/web/ledger.service';
import { SharedCustomerService } from '../../customer/shared-customer.service';

@Injectable()
export class SocialEngageService {
  constructor(
    @InjectModel(SocialEngageDefaultModel.name)
    private socialEngageDefaultModel: Model<SocialEngageDefaultModel>,
    @InjectModel(SocialEngageDocsModel.name)
    private socialEngageDocsModel: Model<SocialEngageDocsModel>,
    @InjectModel(SocialEngageModel.name)
    private socialEngageModel: Model<SocialEngageModel>,
    @InjectModel(SocialEngageCustomersModel.name)
    private socialEngageCustomersModel: Model<SocialEngageCustomersModel>,

    @InjectModel(CustomerModel.name)
    private customerModel: Model<CustomerModel>,
    private readonly res: ResponseService,
    private readonly ledgerService: LedgerService,
    private readonly notificationService: NotificationService,
    private readonly s3Service: S3Service,
    private readonly customerService: CustomerService,
    private readonly sharedCustomerService: SharedCustomerService,
  ) {}

  async defaultPlatforms(req: Request, params: any): Promise<any> {
    try {
      const result = await this.socialEngageDefaultModel
        .find()
        .select('title web_text_color app_text_color web_icon app_icon')
        .exec();

      return this.res.success('SUCCESS.FETCH', result);
    } catch (error) {
      return this.res.error(HttpStatus.BAD_REQUEST, 'ERROR.BAD_REQ', error);
    }
  }

  async create(req: Request, params: any): Promise<any> {
    try {
      let match: Record<string, any> = {
        is_delete: 0,
        org_id: req['user']['org_id'],
        title: params.title,
      };
      const exist = await this.socialEngageModel.findOne(match).exec();
      if (exist) {
        return this.res.error(HttpStatus.BAD_REQUEST, 'WARNING.ALREADY_EXIST');
      }

      const saveObj = {
        ...req['createObj'],
        ...params,
        status: global.STATUS[1],
      };
      const document = new this.socialEngageModel(saveObj);
      await document.save();

      return this.res.success('SUCCESS.UPDATE');
    } catch (error) {
      return this.res.error(HttpStatus.BAD_REQUEST, 'ERROR.BAD_REQ', error);
    }
  }

  async read(req: Request, params: any): Promise<any> {
    try {
      let match: Record<string, any> = {
        is_delete: 0,
        org_id: req['user']['org_id'],
      };
      const result = await this.socialEngageModel.find(match).exec();

      return this.res.success('SUCCESS.FETCH', result);
    } catch (error) {
      return this.res.error(HttpStatus.BAD_REQUEST, 'ERROR.BAD_REQ', error);
    }
  }

  async update(req: Request, params: any): Promise<any> {
    try {
      const exist = await this.socialEngageModel
        .findById(toObjectId(params._id))
        .exec();
      if (!exist) {
        return this.res.error(
          HttpStatus.BAD_REQUEST,
          'ERROR.BAD_REQ',
          'Request Not found.',
        );
      }

      const updateObj = {
        ...req['updateObj'],
        ...params,
      };

      await this.socialEngageModel.updateOne(
        { _id: toObjectId(params._id) },
        { $set: updateObj },
      );

      return this.res.success('SUCCESS.UPDATE');
    } catch (error) {
      return this.res.error(HttpStatus.BAD_REQUEST, 'ERROR.BAD_REQ', error);
    }
  }

  async requestStatusChange(req: Request, params: any): Promise<any> {
    try {
      const exist = await this.socialEngageCustomersModel
        .findOne({ _id: params._id })
        .exec();
      if (!exist)
        return this.res.error(
          HttpStatus.BAD_REQUEST,
          'ERROR.BAD_REQ',
          'Request Not found.',
        );

      const customer_data = await this.customerModel
        .findById(exist.customer_id)
        .exec();

      const updateObj = {
        ...req['updateObj'],
        ...params,
      };

      await this.socialEngageCustomersModel.updateOne(
        { _id: toObjectId(params._id) },
        { $set: updateObj },
      );

      if (params.status === global.APPROVAL_STATUS[1]) {
        if (customer_data.profile_status === global.APPROVAL_STATUS[1]) {
          let ledgerParams = {
            customer_id: exist['customer_id'],
            customer_name: exist['customer_name'],
            login_type_id: customer_data['login_type_id'],
            customer_type_id: customer_data['customer_type_id'],
            transaction_type: global.TRANSACTION_TYPE[0],
            points: exist.points,
            remark:
              exist.points +
              ' Point credited against social engagement id ' +
              exist.id,
            transaction_id: exist.id,
            creation_type: global.CREATION_TYPE[7],
          };
          const ledger = await this.ledgerService.create(req, ledgerParams);
        }
      }

      params.template_id = 8;
      params.account_ids = [
        {
          account_ids: exist._id,
          login_type_id: customer_data['login_type_id'],
        },
      ];

      params.variables = {
        status: params.status,
      };
      params.push_notify = true;
      params.in_app = true;

      this.notificationService.notify(req, params);
      return this.res.success('SUCCESS.UPDATE');
    } catch (error) {
      return this.res.error(HttpStatus.BAD_REQUEST, 'ERROR.BAD_REQ', error);
    }
  }

  async pendingRequest(req: Request, params: any): Promise<any> {
    try {
      let match: Record<string, any> = {
        is_delete: 0,
        org_id: req['user']['org_id'],
        status: global.APPROVAL_STATUS[0],
      };
      if (params?.filters?.customer_name) {
        const pattern = new RegExp(params.filters.customer_name, 'i');
        match.customer_name = { $regex: pattern };
      }

      if (params?.filters?.otherField) {
        match.otherField = params.filters.otherField;
      }

      let sorting: Record<string, 1 | -1> = { _id: -1 };

      const page: number = Math.max(
        1,
        parseInt(params?.page, 10) || global.PAGE,
      );
      const limit: number = Math.max(
        1,
        parseInt(params?.limit, 10) || global.LIMIT,
      );
      const skip: number = (page - 1) * limit;

      const total = await this.socialEngageCustomersModel.countDocuments(match);
      let result = await this.socialEngageCustomersModel
        .find(match)
        .sort(sorting)
        .skip(skip)
        .limit(limit)
        .lean();

      result = await Promise.all(
        result.map(async (item: any) => {
          const files = await this.sharedCustomerService.getDocument(
            toObjectId(item.customer_id),
            global.THUMBNAIL_IMAGE,
          );
          const profilePic = files.find(
            (file: any) => file.label?.toLowerCase() === 'profile pic',
          );
          item.profile_pic = profilePic ?? null;
          return item;
        }),
      );

      return this.res.pagination(result, total, page, limit);
    } catch (error) {
      return this.res.error(HttpStatus.BAD_REQUEST, 'ERROR.BAD_REQ', error);
    }
  }

  async performace(req: Request, params: any): Promise<any> {
    try {
      let match: Record<string, any> = {
        is_delete: 0,
        org_id: req['user']['org_id'],
        status: global.APPROVAL_STATUS[1],
      };

      if (params._id) {
        match = { ...match, customer_id: toObjectId(params._id) };
      }

      const filters = params?.filters || {};
      params.match = commonFilters(filters);
      match = { ...match, ...commonFilters(filters) };

      const page: number = Math.max(
        1,
        parseInt(params?.page, 10) || global.PAGE,
      );
      const limit: number = Math.max(
        1,
        parseInt(params?.limit, 10) || global.LIMIT,
      );
      const skip: number = (page - 1) * limit;
      const total = await this.socialEngageCustomersModel.countDocuments(match);
      const result = await this.socialEngageCustomersModel
        .find(match)
        .skip(skip)
        .limit(limit)
        .exec();

      return this.res.pagination(result, total, page, limit);
    } catch (error) {
      return this.res.error(HttpStatus.BAD_REQUEST, 'ERROR.BAD_REQ', error);
    }
  }

  async getDocument(
    _id: any,
    type:
      | typeof global.FULL_IMAGE
      | typeof global.THUMBNAIL_IMAGE
      | typeof global.BIG_THUMBNAIL_IMAGE = global.FULL_IMAGE,
  ): Promise<any> {

    const doc = await this.s3Service.getDocumentsByRowId(
      this.socialEngageDocsModel,
      toObjectId(_id),
      type,
    );

    const data = Array.isArray(doc) && doc.length === 1 ? doc[0] : doc;

    return this.res.success('SUCCESS.FETCH', data);
  }

  async getDocumentByDocsId(req: any, params: any): Promise<any> {
    const doc = await this.s3Service.getDocumentsById(
      this.socialEngageDocsModel,
      params._id,
    );
    return this.res.success('SUCCESS.FETCH', doc);
  }
}
