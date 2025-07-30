import { HttpStatus, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { LeaveMasterModel } from '../models/leave-master.model';
import { ResponseService } from 'src/services/response.service';
import { toObjectId, commonFilters, getDaysCount, toLocalDateString, convertToUtcRange, titleCase, tat, buildDateRange, toIST, exactDateFormat } from 'src/common/utils/common.utils';
import { LeaveBalanceModel } from '../models/leave-balance.model';
import { LeaveModel } from '../models/leave.model';
import { SharedUserService } from 'src/modules/master/user/shared-user.service';
import { S3Service } from 'src/shared/rpc/s3.service';
import { LeaveDocsModel } from '../models/leave-doc-model';
import { UserModel } from 'src/modules/master/user/models/user.model';
@Injectable()
export class LeaveService {
    constructor
        (
            @InjectModel(LeaveMasterModel.name) private leaveMasterModel: Model<LeaveMasterModel>,
            @InjectModel(LeaveBalanceModel.name) private leaveBalanceModel: Model<LeaveBalanceModel>,
            @InjectModel(LeaveModel.name) private leaveModel: Model<LeaveModel>,
            @InjectModel(LeaveDocsModel.name) private leaveDocsModel: Model<LeaveDocsModel>,
            @InjectModel(UserModel.name) private readonly userModel: Model<UserModel>,
            private readonly res: ResponseService,
            private readonly s3Service: S3Service,
            private readonly sharedUserService: SharedUserService,
        ) { }

    private async checkLeaveConflict(req: Request, params: any): Promise<any> {
        try {
            const leaveMaster: Record<string, any> = await this.leaveMasterModel.findOne({
                user_id: params.user_object_id,
                is_delete: 0,
            });

            if (!leaveMaster) return this.res.error(HttpStatus.BAD_REQUEST, 'LEAVE.MASTER.LEAVE_POLICY_NOT_FOUND');

            const leaveMasterStart = leaveMaster.leave_start;
            const leaveMasterEnd = leaveMaster.leave_end;
            const requestedLeaveStart = params.leave_start;
            const requestedLeaveEnd = params.leave_end;

            if (requestedLeaveStart < leaveMasterStart || requestedLeaveEnd > leaveMasterEnd) {
                return this.res.error(HttpStatus.BAD_REQUEST, 'LEAVE.MASTER.LEAVE_POLICY_NOT_EXIST');
            }
            return leaveMaster;
        } catch (error) {
            return this.res.error(HttpStatus.BAD_REQUEST, 'ERROR.BAD_REQ', error.message || error);
        }
    }
    private async checkExistingLeave(req: Request, params: any) {
        try {
            const requestedLeaveStart = toLocalDateString(new Date(params.leave_start));
            const requestedLeaveEnd = toLocalDateString(new Date(params.leave_end));

            const existingLeave: Record<string, any> = await this.leaveModel.findOne({
                user_id: params.user_object_id,
                is_delete: 0,
                status: { $ne: global.APPROVAL_STATUS[3] },
                $or: [
                    { leave_start: { $lte: requestedLeaveEnd } },
                    { leave_end: { $gte: requestedLeaveStart } }
                ],
            });

            if (existingLeave) return this.res.error(HttpStatus.BAD_REQUEST, 'LEAVE.MASTER.EXIST');
            return null;
        } catch (error) {
            return this.res.error(HttpStatus.BAD_REQUEST, 'ERROR.BAD_REQ', error.message || error);
        }
    }
    async create(req: Request, params: any): Promise<any> {
        try {
            const { leave_start, leave_end } = params;
            params.user_id = toObjectId(params.user_id);

            if (leave_start >= leave_end) return this.res.error(HttpStatus.BAD_REQUEST, 'WARNING.INVALID_DATE_RANGE');

            const existingLeave: Record<string, any> = await this.leaveMasterModel.findOne({
                user_id: params.user_id,
                is_delete: 0,
                $or: [
                    { leave_start: { $lte: leave_end }, leave_end: { $gte: leave_start } },
                    { leave_start: { $gte: leave_start, $lte: leave_end } },
                    { leave_end: { $gte: leave_start, $lte: leave_end } }
                ]
            });

            if (existingLeave) return this.res.error(HttpStatus.BAD_REQUEST, 'LEAVE.MASTER.ALREADY_EXIST');

            const saveObj: Record<string, any> = {
                ...req['createObj'],
                ...params,
            };

            if (req?.['user']?.['org']?.['is_leave_senior_status']) {
                saveObj['senior_status'] = global.LEAVE_STATUS[2];
            }
            const document = new this.leaveMasterModel(saveObj);
            await document.save();
            return this.res.success('SUCCESS.SAVE');
        } catch (error) {
            return this.res.error(HttpStatus.BAD_REQUEST, 'ERROR.BAD_REQ', error);
        }
    }
    async update(req: Request, params: any): Promise<any> {
        try {

            const exist: Record<string, any> = await this.leaveMasterModel.findOne({ _id: params._id }).exec();
            if (!exist) return this.res.error(HttpStatus.BAD_REQUEST, 'LEAVE.NOT_EXIST');
            const { leave_start, leave_end } = params;
            params.user_id = toObjectId(params.user_id)
            if (leave_start >= leave_end) return this.res.error(HttpStatus.BAD_REQUEST, 'LEAVE.INVALID_DATE_RANGE');

            if (!params?.is_delete) {
                const overlappingLeave: Record<string, any> = await this.leaveMasterModel.findOne({
                    user_id: params.user_id,
                    is_delete: 0,
                    _id: { $ne: params._id },
                    $or: [
                        { leave_start: { $lte: leave_end }, leave_end: { $gte: leave_start } },
                        { leave_start: { $gte: leave_start, $lte: leave_end } },
                        { leave_end: { $gte: leave_start, $lte: leave_end } }
                    ]
                });

                if (overlappingLeave) return this.res.error(HttpStatus.BAD_REQUEST, 'LEAVE.MASTER.ALREADY_EXIST');
            }

            const updateObj: Record<string, any> = {
                ...req['updateObj'],
                ...params,
            };

            const updatedDocument = await this.leaveMasterModel.updateOne(
                { _id: params._id },
                updateObj
            );

            if (!updatedDocument) return this.res.error(HttpStatus.BAD_REQUEST, 'LEAVE.MASTER.UPDATE_FAILED');
            if (!params?.is_delete) {
                return this.res.success('SUCCESS.UPDATE');
            }
            return this.res.success('SUCCESS.DELETE');

        } catch (error) {
            return this.res.error(HttpStatus.BAD_REQUEST, 'ERROR.BAD_REQ', error);
        }
    }
    async read(req: Request, params: any): Promise<any> {
        try {

            let match: Record<string, any> = { is_delete: 0, org_id: req['user']['org_id'] };
            let sorting: Record<string, 1 | -1> = { _id: -1 };

            if (params?.sorting && typeof params.sorting === 'object' && Object.keys(params.sorting).length !== 0) {
                sorting = params.sorting;
            }

            Object.assign(match, commonFilters(params.filters))

            const page: number = params?.page || global.PAGE;
            const limit: number = params?.limit || global.LIMIT;
            const skip: number = (page - 1) * limit;
            const mainPipeline = [
                { $match: match },
                { $sort: sorting }
            ];
            const totalCountData: Record<string, any>[] = await this.leaveMasterModel.aggregate([
                ...mainPipeline,
                { $count: "totalCount" },
            ]);
            const total: number = totalCountData.length > 0 ? totalCountData[0].totalCount : 0;
            let result: Record<string, any>[] = await this.leaveMasterModel.aggregate([
                ...mainPipeline,
                { $skip: skip },
                { $limit: limit },
            ]);

            // result = result.map(item => {
            //     if (item.created_at) {
            //         item.created_at = exactDateFormat(item.created_at);
            //     }
            //     return item;
            // });
            return this.res.pagination(result, total, page, limit);
        } catch (error) {
            return this.res.error(HttpStatus.BAD_REQUEST, 'ERROR.BAD_REQ', error.message);
        }
    }
    async getLeaveTypes(req: Request, params: any): Promise<any> {
        try {
            let match: Record<string, any> = {
                is_delete: 0,
                org_id: req['user']['org_id'],
            };

            if (!params?.dropdown_name) {
                match.user_id = params?.user_id ? toObjectId(params.user_id) : req['user']['_id'];
            }
            let sorting: Record<string, 1 | -1> = { _id: -1 };
            const projection: Record<string, any> = { form_data: 1, leave_start: 1, leave_end: 1 };

            let leaveMaster: Record<string, any> = await this.leaveMasterModel
                .findOne(match, projection)
                .sort(sorting)
                .exec();


            if (req.url.includes(global.MODULE_ROUTES[18]) && !leaveMaster?.form_data) return []

            if (!leaveMaster?.form_data) {
                return this.res.error(HttpStatus.CONFLICT, 'LEAVE.APP.POLICY_NOT_FOUND');
            }

            const dateRanges = buildDateRange('leave_start', 'leave_end', toIST(leaveMaster?.leave_start, false), toIST(leaveMaster?.leave_end, false));


            const balanceMatch = {
                ...match,
                ...dateRanges,
                status: { $ne: global.LEAVE_STATUS[3] }
            }

            let statusCounts = await this.leaveModel.aggregate([
                {
                    $match: balanceMatch
                },
                {
                    $addFields: {
                        duration_days: {
                            $cond: [
                                { $eq: ["$leave_duration", "Half Day"] },
                                0.5,
                                {
                                    $add: [
                                        {
                                            $divide: [
                                                { $subtract: ["$leave_end", "$leave_start"] },
                                                1000 * 60 * 60 * 24
                                            ]
                                        },
                                        1
                                    ]
                                }
                            ]
                        }
                    }
                },
                {
                    $group: {
                        _id: "$leave_type",
                        count: { $sum: "$duration_days" }
                    }
                }
            ]);

            const formData = leaveMaster?.form_data;
            let leave_balance: any[] = [];

            leave_balance = Object.entries(formData).map(([key, totalValue]) => {
                const total = Number(totalValue);
                const type = titleCase(key);
                const used = statusCounts.find(item => item._id === type)?.count || 0;
                const balance = total - used;

                return {
                    type,
                    total,
                    used,
                    balance,
                    label: type,
                    value: type
                };
            });
            if (params?.internalCall) return leave_balance;
            return this.res.success('SUCCESS.FETCH', leave_balance);
        } catch (error) {
            if (params?.internalCall) throw error
            return this.res.error(HttpStatus.BAD_REQUEST, 'ERROR.BAD_REQ', error);
        }
    }
    async leaveRead(req: Request, params: any): Promise<any> {
        try {
            params = params || {};
            const user = req['user'];
            const match: Record<string, any> = { is_delete: 0, org_id: user.org_id };

            const sorting: Record<string, 1 | -1> = (params?.sorting && Object.keys(params.sorting).length)
                ? params.sorting
                : { _id: -1 };

            const filters = params?.filters || {};
            const activeTab = filters.activeTab;

            if (activeTab === global.LEAVE_STATUS[1]) {
                match.status = global.LEAVE_STATUS[1];
            } else if (activeTab === global.LEAVE_STATUS[2]) {
                match.status = global.LEAVE_STATUS[2];
            } else if (activeTab === global.LEAVE_STATUS[3]) {
                match.status = global.LEAVE_STATUS[3];
            }

            delete params.filters.activeTab

            Object.assign(match, commonFilters(params.filters))

            const page: number = params?.page || global.PAGE;
            const limit: number = params?.limit || global.LIMIT;
            const skip: number = (page - 1) * limit;

            if (global.LOGIN_TYPE_ID_PERMISSION?.includes(user.login_type_id)) {
                const userIds = await this.sharedUserService.getUsersIds(req, params);
                match.$or = [
                    { user_id: { $in: userIds } },
                    { created_id: { $in: userIds } }
                ];
            }

            let [result, total, statusCounts] = await Promise.all([
                this.leaveModel
                    .find(match)
                    .select('-is_delete -org_id')
                    .sort(sorting)
                    .skip(skip)
                    .limit(limit)
                    .lean()
                    .exec(),

                this.leaveModel.countDocuments(match),

                this.leaveModel.aggregate([
                    { $match: { ...match, status: { $in: Object.values(global.LEAVE_STATUS) } } },
                    { $group: { _id: '$status', count: { $sum: 1 } } }
                ])
            ]);

            const statusMap = Object.fromEntries(statusCounts.map(item => [item._id, item.count]));

            const statusTabs = [
                { approvedCount: statusMap[global.LEAVE_STATUS[1]] || 0 },
                { pendingCount: statusMap[global.LEAVE_STATUS[2]] || 0 },
                { rejectCount: statusMap[global.LEAVE_STATUS[3]] || 0 }
            ];

            const data: any = { result, leave_status_tabs: statusTabs };
            return this.res.pagination(data, total, page, limit);

        } catch (error) {
            return this.res.error(HttpStatus.BAD_REQUEST, 'ERROR.BAD_REQ', error);
        }
    }
    async leaveCreate(req: Request, params: any): Promise<any> {
        try {
            params.user_object_id = toObjectId(params.user_id);
            if (params.leave_duration) {
                params.leave_mode = params.leave_duration
            }
            const conflictResult = await this.checkLeaveConflict(req, params);

            // const existingLeave = await this.checkExistingLeave(req, params);

            const leave_balance = await this.getLeaveTypes(req, params);
            let balance = 0;
            if (params.leave_type) {
                if (!leave_balance['data'] || !Array.isArray(leave_balance['data'])) {
                    return this.res.error(HttpStatus.BAD_REQUEST, 'LEAVE.MASTER.LEAVE_TYPE_NOT_FOUND');
                }

                const leaveTypeData = leave_balance['data'].find((item) => item.type === params.leave_type);

                if (!leaveTypeData) {
                    return this.res.error(HttpStatus.BAD_REQUEST, 'LEAVE.MASTER.LEAVE_TYPE_NOT_FOUND');
                }
                balance = leaveTypeData.balance;
            }

            if (balance <= 0) return this.res.error(HttpStatus.BAD_REQUEST, 'LEAVE.MASTER.NO_BALANCE_AVAILABLE');

            if (params.leave_start < new Date() || params.leave_end < new Date() || params.leave_end < params.leave_start) {
                return this.res.error(HttpStatus.BAD_REQUEST, 'LEAVE.MASTER.WRONG_DATE_PASSED');
            }

            const appliedDays = getDaysCount(params.leave_start, params.leave_end);
            if (appliedDays > balance) {
                return this.res.error(HttpStatus.BAD_REQUEST, 'LEAVE.MASTER.NO_BALANCE_AVAILABLE');
            }

            const userData: Record<string, any> = await this.userModel.findOne({ _id: toObjectId(params.user_id) })
            params.status = global.APPROVAL_STATUS[0];
            const saveObj = {
                ...req['createObj'],
                ...params,
                created_at: new Date(),
                updated_at: new Date(),
                user_id: toObjectId(params.user_id),
                user_name: userData?.username
            };

            let document: any = new this.leaveModel(saveObj);
            await document.save();

            params.leave_balance = balance;
            params.leave_master_id = toObjectId(conflictResult?._id);

            const userLeaveBalance = await this.leaveBalanceModel.findOne({ user_id: params.user_object_id, leave_master_id: params.leave_master_id });

            if (!userLeaveBalance) {
                const newLeaveBalance = new this.leaveBalanceModel({
                    ...req['createObj'],
                    user_id: params.user_object_id,
                    leave_master_id: params.leave_master_id,
                    leave_balance: {},
                });

                if (leave_balance['data'] && Array.isArray(leave_balance['data'])) {
                    leave_balance['data'].forEach((leaveTypeData) => {
                        if (leaveTypeData.type === params.leave_type) {
                            leaveTypeData.balance -= appliedDays;
                        }

                        newLeaveBalance.leave_balance[leaveTypeData.type] = {
                            total: leaveTypeData.total,
                            balance: leaveTypeData.balance,
                        };
                    });
                }

                await newLeaveBalance.save();
            } else {
                const updatedLeaveBalance = userLeaveBalance.leave_balance;
                if (leave_balance['data'] && Array.isArray(leave_balance['data'])) {
                    leave_balance['data'].forEach((leaveTypeData) => {
                        if (leaveTypeData.type === params.leave_type) {
                            leaveTypeData.balance -= appliedDays;
                        }
                        updatedLeaveBalance[leaveTypeData.type] = {
                            total: leaveTypeData.total,
                            balance: leaveTypeData.balance,
                        };
                    });
                }
                await this.leaveBalanceModel.updateOne(
                    { id: userLeaveBalance['_id'] },
                    { $set: { leave_balance: updatedLeaveBalance } }
                );
            }
            return this.res.success('SUCCESS.CREATE');
        } catch (error) {
            console.log(error)
            return this.res.error(HttpStatus.BAD_REQUEST, 'ERROR.BAD_REQ', error);
        }
    }
    async leaveDetail(req: Request, params: any): Promise<any> {
        try {
            let match: Record<string, any> = { is_delete: 0, org_id: req['user']['org_id'], _id: params.leave_id };
            const projection = {
                created_unix_time: 0,
            }
            let result: Record<string, any> = await this.leaveModel.findOne(match, projection).lean();
            if (!result) return this.res.success('SUCCESS.FETCH', result);
            result.files = await this.getDocument(result._id, global.THUMBNAIL_IMAGE)
            return this.res.success('SUCCESS.FETCH', result)
        } catch (error) {
            return this.res.error(HttpStatus.BAD_REQUEST, 'ERROR.BAD_REQ', error);
        }
    }
    async updateStatus(req: Request, params: any): Promise<any> {
        try {
            const leave = await this.leaveModel.findOne({ _id: params._id }).exec();
            if (!leave) return this.res.error(HttpStatus.NOT_FOUND, 'LEAVE.NOT_EXIST');
            const { status, senior_status, senior_status_remark } = params;

            let updateObj: Record<string, any> = {};
            if (params?.senior_status && req?.['user']?.['org']?.['is_leave_senior_status']) {

                updateObj = {
                    ...req['seniorObj'],
                    senior_status,
                    senior_status_remark
                }

            } else {

                updateObj = {
                    ...req['updateObj'],
                    status
                };
                if (params.status === global.LEAVE_STATUS[3]) {
                    updateObj.reason = params.reason;
                }
            }
            const updatedDocument = await this.leaveModel.updateOne({ _id: params._id }, updateObj);
            if (!updatedDocument) {
                return this.res.error(HttpStatus.BAD_REQUEST, 'ERROR.UPDATE_FAILED');
            }
            return this.res.success('SUCCESS.UPDATE');
        } catch (error) {
            return this.res.error(HttpStatus.BAD_REQUEST, 'ERROR.BAD_REQ', error);
        }
    }
    async delete(req: Request, params: any): Promise<any> {
        try {
            const leave = await this.leaveModel.findOne({ _id: params._id }).exec();
            if (!leave) return this.res.error(HttpStatus.NOT_FOUND, 'LEAVE.NOT_EXIST');

            const updateObj: Record<string, any> = {
                is_delete: 1
            };

            const deleted = await this.leaveModel.updateOne({ _id: params._id }, updateObj);
            if (!deleted || deleted.modifiedCount === 0) {
                return this.res.error(HttpStatus.BAD_REQUEST, 'ERROR.DELETE_FAILED');
            }

            return this.res.success('SUCCESS.DELETED');
        } catch (error) {
            return this.res.error(HttpStatus.BAD_REQUEST, 'ERROR.BAD_REQ', error);
        }
    }
    async getDocumentByDocsId(req: any, params: any): Promise<any> {
        const doc = await this.s3Service.getDocumentsById(this.leaveDocsModel, params._id);
        return this.res.success('SUCCESS.FETCH', doc);
    }
    async lastLeave(req: Request, params: any): Promise<any> {
        try {
            const match: Record<string, any> = {
                is_delete: 0,
                org_id: req['user']['org_id'],
                user_id: req['user']['_id'],
            }
            const data: Record<string, any> = await this.leaveModel.findOne(match, { created_at: 1 }).sort({ created_at: -1 }).lean();
            if (data) {
                return tat(data.created_at, new Date());
            } else {
                return '0 days'
            }
        } catch (error) {
            throw error
        }
    }
    async getDocument(
        id: any,
        type: typeof global.FULL_IMAGE | typeof global.THUMBNAIL_IMAGE | typeof global.BIG_THUMBNAIL_IMAGE = global.FULL_IMAGE
    ): Promise<any> {
        return this.s3Service.getDocumentsByRowId(this.leaveDocsModel, id, type);
    }
}