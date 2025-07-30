import { HttpStatus, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, PipelineStage } from 'mongoose';
import { LeaveModel } from '../models/leave.model';
import { LeaveMasterModel } from '../models/leave-master.model';
import { ResponseService } from 'src/services/response.service';
import { commonFilters, getDaysCount, toLocalDateString, toObjectId } from 'src/common/utils/common.utils';
import { LeaveBalanceModel } from '../models/leave-balance.model';
import { SharedUserService } from 'src/modules/master/user/shared-user.service';
import { S3Service } from 'src/shared/rpc/s3.service';
import { LeaveDocsModel } from '../models/leave-doc-model';
import { LeaveDuration } from './dto/app-leave.dto';
import { WorkingActivityType } from 'src/modules/master/user/models/user-working-activity.model';
import { LeaveService } from '../web/leave.service';



@Injectable()
export class AppLeaveService {
    constructor(
        @InjectModel(LeaveMasterModel.name) private leaveMasterModel: Model<LeaveMasterModel>,
        @InjectModel(LeaveModel.name) private leaveModel: Model<LeaveModel>,
        @InjectModel(LeaveBalanceModel.name) private leaveBalanceModel: Model<LeaveBalanceModel>,
        @InjectModel(LeaveDocsModel.name) private leaveDocsModel: Model<LeaveDocsModel>,
        private readonly res: ResponseService,
        private readonly sharedUserService: SharedUserService,
        private readonly s3Service: S3Service,
        private readonly leaveService: LeaveService,
    ) { }

