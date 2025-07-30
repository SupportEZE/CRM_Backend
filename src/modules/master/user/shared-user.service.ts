import { HttpStatus, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { UserModel } from './models/user.model';
import { Model } from 'mongoose';
import { ResponseService } from 'src/services/response.service';
import {
  toObjectId,
  Like,
  commonSearchFilter,
  convertToUtcRange,
} from 'src/common/utils/common.utils';
import { UserHierarchyModel } from './models/user-hierarchy.model';
import { CustomerModel } from '../customer/default/models/customer.model';
import { S3Service } from 'src/shared/rpc/s3.service';
import { UserDocsModel } from './models/user-docs.model';
import { Lts } from 'src/shared/translate/translate.service';
import { UserToCustomerMappingModel } from '../customer/default/models/user-to-customer-mapping.model';
import { COLLECTION_CONST } from 'src/config/collection.constant';
import { DataRights } from './web/dto/user.dto';
import {
  UserWorkingActivityModel,
  WorkingActivityTypeColors,
} from './models/user-working-activity.model';
import {
  contactPersonLookup,
  customerLookup,
} from 'src/shared/collection-lookups/lookups';
import { UserToStateMappingModel } from './models/user-state-mapping.model';

@Injectable()
export class SharedUserService {
  constructor(
    @InjectModel(UserModel.name) private userModel: Model<UserModel>,
    @InjectModel(UserDocsModel.name)
    private userDocsModel: Model<UserDocsModel>,
    @InjectModel(UserHierarchyModel.name)
    private userHierarchyModel: Model<UserHierarchyModel>,
    @InjectModel(CustomerModel.name)
    private customerModel: Model<CustomerModel>,
    @InjectModel(UserToCustomerMappingModel.name)
    private userToCustomerMappingModel: Model<UserToCustomerMappingModel>,
    @InjectModel(UserWorkingActivityModel.name)
    private userWorkingActivityModel: Model<UserWorkingActivityModel>,
    @InjectModel(UserToStateMappingModel.name)
    private userToStateMappingModel: Model<UserToStateMappingModel>,
    private readonly res: ResponseService,
    private readonly s3Service: S3Service,
    private readonly lts: Lts,
  ) { }

  async upload(files: Express.Multer.File[], req: any): Promise<any> {
    try {
      req.body.module_name = Object.keys(global.SUB_MODULES).find(
        (key) => global.SUB_MODULES[key] === global.SUB_MODULES['Users'],
      );

      let response = await this.s3Service.uploadMultiple(
        files,
        req,
        this.userDocsModel,
      );
      return this.res.success('SUCCESS.CREATE', response);
    } catch (error) {
      return this.res.error(
        HttpStatus.BAD_REQUEST,
        'Error uploading files to S3',
        error,
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
    return this.s3Service.getDocumentsByRowId(this.userDocsModel, id, type);
  }

  async getDocumentByDocsId(req: any, params: any): Promise<any> {
    const doc = await this.s3Service.getDocumentsById(
      this.userDocsModel,
      params._id,
    );
    return this.res.success('SUCCESS.FETCH', doc);
  }

  userLookup(req: Request, params: any) {
    let localField = 'user_id';
    if (params?.localField) localField = params.localField;
    const userLookup = [
      {
        $lookup: {
          from: COLLECTION_CONST().CRM_USERS,
          localField: localField,
          foreignField: '_id',
          as: 'user_info',
          pipeline: [
            {
              $project: {
                _id: 1,
                name: 1,
                email: 1,
                mobile: 1,
                user_code: 1,
                reporting_manager_name: 1,
                profile_pic: 1,
                designation: 1,
              },
            },
          ],
        },
      },
      {
        $unwind: {
          path: '$user_info',
          preserveNullAndEmptyArrays: true,
        },
      },
    ];
    return userLookup;
  }

  async readDropdown(req: Request, params: any): Promise<any> {
    try {
      let match: Record<string, any> = {
        is_delete: 0,
        org_id: req['user']['org_id'],
      };

      if (!req?.url.includes(global.MODULE_ROUTES[30])) {
        match._id = { $nin: [req['user']['_id'], params?.user_id] };
      }

      if (params?.login_type_ids?.length) {
        match.login_type_id = { $in: params.login_type_ids };
      } else match.login_type_id = [global.LOGIN_TYPE_ID['FIELD_USER']];
      let sorting: Record<string, 1 | -1> = { name: 1 };
      if (params?.sorting && Object.keys(params.sorting).length !== 0)
        sorting = params.sorting;
      if (params?.filters) {
        Object.keys(params.filters).forEach((key) => {
          if (params.filters[key]) {
            match[key] = Like(params.filters[key]);
          }
        });
      }

      if (params?.search) match['name'] = Like(params.search);

      if (
        global.LOGIN_TYPE_ID_PERMISSION?.includes(req['user']['login_type_id'])
      ) {
        const userIds = await this.getUsersIds(req, params);
        match._id = { $in: userIds };
      }

      let limit = global.OPTIONS_LIMIT;
      if (params?.limit) limit = params.limit;
      let data: any = await this.userModel
        .find(match, {
          name: 1,
          user_code: 1,
          login_type_id: 1,
          mobile: 1,
          form_data: 1,
        })
        .sort(sorting)
        .limit(limit);
      data = data.map((row: any) => {
        return {
          label: `${row.name} (${row.user_code})`,
          value: row._id,
          user_code: row.user_code,
          login_type_id: row.login_type_id,
          mobile: row.mobile,
          business_segment: row?.form_data?.business_segment || null,
        };
      });
      return this.res.success('SUCCESS.FETCH', data);
    } catch (error) {
      return this.res.error(HttpStatus.BAD_REQUEST, 'ERROR.BAD_REQ', error);
    }
  }

  async readLocationDropdown(req: Request, params: any): Promise<any> {
    try {
      let match: Record<string, any> = {
        is_delete: 0,
        org_id: req['user']['org_id'],
      };

      if (!req?.url.includes(global.MODULE_ROUTES[30])) {
        match._id = { $nin: [req['user']['_id'], params?.user_id] };
      }

      if (params?.login_type_ids?.length) {
        match.login_type_id = { $in: params.login_type_ids };
      } else match.login_type_id = [global.LOGIN_TYPE_ID['FIELD_USER']];
      let sorting: Record<string, 1 | -1> = { name: 1 };
      if (params?.sorting && Object.keys(params.sorting).length !== 0)
        sorting = params.sorting;
      if (params?.filters) {
        Object.keys(params.filters).forEach((key) => {
          if (params.filters[key]) {
            match[key] = Like(params.filters[key]);
          }
        });
      }

      if (params?.search) match['name'] = Like(params.search);

      if (
        global.LOGIN_TYPE_ID_PERMISSION?.includes(req['user']['login_type_id'])
      ) {
        const userIds = await this.getUsersIds(req, params);
        match._id = { $in: userIds };
      }

      let limit = global.OPTIONS_LIMIT;
      if (params?.limit) limit = params.limit;
      let data: any = await this.userModel
        .find(match, {
          name: 1,
          user_code: 1,
          login_type_id: 1,
          mobile: 1,
          form_data: 1,
        })
        .sort(sorting)
        .limit(limit);
      data = data.map((row: any) => {
        return {
          label: `${row.name} (${row.user_code})`,
          value: row._id,
          user_code: row.user_code,
          login_type_id: row.login_type_id,
          mobile: row.mobile,
          business_segment: row?.form_data?.business_segment || null,
        };
      });
      return this.res.success('SUCCESS.FETCH', data);
    } catch (error) {
      return this.res.error(HttpStatus.BAD_REQUEST, 'ERROR.BAD_REQ', error);
    }
  }

  async duplicate(req: Request, params: any): Promise<any> {
    try {
      let errorObject: Record<string, any> = {};
      let message: string = '';
      let response: Record<string, any> = {};

      if (params?.mobile) {
        let exist: Record<string, any> = await this.customerModel
          .findOne({ mobile: params.mobile, org_id: req['user']['org_id'] })
          .lean();
        if (exist) {
          if (!params._id) errorObject['mobile'] = true;
          if (params._id && !toObjectId(params._id).equals(exist['_id']))
            errorObject['mobile'] = true;
        } else {
          exist = await this.userModel
            .findOne({ mobile: params.mobile, org_id: req['user']['org_id'] })
            .exec();
          if (exist) {
            if (!params._id) errorObject['mobile'] = true;
            if (params._id && !toObjectId(params._id).equals(exist['_id']))
              errorObject['mobile'] = true;
          }
        }
      }
      if (params?.user_code) {
        let exist: Record<string, any> = await this.userModel
          .findOne({
            user_code: params.user_code,
            org_id: req['user']['org_id'],
          })
          .exec();
        if (exist) {
          if (!params._id) errorObject['user_code'] = true;
          if (params._id && !toObjectId(params._id).equals(exist['_id']))
            errorObject['user_code'] = true;
        }
      }
      if (Object.keys(errorObject).length !== 0) {
        const existingFields = Object.keys(errorObject).filter(
          (key) => errorObject[key],
        );
        const fieldNames: Record<string, string> = {
          mobile: await this.lts.t('WARNING.MOBILE'),
          user_code: await this.lts.t('USER.USER_CODE'),
        };
        const EXIST = await this.lts.t('WARNING.EXIST');
        message =
          existingFields.map((key) => fieldNames[key]).join('/') + ' ' + EXIST;
        if (params.duplicacyCheck)
          return (response = { status: true, message: message });
        else return this.res.error(HttpStatus.BAD_REQUEST, message);
      } else {
        if (params.duplicacyCheck) return (response = { status: false });
        else return this.res.success('WARNING.NO_DUPLICACY');
      }
    } catch (error) {
      return this.res.error(HttpStatus.BAD_REQUEST, 'ERROR.BAD_REQ');
    }
  }

  async getJuniorOld(req: any, params: any): Promise<any> {
    try {
      const user_id = params?.user_id
        ? toObjectId(params.user_id)
        : req['user']['_id'];
      const allJuniors: Set<any> = new Set();
      let currentIds: any[] = [user_id];
      let currentLevel = 0;
      let foundNewJuniors = true;

      while (foundNewJuniors) {
        const juniors = await this.getDirectJuniors(currentIds, currentLevel);
        if (juniors.length === 0) {
          foundNewJuniors = false;
        } else {
          juniors.forEach((junior) => allJuniors.add(junior));
          currentIds = juniors.map((junior) => junior.child_user_id);
          currentLevel++;
        }
      }

      if (req.url.includes('get-junior') || req.url.includes('read-detail')) {
        return this.res.success('SUCCESS.FETCH', Array.from(allJuniors));
      }
      const userIds = Array.from(allJuniors)?.map(
        (row: any) => row.child_user_id,
      );
      return userIds;
    } catch (error) {
      return this.res.error(
        HttpStatus.BAD_REQUEST,
        'ERROR.BAD_REQ',
        error.message,
      );
    }
  }

  async getJunior(req: any, params: any): Promise<any> {
    try {
      const user_id = params?.user_id
        ? toObjectId(params.user_id)
        : req['user']['_id'];
      const levelLimit = params?.level || Infinity; // <-- default to unlimited if level not passed
      const allJuniors: Set<string> = new Set();
      const processedIds: Set<string> = new Set();
      let currentIds: any[] = [user_id];
      let currentLevel = 0;
      while (currentLevel < levelLimit) {
        const juniors = await this.getDirectJuniors(
          currentIds,
          currentLevel + 1,
        ); // level starts from 1
        if (juniors.length === 0) break;

        // const newJuniors = juniors.filter(junior => {
        //     const idStr = String(junior.child_user_id);
        //     if (processedIds.has(idStr)) return false;
        //     processedIds.add(idStr);
        //     return true;
        // });

        // allJuniors.push(...newJuniors);

        juniors.forEach((junior) => allJuniors.add(junior));
        currentIds = juniors.map((junior) => junior.child_user_id);
        currentLevel++;
      }

      if (req.url.includes('get-junior') || req.url.includes('read-detail')) {
        return this.res.success('SUCCESS.FETCH', Array.from(allJuniors));
      }

      const userIds = Array.from(allJuniors)?.map(
        (row: any) => row.child_user_id,
      );
      return userIds;
    } catch (error) {
      return this.res.error(
        HttpStatus.BAD_REQUEST,
        'ERROR.BAD_REQ',
        error.message,
      );
    }
  }

  async getDirectJuniors(ids: any[], level: number): Promise<any[]> {
    try {
      const juniors = await this.userHierarchyModel.aggregate([
        {
          $match: {
            parent_user_id: { $in: ids },
            is_delete: 0,
          },
        },
        {
          $lookup: {
            from: 'crm_users',
            localField: 'child_user_id',
            foreignField: '_id',
            as: 'child_user_details',
          },
        },
        {
          $unwind: '$child_user_details',
        },
        {
          $project: {
            child_user_id: 1,
            child_user_name: '$child_user_details.name',
            level: { $literal: level },
          },
        },
      ]);

      return juniors.map((junior) => ({
        child_user_id: junior.child_user_id,
        child_user_name: junior.child_user_name,
        level: junior.level,
      }));
    } catch (error) {
      throw new Error('Error fetching direct juniors: ' + error.message);
    }
  }

  async getAssignCustomerTypes(req: Request, params: any): Promise<any> {
    try {
      const match: Record<string, any> = {
        org_id: req['user']['org_id'],
        user_id: req['user']['_id'],
        is_delete: 0,
        customer_type_id: { $ne: null },
        customer_type_name: { $ne: null },
      };

      const pipeline: any[] = [
        { $match: match },
        {
          $group: {
            _id: '$customer_type_id',
            customer_type_id: { $first: '$customer_type_id' },
            customer_type_name: { $first: '$customer_type_name' },
          },
        },
        {
          $project: {
            _id: 0,
            customer_type_id: 1,
            customer_type_name: 1,
          },
        },
      ];

      const data = await this.userToCustomerMappingModel.aggregate(pipeline);
      return data;
    } catch (error) {
      throw error;
    }
  }

  async getUsersIds(req: Request, params: any): Promise<any> {
    try {
      const user = req['user'];
      const userId = toObjectId(user._id); // Ensure consistent ObjectId format
      const match: Record<string, any> = {
        org_id: user.org_id,
        is_delete: 0,
      };

      // PRIMARY CUSTOMER — get primary customer id
      if (user.login_type_id === global.LOGIN_TYPE_ID['PRIMARY']) {
        params.internalCall = true;
        return [userId];
      }

      // FIELD USER — get juniors + self
      if (user.login_type_id === global.LOGIN_TYPE_ID['FIELD_USER']) {
        params.internalCall = true;
        const userData = await this.getJunior(req, params);
        const ids = userData?.map((userTmpId: any) => userTmpId) || [];
        ids.push(userId);
        return ids;
      }

      // TEAM-WISE — return allowed team users + self
      if (user.data_rights === DataRights.TEAM_WISE) {
        const ids = (user.data_right_values || []).map((id: any) =>
          toObjectId(id),
        );
        ids.push(userId);
        return ids;
      }

      // STATE-WISE — fetch users by state + self
      if (user.data_rights === DataRights.STATE_WISE) {
        match.$or = [
          { state: { $in: user.data_right_values || [] } },
          { login_type_id: 2 },
        ];
        const userData = await this.userModel.find(match, { _id: 1 }).lean();
        const ids = userData.map((row: any) => row._id);
        ids.push(userId);
        return ids;
      }

      if (user.data_rights === DataRights.DIRECT_ASSIGN) {
        return [userId];
      }

      return [userId];
    } catch (error) {
      throw error;
    }
  }

  async getLoginTypeCounts(req: Request, params: any): Promise<any> {
    try {
      const match: Record<string, any> = {
        org_id: req['user']['org_id'],
        is_delete: 0,
      };
      if (params?.login_type_ids) {
        match.login_type_id = { $in: params.login_type_ids };
      } else {
        match.login_type_id = params.login_type_id;
      }

      if (
        global.LOGIN_TYPE_ID_PERMISSION?.includes(req['user']['login_type_id'])
      ) {
        const userIds = await this.getUsersIds(req, params);
        match._id = { $in: userIds };
      }

      const userCounts: any[] = await this.userModel.aggregate([
        { $match: match },
        {
          $group: {
            _id: '$login_type_id',
            count: { $sum: 1 },
          },
        },
      ]);

      if (params?.login_type_id) return userCounts[0];

      return userCounts;
    } catch (error) {
      throw error;
    }
  }

  async getUserDetail(req: Request, params: any): Promise<any> {
    try {
      let match: Record<string, any> = {
        is_delete: 0,
        org_id: req['user']['org_id'],
      };
      if (params?.user_ids) {
        match._id = {
          $in: params.user_ids?.map((row: any) => toObjectId(row)),
        };
      } else {
        match._id = toObjectId(params.user_id);
      }
      let user: any;
      if (params?.user_id) {
        user = await this.userModel.find(match, { _id: 1, name: 1, mobile: 1 });
      }
    } catch (error) {
      throw new Error('Failed to fetch user detail');
    }
  }

  async saveUserWorkingActivity(req: Request, params: any): Promise<any> {
    try {
      const exist: Record<string, any> =
        await this.userWorkingActivityModel.findOne(
          { working_activity_id: params.working_activity_id },
          { _id: 1 },
        );
      if (!exist) {
        const saveObj: Record<string, any> = {
          ...req['createObj'],
          ...params,
        };
        const document = new this.userWorkingActivityModel(saveObj);
        document.save();
      }
    } catch (error) {
      throw error;
    }
  }

  async readUserWorkingActivity(req: Request, params: any): Promise<any> {
    try {
      const { start, end } = convertToUtcRange(new Date());
      const match: Record<string, any> = {
        is_delete: 0,
        created_id: req['user']['_id'],
        created_at: {
          $gte: start,
          $lte: end,
        },
      };
      const projection: Record<string, any> = {
        created_at: 1,
        working_activity_type: 1,
        display_name: 1,
      };
      let data: Record<string, any> = await this.userWorkingActivityModel
        .find(match, projection)
        .sort({ _id: 1 })
        .lean();
      data = data?.map((row: any) => {
        return {
          ...row,
          color: WorkingActivityTypeColors[row.working_activity_type],
        };
      });

      return this.res.success('SUCCESS.FETCH', data);
    } catch (error) {
      return this.res.error(HttpStatus.BAD_REQUEST, 'ERROR.BAD_REQ', error);
    }
  }

  async getUsersByIds(req: Request, params: any): Promise<any> {
    try {
      const match: Record<string, any> = {
        is_delete: 0,
        org_id: req['user']['org_id'],
        _id: { $in: params.user_ids || params.user_id },
      };
      const projection: Record<string, any> = {
        mobile: 1,
        name: 1,
        login_type_id: 1,
        login_type_name: 1,
        user_code: 1,
        beat_route_code: 1,
        email: 1,
      };
      const data: Record<string, any> = await this.userModel.find(
        match,
        projection,
      );
      return data;
    } catch (error) {
      throw error;
    }
  }

  async getAssignCustomers(req: Request, params: any): Promise<any> {
    try {
      const match: Record<string, any> = {
        org_id: req['user']['org_id'],
        user_id: toObjectId(params.user_id),
        is_delete: 0,
      };

      const pipeline: any[] = [
        { $match: match },
        {
          $group: {
            _id: '$customer_id',
            customer_id: { $first: '$customer_id' },
          },
        },
        {
          $project: {
            _id: 0,
            customer_id: 1,
          },
        },
      ];
      const data = await this.userToCustomerMappingModel.aggregate(pipeline);
      return data;
    } catch (error) {
      throw error;
    }
  }

  async getAssignJuniorsAndOwnCustomersDetail(
    req: Request,
    params: any,
  ): Promise<any> {
    try {
      // Fetch the userIds for juniors
      let userIds: any[] = [];
      userIds = userIds.concat(await this.getJunior(req, params));

      // If params.user_id is present, add it to the userIds array
      if (params.user_id)
        userIds.push({ child_user_id: toObjectId(params.user_id) });

      // Extract the actual userIds for the query
      userIds = userIds?.map((row: any) => row.child_user_id);

      // Define the match conditions for the aggregation
      const match: Record<string, any> = {
        org_id: req['user']['org_id'],
        user_id: { $in: userIds },
        is_delete: 0,
      };

      // Construct the aggregation pipeline
      const pipeline: any[] = [
        { $match: match },
        ...customerLookup(req, params),
        ...contactPersonLookup(req, params),
        {
          $group: {
            _id: '$customer_id',
            customer_id: { $first: '$customer_id' },
            user_id: { $first: '$user_id' }, // First user_id for the group
            customer_name: { $first: '$customer_info.customer_name' },
            mobile: { $first: '$customer_info.mobile' },
            customer_type_name: { $first: '$customer_info.customer_type_name' },
            contact_person_info: { $first: '$contact_person_info' },
          },
        },
        {
          $addFields: {
            // Compare the grouped user_id with params.user_id
            assign_type: {
              $cond: {
                if: { $eq: ['$user_id', toObjectId(params.user_id)] }, // Check if user_id matches
                then: 'Direct', // If they match, set to Direct
                else: 'Indirect', // Otherwise, set to Indirect
              },
            },
          },
        },
        {
          $project: {
            _id: 0,
            customer_id: 1,
            customer_name: 1,
            mobile: 1,
            customer_type_name: 1,
            user_id: 1,
            assign_type: 1,
            contact_person_info: 1,
          },
        },
      ];

      // Execute the aggregation pipeline
      const data = await this.userToCustomerMappingModel.aggregate(pipeline);

      // Return the results
      return data;
    } catch (error) {
      throw error;
    }
  }

  async getAssignUsers(req: Request, params: any): Promise<any> {
    try {
      const match: Record<string, any> = {
        org_id: req['user']['org_id'],
        customer_id: toObjectId(params.customer_id),
        is_delete: 0,
      };
      const userLookup = this.userLookup(req, params);
      const pipeline: any[] = [
        { $match: match },
        ...userLookup,
        {
          $group: {
            _id: '$user_id',
            user_id: { $first: '$user_id' },
            user_info: { $first: '$user_info' },
          },
        },
        {
          $project: {
            _id: 0,
            user_id: 1,
            user_info: 1,
          },
        },
      ];
      let data = await this.userToCustomerMappingModel.aggregate(pipeline);
      data = data?.map((row: any) => {
        return {
          label: row?.user_info?.name || null,
          value: row.user_id,
        };
      });
      return this.res.success('SUCCESS.FETCH', data);
    } catch (error) {
      return this.res.error(HttpStatus.BAD_REQUEST, 'ERROR.BAD_REQ', error);
    }
  }

  async assignBeatToUser(req: Request, params: any): Promise<any> {
    try {
      const userIds = (params.user_id || []).map((id: string) =>
        toObjectId(id),
      );
      if (
        !Array.isArray(params.beat_route_code) ||
        params.beat_route_code.length === 0
      ) {
        return this.res.error(HttpStatus.BAD_REQUEST, 'ERROR.NOT_FOUND');
      }

      const updateObj: Record<string, any> = {
        $addToSet: {
          beat_route_code: { $each: params.beat_route_code },
        },
        $set: {
          ...req['updateObj'],
        },
      };

      const result = await this.userModel.updateMany(
        { _id: { $in: userIds } },
        updateObj,
      );
      return this.res.success('SUCCESS.SAVE');
    } catch (error) {
      return this.res.error(HttpStatus.BAD_REQUEST, 'ERROR.BAD_REQ', error);
    }
  }

  async unassignBeatFromUsers(req: Request, params: any): Promise<any> {
    try {
      const userId = toObjectId(params.user_id);
      if (
        !params.beat_route_code ||
        typeof params.beat_route_code !== 'string'
      ) {
        return this.res.error(HttpStatus.BAD_REQUEST, 'ERROR.BAD_REQ');
      }

      const updateObj: Record<string, any> = {
        $pull: {
          beat_route_code: params.beat_route_code,
        },
        $set: {
          ...req['updateObj'],
        },
      };

      const result = await this.userModel.updateMany(
        { _id: userId },
        updateObj,
      );
      return this.res.success('BEAT_CODE.UNASSIGNED');
    } catch (error) {
      return this.res.error(HttpStatus.BAD_REQUEST, 'ERROR.BAD_REQ', error);
    }
  }

  async fetchAssignedUser(req: Request, params: any): Promise<any> {
    try {
      const beatRouteCode = params.beat_route_code;
      const result = await this.userModel
        .find({
          beat_route_code: {
            $in: Array.isArray(beatRouteCode) ? beatRouteCode : [beatRouteCode],
          },
          is_delete: 0,
          org_id: req['user']['org_id']
        })
        .select('name mobile')
        .lean();
      return result;
    } catch (error) {
      return this.res.error(HttpStatus.BAD_REQUEST, 'ERROR.BAD_REQ', error);
    }
  }

  async getAssinedCustomersId(
    req: Request,
    params: any,
    customerId: string[],
  ): Promise<any> {
    try {
      const result = await this.userToCustomerMappingModel
        .find({
          customer_id: { $in: customerId.map(toObjectId) },
          user_id: toObjectId(params.user_id),
          is_delete: 0,
        })
        .select('customer_id')
        .lean();

      return result;
    } catch (error) {
      return this.res.error(HttpStatus.BAD_REQUEST, 'ERROR.BAD_REQ', error);
    }
  }

  async readUser(req: Request, params: any): Promise<any> {
    try {
      let match: Record<string, any> = {
        is_delete: 0,
        org_id: req['user']['org_id'],
        login_type_id: global.LOGIN_TYPE_ID['FIELD_USER'],
        _id: { $ne: req['user']['_id'] },
      };
      let sorting: Record<string, 1 | -1> = { _id: -1 };
      if (params?.sorting && Object.keys(params.sorting).length !== 0)
        sorting = params.sorting;

      const searchableFields = ['name', 'user_code', 'mobile'];
      const filters = commonSearchFilter(params?.filters, searchableFields);
      match = { ...match, ...filters };

      let limit = global.OPTIONS_LIMIT;
      if (params?.limit) limit = params.limit;
      let data: any = await this.userModel
        .find(match, { name: 1, user_code: 1, mobile: 1 })
        .sort(sorting)
        .limit(limit);
      data = data.map((row: any) => {
        return {
          label: row.name,
          value: row._id,
          user_code: row.user_code,
          user_mobile: row.mobile,
        };
      });
      return this.res.success('SUCCESS.FETCH', data);
    } catch (error) {
      return this.res.error(HttpStatus.BAD_REQUEST, 'ERROR.BAD_REQ', error);
    }
  }

  async profilePercentage(
    req: Request,
    params: any,
    data: Record<string, any>,
  ): Promise<any> {
    try {
      let completion = 0;

      if (data.basic_info) {
        const basicField = global.USER_PERCENATGE_INFO;
        let filledBankFields = basicField.filter(
          (field: any) => data.basic_info[field],
        ).length;
        completion += (filledBankFields / basicField.length) * 100;
      }
      return Math.round(completion);
    } catch (error) {
      throw error;
    }
  }

  async validateReportingManager(req: Request, params: any) {
    let message: string = null;

    if (params?.reporting_manager_id && params?._id) {
      params.user_id = params._id;

      const juniorIds: any = await this.getJunior(req, params);

      if (params?._id === params?.reporting_manager_id) {
        message = 'USER.REPORTING_ERROR.SAME';
      }

      if (juniorIds.some((id: any) => id.equals(toObjectId(params._id)))) {
        message = 'USER.REPORTING_ERROR.SELF';
      }

      if (
        juniorIds.some((id: any) =>
          id.equals(toObjectId(params.reporting_manager_id)),
        )
      ) {
        message = 'USER.REPORTING_ERROR.CYCLIC';
      }
    }

    return {
      message,
    };
  }

  async assignedUserToStateMapping(req: Request, params: any): Promise<any> {
    try {
      const userId = toObjectId(params.user_id);

      const match: Record<string, any> = {
        is_delete: 0,
        user_id: userId,
      };
      const existing = await this.userToStateMappingModel.findOne(match).lean();

      if (existing) {
        const updateFields: Record<string, any> = {};
        if (Array.isArray(params.state)) {
          updateFields.state = params.state;
        }
        if (Array.isArray(params.district)) {
          updateFields.district = params.district;
        }

        const update: Record<string, any> = {
          $set: {
            ...updateFields,
            ...req['createObj'],
          },
        };

        const result = await this.userToStateMappingModel.updateOne(
          match,
          update,
        );

        if (result.modifiedCount > 0) {
          return this.res.success('SUCCESS.STATE_UPDATED');
        } else {
          return this.res.error(
            HttpStatus.NOT_MODIFIED,
            'ERROR.NO_CHANGES_MADE',
          );
        }
      } else {
        const doc = new this.userToStateMappingModel({
          ...req['createObj'],
          ...params,
          user_id: userId,
          is_delete: 0,
        });
        await doc.save();
        return this.res.success('SUCCESS.STATE_ASSIGNED');
      }
    } catch (error) {
      return this.res.error(HttpStatus.BAD_REQUEST, 'ERROR.BAD_REQ', error);
    }
  }

  async fetchUserStateMapping(req: Request, params: any): Promise<any> {
    try {
      const match: Record<string, any> = {
        org_id: req['user']['org_id'],
        is_delete: 0,
      };
      if (params?.user_id) {
        match.user_id = toObjectId(params.user_id);
      } else {
        match.district = { $in: [new RegExp(`^${params.district}$`, 'i')] };
      }

      const result = await this.userToStateMappingModel.find(match).lean();
      return result;
    } catch (error) {
      return this.res.error(HttpStatus.BAD_REQUEST, 'ERROR.BAD_REQ', error);
    }
  }

  async getReportingManager(req: any, params: any): Promise<any> {
    try {
      let match: Record<string, any> = {
        is_delete: 0,
        org_id: req['user']['org_id'],
        child_user_id: toObjectId(req['user']['_id']),
      };
      const projection: Record<string, any> = {
        parent_user_id: 1,
        parent_user_name: 1,
      };
      const data: any = await this.userHierarchyModel
        .findOne(match, projection)
        .lean();
      return data || null;
    } catch (error) {
      throw new Error('Error fetching reporting manager: ' + error.message);
    }
  }

  // async getTechnicalTeamUsers(req: Request): Promise<any> {
  //     try {
  //       const match: Record<string, any> = {
  //         is_delete: 0,
  //         org_id: req['user']['org_id'],
  //         designation: 'Technical Team',
  //       };

  //       const projection: Record<string, any> = {

  //         name: 1,
  //       };

  //       const users = await this.userModel.find(match, projection);
  //       const result =  users.map(user => ({
  //         value: user._id,
  //         label: user.name,
  //       }));
  //       return this.res.success('SUCCESS.FETCH', result);

  //        } catch (error) {
  //         throw new Error('Error fetching reporting manager: ' + error.message)        }
  //   }

  async getUsersByDesignation(req: Request, params: any): Promise<any> {
    try {
      const designation = params.designation?.trim();

      const match: Record<string, any> = {
        is_delete: 0,
        org_id: req['user']['org_id'],
        ...(designation ? { designation: designation } : {}),
        ...(params.user_role_name
          ? { user_role_name: params.user_role_name }
          : {}),

        ...(params.login_type_id
          ? { login_type_id: params.login_type_id }
          : {}),
      };

      const projection: Record<string, any> = {
        name: 1,
      };

      const users = await this.userModel.find(match, projection);

      const result = users.map((user) => ({
        value: user._id,
        label: user.name,
      }));

      return this.res.success('SUCCESS.FETCH', result);
    } catch (error) {
      throw new Error('Error fetching users by designation: ' + error.message);
    }
  }
}
