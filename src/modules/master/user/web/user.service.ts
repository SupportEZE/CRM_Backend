import { forwardRef, HttpStatus, Inject, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { UserModel } from '../models/user.model';
import { Model } from 'mongoose';
import { ResponseService } from 'src/services/response.service';
import { toObjectId, generatePassword, generateUsername, commonFilters, Like } from 'src/common/utils/common.utils';
import { UserHierarchyModel } from '../models/user-hierarchy.model';
import { SharedUserService } from '../shared-user.service';
import { AttendanceService } from 'src/modules/sfa/attendance/web/attendance.service';
import { GlobalService } from 'src/shared/global/global.service';

@Injectable()
export class UserService {
    constructor(
        @InjectModel(UserModel.name) private userModel: Model<UserModel>,
        @InjectModel(UserHierarchyModel.name) private userHierarchyModel: Model<UserHierarchyModel>,
        private readonly res: ResponseService,
        private readonly sharedUserService: SharedUserService,
        private readonly globalService: GlobalService,
    ) { }

    async create(req: Request, params: any): Promise<any> {
        try {

            const { message }: any = await this.sharedUserService.validateReportingManager(req, params);
            if (message) return this.res.error(HttpStatus.BAD_REQUEST, message);

            params.duplicacyCheck = true;
            const exist: object = await this.sharedUserService.duplicate(req, params)
            if (exist['status']) return this.res.error(HttpStatus.BAD_REQUEST, exist['message'])
            delete params.duplicacyCheck

            if (params?.user_role_id) params.user_role_id = toObjectId(params.user_role_id)
            if (params?.reporting_manager_id) params.reporting_manager_id = toObjectId(params.reporting_manager_id);

            const password: string = `${params.name}-${params.mobile.slice(-4)}`;
            params.username = generateUsername(password),
                params.password = generatePassword()

            let saveObj: Record<string, any> = {
                ...req['createObj'],
                ...params,
            };

            const document = new this.userModel(saveObj);
            const user: Record<string, any> = await document.save();
            if (!user['_id']) return this.res.error(HttpStatus.BAD_REQUEST, 'ERROR.BAD_REQ', 'WARNING.INSERT_FAILED');

            if (params?.reporting_manager_id) {
                saveObj = {
                    ...req['createObj'],
                    parent_user_name: params?.reporting_manager_name,
                    parent_user_id: params.reporting_manager_id,
                    child_user_name: params.name,
                    child_user_id: user['_id']
                }
                const subDocument = new this.userHierarchyModel(saveObj);
                subDocument.save();
            }
            return this.res.success('SUCCESS.CREATE', { inserted_id: user['_id'] });
        } catch (error) {
            return this.res.error(HttpStatus.BAD_REQUEST, 'ERROR.BAD_REQ', error);
        }
    }

    async read(req: Request, params: any): Promise<any> {
        try {

            params = await this.readPipeline(req, params);
            const page: number = params?.page || global.PAGE;
            const limit: number = params?.limit || global.LIMIT;
            const skip: number = (page - 1) * limit;

            if (global.LOGIN_TYPE_ID_PERMISSION?.includes(req['user']['login_type_id'])) {
                const userIds = await this.sharedUserService.getUsersIds(req, params);
                params.match.$or = [
                    { _id: { $in: userIds } },
                    { created_id: { $in: userIds } }
                ];
            }

            const pipeline: any[] =
                [
                    {
                        $addFields: {
                            pincode: { $toString: "$pincode" }
                        }
                    },
                    { $match: params.match },
                    { $project: params.projection },
                    { $sort: params.sorting }
                ];

            const totalCountData: Record<string, any>[] = await this.userModel.aggregate([
                ...pipeline,
                { $count: "totalCount" },
            ]);

            const total: number = totalCountData.length > 0 ? totalCountData[0].totalCount : 0;

            let result: Record<string, any>[] = await this.userModel.aggregate([
                ...pipeline,
                { $skip: skip },
                { $limit: limit },
            ]);

            result = result.map(item => {
                if (Array.isArray(item.beat_route_code)) {
                    item.assigned_beat = item.beat_route_code.join(', ');
                }

                if (item.device_info && item.device_info.system_name) {
                    item.user_platform = item.device_info.system_name;
                } else {
                    item.user_platform = '';
                }
                return item;
            });
            return this.res.pagination(result, total, page, limit);
        } catch (error) {
            return this.res.error(HttpStatus.BAD_REQUEST, 'ERROR.BAD_REQ', error);
        }
    }

    async readPipeline(req: Request, params: any): Promise<any> {
        try {
            let match: Record<string, any> = {
                is_delete: 0,
                org_id: req['user']['org_id'],
                login_type_id:
                {
                    $in: [
                        global.LOGIN_TYPE_ID['FIELD_USER'],
                        global.LOGIN_TYPE_ID['SYSTEM_USER'],
                        global.LOGIN_TYPE_ID['WAREHOUSE'],
                        global.LOGIN_TYPE_ID['SERVICE_VENDOR'],
                        global.LOGIN_TYPE_ID['SERVICE_FIELD_USER'],

                    ]
                }
            };
            let projection: Record<string, any> = {
                org_id: 0,
                is_delete: 0,
                jwt_app_token: 0,
                jwt_web_token: 0,
                fcm_token: 0
            }
            let sorting: Record<string, 1 | -1> = { _id: -1 };
            if (params?.sorting && Object.keys(params.sorting).length !== 0) sorting = params.sorting;
            if (params?.login_type_id) match.login_type_id = params.login_type_id;

            const filters: Record<string, any> = commonFilters(params?.filters);
            match = { ...match, ...filters };
            params.match = match
            params.sorting = sorting
            params.projection = projection
            return params
        } catch (error) {
            return this.res.error(HttpStatus.BAD_REQUEST, 'ERROR.BAD_REQ', error);
        }
    }

    async update(req: Request, params: any): Promise<any> {
        try {

            const { message }: any = await this.sharedUserService.validateReportingManager(req, params);
            if (message) return this.res.error(HttpStatus.BAD_REQUEST, message);

            let userId: any;
            let userData: object = await this.userModel.findById(params._id).lean();
            if (!userData) return this.res.error(HttpStatus.BAD_REQUEST, 'USER.NOT_EXIST')

            if (params?.is_delete && userData['is_delete'] === params?.is_delete) return this.res.error(HttpStatus.BAD_REQUEST, 'WARNING.ALREADY_DELETE');
            if (params?.status && userData['status'] === params?.status) return this.res.error(HttpStatus.BAD_REQUEST, 'WARNING.ALREADY_STATUS_UPDATE')

            if (!params?.is_delete && !params?.status) {
                params.duplicacyCheck = true;
                let exist = await this.sharedUserService.duplicate(req, params)
                if (exist['status']) return this.res.error(HttpStatus.BAD_REQUEST, exist['message'])
                delete params.duplicacyCheck
                if (params?.user_role_id) params.user_role_id = toObjectId(params.user_role_id)
                if (params?.reporting_manager_id) params.reporting_manager_id = toObjectId(params.reporting_manager_id);
                userId = toObjectId(params._id);
            }

            const updateObj = {
                ...req['updateObj'],
                ...params,
            };
            await this.userModel.updateOne(
                { _id: params._id },
                updateObj
            );
            if (!params?.is_delete && !params?.status) {
                if (params?.reporting_manager_id) {
                    await this.userHierarchyModel.updateOne({ child_user_id: userId }, { is_delete: 1 });
                    const saveObj = {
                        ...req['createObj'],
                        parent_user_name: params?.reporting_manager_name,
                        parent_user_id: params.reporting_manager_id,
                        child_user_name: userData['name'],
                        child_user_id: userData['_id']
                    }
                    const subDocument = new this.userHierarchyModel(saveObj);
                    subDocument.save();
                }
            }
            if (params?.is_delete) return this.res.success('SUCCESS.DELETE');
            if (params?.status) return this.res.success('SUCCESS.UPDATE')
            return this.res.success('SUCCESS.UPDATE', { inserted_id: params._id });
        } catch (error) {
            return this.res.error(HttpStatus.BAD_REQUEST, 'ERROR.BAD_REQ', error)
        }
    }

    async detail(req: Request, params: any): Promise<any> {
        try {
            let result: Record<string, any> = await this.userModel.findById(params._id, {
                created_unix_time: 0,
                is_delete: 0,
                org_id: 0,
            }).lean();

            if (result._id) {
                result.files = await this.sharedUserService.getDocument(result._id, global.THUMBNAIL_IMAGE);
                params.user_id = params._id;
                params.internalCall = true;
                result.juniors = await this.sharedUserService.getJunior(req, params);

                const attendanceAddress: Record<string, any> = await this.globalService.getPunchInAddress(req, params);

                const stateAssignData = await this.sharedUserService.fetchUserStateMapping(req, params);

                result.start_address = attendanceAddress?.start_address || '',
                    result.start_lat = attendanceAddress?.start_lat || '',
                    result.start_lng = attendanceAddress?.start_lng || '',
                    result.stop_address = attendanceAddress?.stop_address || '',
                    result.stop_lat = attendanceAddress?.stop_lat || '',
                    result.stop_lng = attendanceAddress?.stop_lng || ''
                result.assigned_state = stateAssignData[0]?.state || [],
                    result.assigned_district = stateAssignData[0]?.district || []
            }
            return this.res.success('SUCCESS.FETCH', result);
        } catch (error) {
            return this.res.error(HttpStatus.BAD_REQUEST, 'ERROR.BAD_REQ', error);
        }
    }

    // Find users exist with user codes or not
    async findUsersByUserCodes(org_id: number, params: any): Promise<any> {
        try {
            const user_codes = params.user_codes || [];
            const result = await this.userModel.find({ user_code: { $in: user_codes } }).select('mobile name');
            return result || []
        } catch (error) {
            console.log('Error during getting users by codes : ', error)
            return this.res.error(HttpStatus.BAD_REQUEST, 'ERROR.BAD_REQ', error);
        }
    }

}