    private async checkLeaveConflict(req: Request, params: any): Promise<any> {
        try {
            const leaveMasters = await this.leaveMasterModel.find({
                user_id: req['user']['_id'],
                is_delete: 0,
                org_id: req['user']['org_id']
            }).sort({ _id: -1 });

            if (!leaveMasters || leaveMasters.length === 0) {
                return { status: true, message: 'LEAVE.APP.POLICY_NOT_FOUND' };
            }

            const requestedLeaveStart = toLocalDateString(new Date(params.leave_start));
            const requestedLeaveEnd = toLocalDateString(new Date(params.leave_end));

            if (requestedLeaveStart > requestedLeaveEnd) {
                return { status: true, message: 'WARNING.INVALID_DATE_RANGE' };
            }

            for (const leaveMaster of leaveMasters) {
                const leaveMasterStart = toLocalDateString(new Date(leaveMaster.leave_start));
                const leaveMasterEnd = toLocalDateString(new Date(leaveMaster.leave_end));

                // ✅ Check if requested leave is fully inside this leave policy range

                if (
                    requestedLeaveStart >= leaveMasterStart &&
                    requestedLeaveEnd <= leaveMasterEnd
                ) {
                    // ✅ This is the matching row
                    return leaveMaster;
                }

            }

            // ❌ No matching policy found
            return { status: true, message: 'LEAVE.APP.POLICY_DATE_MISMATCH' };

        } catch (error) {
            throw error;
        }
    }
    private async checkExistingLeave(req: Request, params: any) {
        try {
            const requestedLeaveStart = new Date(params.leave_start);
            const requestedLeaveEnd = new Date(params.leave_end);

            const existingLeave = await this.leaveModel.findOne({
                user_id: req['user']['_id'],
                is_delete: 0,
                status: { $nin: global.REJECT_STATUS },
                leave_start: { $lte: requestedLeaveEnd },
                leave_end: { $gte: requestedLeaveStart }
            });

            if (existingLeave) return true
            else return false
        } catch (error) {
            return error
        }
    }
    async create(req: Request, params: any): Promise<any> {
        try {
            const conflictResult = await this.checkLeaveConflict(req, params);
            if (conflictResult?.status) return this.res.error(HttpStatus.BAD_REQUEST, conflictResult.message);
            const check = await this.checkExistingLeave(req, params);
            if (check) return this.res.error(HttpStatus.BAD_REQUEST, 'LEAVE.APP.ALREADY_EXIST');
            params.internalCall = true;
            const leave_balance = await this.leaveService.getLeaveTypes(req, params);

            let balance = 0;
            const matchedLeave = leave_balance?.find((row: any) => row.value === params.leave_type);

            if (!matchedLeave) return this.res.error(HttpStatus.NOT_FOUND, 'ERROR.BAD_REQ', 'leave balance not found');
            if (matchedLeave?.balance <= 0) {
                return this.res.error(HttpStatus.BAD_REQUEST, ['LEAVE.APP.BALANCE_CONFLICT', { leave_type: matchedLeave.type }]);
            }

            balance = +matchedLeave.balance
            let appliedDays = getDaysCount(params.leave_start, params.leave_end);
            if (appliedDays > 1 && params.leave_duration === LeaveDuration.half_day) {
                return this.res.error(HttpStatus.BAD_REQUEST, 'LEAVE.APP.HALF_DAY_ERROR');
            } else if (appliedDays == 1 && params.leave_duration === LeaveDuration.half_day) {
                appliedDays = 0.5
            }
            if (appliedDays > balance) {
                const requestedDays = String(appliedDays);
                return this.res.error(HttpStatus.BAD_REQUEST, [
                    'LEAVE.APP.AVAILABLE_BALANCE',
                    {
                        available: matchedLeave.balance,
                        leave_type: matchedLeave.type,
                        requested: requestedDays
                    }
                ]);
            }
            const today = toLocalDateString(new Date());

            if (
                params.leave_start < today ||
                params.leave_end < today ||
                params.leave_end < params.leave_start
            ) {
                return this.res.error(HttpStatus.BAD_REQUEST, 'LEAVE.APP.WRONG_DATES_PASSED');
            }

            params.status = global.APPROVAL_STATUS[0];
            const saveObj = {
                ...req['createObj'],
                ...params,
                user_id: req['user']['_id'],
                user_name: req['user']['name'],
            };

            if (req?.['user']?.['org']?.['is_leave_senior_status']) {
                saveObj['senior_status'] = global.LEAVE_STATUS[2];
            }

            let document: any = new this.leaveModel(saveObj);
            const insert = await document.save();
            if (insert) {
                if (req['user']['login_type_id'] === global.LOGIN_TYPE_ID['FIELD_USER']) {
                    const data = {
                        working_activity_type: WorkingActivityType.LEAVE_SUBMITTED,
                        working_activity_id: insert._id,
                        display_name: params.leave_type
                    }
                    this.sharedUserService.saveUserWorkingActivity(req, data);
                }
            }

            return this.res.success('SUCCESS.CREATE', { inserted_id: insert._id });
        } catch (error) {
            return this.res.error(HttpStatus.BAD_REQUEST, 'ERROR.BAD_REQ', error);
        }
    }
    async updateStatus(req: Request, params: any): Promise<any> {
        try {
            // if (!req?.['user']?.['org']?.['is_leave_senior_status']) {
            //     return this.res.error(HttpStatus.BAD_REQUEST, 'ERROR.IS_SENIOR_AUTHORIZED');
            // }

            const leave = await this.leaveModel.findOne({ _id: params._id }).exec();
            if (!leave) return this.res.error(HttpStatus.NOT_FOUND, 'LEAVE.NOT_EXIST');

            const updateObj = {
                ...req['updateObj'],
                ...req['seniorObj'],
                ...params,
            };

            const updatedDocument = await this.leaveModel.updateOne({ _id: params._id }, updateObj);
            if (!updatedDocument) return this.res.error(HttpStatus.BAD_REQUEST, 'ERROR.UPDATE_FAILED');
            return this.res.success('SUCCESS.UPDATE');
        } catch (error) {
            return this.res.error(HttpStatus.BAD_REQUEST, 'ERROR.BAD_REQ', error);
        }
    }
    async read(req: Request, params: any): Promise<any> {
        try {

            let is_senior_status: Boolean = false;
            if (req?.['user']?.['org']?.['is_leave_senior_status']) is_senior_status = true;

            params = params || {};
            let match: Record<string, any> = {
                is_delete: 0,
                org_id: req['user']['org_id'],
                user_id: req['user']['_id']
            };

            let sorting: Record<string, 1 | -1> = { _id: -1 };
            if (params?.sorting && Object.keys(params.sorting).length !== 0) {
                sorting = params.sorting;
            }

            const filter = commonFilters(params?.filters);

            match = { ...match, ...filter };

            params.match = match;

            const page: number = params?.page || global.PAGE;
            const limit: number = params?.limit || global.LIMIT;
            const skip: number = (page - 1) * limit;

            const total: number = await this.leaveModel.countDocuments(match);

            const result = await this.leaveModel
                .find(match)
                .select('-is_delete -org_id')
                .sort(sorting)
                .skip(skip)
                .limit(limit)
                .exec();

            params.level = 1
            const juniorsIds = await this.sharedUserService.getJunior(req, params)
            const pendingCountMatch: Record<string, any> = {
                user_id: { $in: juniorsIds },
                is_delete: 0,
                org_id: req['user']['org_id'],
                $or: [
                    { senior_status: global.APPROVAL_STATUS[0] },
                    { senior_status: { $exists: false } }
                ]
            }

            const pendingMatch: Record<string, any> = {
                is_delete: 0,
                org_id: req['user']['org_id'],
                user_id: { $in: juniorsIds.length ? juniorsIds : [req['user']['_id']] }
            }
            const pendingCount: number = await this.leaveModel.countDocuments(pendingCountMatch);
            const pendingLeave: any = await this.leaveModel.find(pendingMatch);
            const is_junior_pending_leaves = pendingCount > 0 ? true : false

            const data: any = {
                is_junior_pending_leaves,
                result: result,//[...result, ...pendingLeave],
                is_junior_pending_leaves_count: pendingCount,
                is_senior_status
            }

            return this.res.pagination(data, total, page, limit);
        } catch (error) {
            return this.res.error(HttpStatus.BAD_REQUEST, 'ERROR.BAD_REQ', error);
        }
    }
    async juniorPendingLeaveRead(req: Request, params: any): Promise<any> {
        try {

            params = params || {};
            params.internalCall = true
            params.level = 1
            const userIds = await this.sharedUserService.getJunior(req, params)

            let match: Record<string, any> = {
                user_id: { $in: userIds },
                is_delete: 0,
                org_id: req['user']['org_id'],
                $or: [
                    { senior_status: global.APPROVAL_STATUS[0] },
                    { senior_status: { $exists: false } }
                ]
            }

            let sorting: Record<string, 1 | -1> = { _id: -1 };
            if (params?.sorting && Object.keys(params.sorting).length !== 0) {
                sorting = params.sorting;
            }

            const filter = commonFilters(params?.filters);

            match = { ...match, ...filter };

            params.match = match;

            const page: number = params?.page || global.PAGE;
            const limit: number = params?.limit || global.LIMIT;
            const skip: number = (page - 1) * limit;

            const total: number = await this.leaveModel.countDocuments(match);

            const userLookup: PipelineStage[] = this.sharedUserService.userLookup(req, params);

            const pipeline: PipelineStage[] = [
                { $match: match },
                ...userLookup,
                { $sort: sorting },
                { $skip: skip },
                { $limit: limit },
            ]

            const result = await this.leaveModel.aggregate(pipeline);

            return this.res.pagination(result, total, page, limit);
        } catch (error) {
            return this.res.error(HttpStatus.BAD_REQUEST, 'ERROR.BAD_REQ', error);
        }
    }
    async detail(req: Request, params: any): Promise<any> {
        try {
            const match: Record<string, any> = {
                is_delete: 0,
                org_id: req['user']['org_id'],
                user_id: req['user']['_id'],
                _id: toObjectId(params._id)
            }
            const data: Record<string, any> = await this.leaveModel.findOne(match).lean();
            if (!data) return this.res.success('SUCCESS.FETCH', null);
            params.user_id = data.user_id;
            const userData = await this.sharedUserService.getUsersByIds(req, params)
            data.user_name = userData?.[0]?.name || null
            data.user_mobile = userData?.[0]?.mobile || null
            data.files = await this.leaveService.getDocument(data._id, global.THUMBNAIL_IMAGE)
            return this.res.success('SUCCESS.FETCH', data);
        } catch (error) {
            return this.res.error(HttpStatus.BAD_REQUEST, 'ERROR.BAD_REQ', error);
        }
    }
    async upload(files: Express.Multer.File[], req: any): Promise<any> {
        try {
            req.body.module_name = Object.keys(global.MODULES).find(
                key => global.MODULES[key] === global.MODULES['Leave']
            );
            let response = await this.s3Service.uploadMultiple(files, req, this.leaveDocsModel);
            return this.res.success('SUCCESS.DOC_UPLOAD', response);
        } catch (error) {
            return this.res.error(HttpStatus.BAD_REQUEST, 'ERROR.BAD_REQ', error);
        }
    }

}