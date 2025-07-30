import { Injectable, HttpStatus } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { ResponseService } from 'src/services/response.service';
import {
    toObjectId, getDayOfWeek, getAllDatesInMonthIST,
    Like, convertToUtcRange, toIST, tat, getTimeDifferenceInMinutes,
    getMonthDaysInfo, splitDate,
    currentYear,
    currentMonthNumber,
    commonFilters,
    exactDateFormat
} from 'src/common/utils/common.utils';
import { AttendanceModel } from '../models/attendance.model';
import { UserModel } from 'src/modules/master/user/models/user.model';
import { HolidayModel } from 'src/modules/master/holiday/models/holiday.model';
import { LeaveModel } from '../../leave/models/leave.model';
import { Model, Types } from 'mongoose';
import { ValidBackgroundLocationModel } from '../models/valid-background-location.model';
import { S3Service } from 'src/shared/rpc/s3.service';
import { AttendanceDocsModel } from '../models/attendance-docs.model';
import { CsvService } from 'src/shared/csv/csv.service';
import * as dayjs from 'dayjs';
import { LocationService } from 'src/services/location.service';
import { TimelineModel, TimelineType } from '../models/timeline.model';
import { AttendanceRoutes } from './attendance.controller';
import { COLLECTION_CONST } from 'src/config/collection.constant';
import { SharedActivityService } from '../../activity/shared-activity.service';
import { BackgroundLocationModel } from '../models/backgroud-location.model.ts';
import { SharedUserService } from 'src/modules/master/user/shared-user.service';
import { DB_NAMES } from 'src/config/db.constant';
import { UserDocsModel } from 'src/modules/master/user/models/user-docs.model';

interface TimelineEvent {
    type: 'Walking' | 'Travel' | 'Halt' | 'Check In' | 'Punch In' | 'Punch Out';
    from: string;
    to: string;
}

export enum TimelineEventType {
    WALKING = 'Walking',
    TRAVEL = 'Travel',
    HALT = 'Halt',
    CHECK_IN = 'Check In',
    CHECK_OUT = 'Check Out',
    PUNCH_IN = 'Punch In',
    PUNCH_OUT = 'Punch Out',
    MOTION_CHANGE = "Motion Change",
    LOCALLY = 'Locally'
}

@Injectable()
export class AttendanceService {
    constructor(
        @InjectModel(AttendanceModel.name) private attendanceModel: Model<AttendanceModel>,
        @InjectModel(UserDocsModel.name) private userDocsModel: Model<UserDocsModel>,
        @InjectModel(AttendanceDocsModel.name) private attendanceDocsModel: Model<AttendanceDocsModel>,
        @InjectModel(UserModel.name) private userModel: Model<UserModel>,
        @InjectModel(HolidayModel.name) private holidayModel: Model<HolidayModel>,
        @InjectModel(LeaveModel.name) private leaveModel: Model<LeaveModel>,
        @InjectModel(ValidBackgroundLocationModel.name, DB_NAMES().SUPPORT_DB) private validBackgroundLocationModel: Model<ValidBackgroundLocationModel>,
        @InjectModel(BackgroundLocationModel.name, DB_NAMES().SUPPORT_DB) private backgroundLocationModel: Model<BackgroundLocationModel>,
        @InjectModel(TimelineModel.name) private timelineModel: Model<TimelineModel>,
        private readonly res: ResponseService,
        private readonly s3Service: S3Service,
        private readonly csvService: CsvService,
        private readonly locationService: LocationService,
        private readonly sharedActivityService: SharedActivityService,
        private readonly sharedUserService: SharedUserService,
    ) { }

    async update(req: Request, params: any): Promise<any> {
        try {
            const orgId = req['user']['org_id'];
            const userId = params.user_id;
            const now = new Date();

            const punchIn = params.punch_in ? new Date(params.punch_in) : null;
            const punchOut = params.punch_out ? new Date(params.punch_out) : null;

            if (!userId) {
                return this.res.error(HttpStatus.BAD_REQUEST, 'Missing user_id');
            }

            if (!punchIn && !punchOut) {
                return this.res.error(HttpStatus.BAD_REQUEST, 'Nothing to update');
            }

            const { start, end } = convertToUtcRange(new Date());
            const attendance = await this.attendanceModel.findOne({
                _id: toObjectId(params._id),
                org_id: orgId,
                user_id: toObjectId(userId),
                is_delete: 0
            });

            if (!attendance) {
                return this.res.error(HttpStatus.NOT_FOUND, 'Attendance record not found');
            }

            const updateFields: any = {
                updated_id: req['user']['_id'],
                updated_name: req['user']['name'],
                updated_at: now
            };

            if (punchIn) {
                updateFields.punch_in = punchIn;
            }

            if (punchOut) {
                updateFields.punch_out = punchOut;

                const punchInTime = punchIn || attendance.punch_in;
                if (punchInTime) {
                    const totalTime = Math.floor((new Date(punchOut).getTime() - new Date(punchInTime).getTime()) / 60000);
                    const hours = Math.floor(totalTime / 60);
                    const minutes = totalTime % 60;
                    updateFields.total_hours = `${hours > 0 ? `${hours}h ` : ''}${minutes}min`;
                }
            }

            await this.attendanceModel.updateOne({ _id: attendance._id }, { $set: updateFields });

            return this.res.success('Attendance updated successfully');
        } catch (error) {
            return this.res.error(HttpStatus.INTERNAL_SERVER_ERROR, 'Something went wrong', error);
        }
    }

    async read(req: Request, params: any): Promise<any> {
        try {
            let start: Date, end: Date;
            if (params.filters?.start_date && params.filters?.end_date) {
                ({ start, end } = convertToUtcRange(params.filters.start_date, params?.filters?.end_date));
            } else if (params.filters?.start_date) {
                ({ start, end } = convertToUtcRange(params.filters.start_date));
            } else {
                const today = new Date();
                const istOffset = 5.5 * 60 * 60 * 1000;
                const istDate = new Date(today.getTime() + istOffset);
                const currentDate = istDate.toISOString().split('T')[0];
                ({ start, end } = convertToUtcRange(currentDate));
            }

            const orgId = req['user']['org_id'];
            const userCode = req['user']['user_code']
            const dayOfWeek = getDayOfWeek();
            const userProjection: Record<string, any> = {
                name: 1,
                user_code: 1,
                email: 1,
                mobile: 1,
                user_name: 1,
                profile_pic: 1
            };

            const match: Record<string, any> = {
                org_id: orgId,
                attend_date: { $gte: start, $lte: end },
                is_delete: 0,
            }

            if (params.filters?.user_id) {
                match.user_id = {
                    $in: params.filters.user_id.map(id => toObjectId(id))
                }
            }
            if (params.filters?.start_date || params.filters?.end_date) {
                delete params.filters?.start_date;
                delete params.filters?.end_date;
            }
            const filters: Record<string, any> = commonFilters(params.filters);
            delete filters.start_date;
            delete filters.end_date;

            let userIdField: any = {}

            let excludedUserIds: string[] = [];
            if (global.LOGIN_TYPE_ID_PERMISSION?.includes(req['user']['login_type_id'])) {
                const userIds = await this.sharedUserService.getUsersIds(req, params);
                match.user_id = {
                    $in: userIds
                }
                userIdField.$in = userIds;
            }

            let punchedUsers: Record<string, any> = await this.attendanceModel.aggregate([
                {
                    $match: match,
                },
                {
                    $lookup: {
                        from: COLLECTION_CONST().CRM_USERS,
                        localField: 'user_id',
                        foreignField: '_id',
                        as: 'userData',
                    },
                },
                { $unwind: { path: '$userData', preserveNullAndEmptyArrays: true } },
                {
                    $addFields: {
                        name: '$userData.name',
                        user_code: '$userData.user_code',
                        designation: '$userData.designation',
                        reporting_manager_name: { $ifNull: ['$userData.reporting_manager_name', null] },
                    },
                },
                {
                    $lookup: {
                        from: COLLECTION_CONST().CRM_ATTENDANCE_DOCS,
                        localField: '_id',
                        foreignField: 'row_id',
                        as: 'profile_docs'
                    }
                },
                {
                    $match: filters
                },
                { $project: { userData: 0 } }
            ]).exec();

            // punchedUsers = punchedUsers.map((item: any) => {
            //     if (item?.created_at) {
            //         item.created_at = exactDateFormat(item?.created_at);
            //     }
            //     return item;
            // });

            const punchedUserIds = punchedUsers.map(user => user.user_id.toString());
            excludedUserIds.push(...punchedUserIds);

            userIdField = { ...userIdField, $nin: excludedUserIds }

            const leaveUsers = await this.leaveModel.aggregate([
                {
                    $match: {
                        org_id: orgId,
                        status: { $in: [global.APPROVAL_STATUS[0], global.APPROVAL_STATUS[1]] },
                        user_id: userIdField,
                        is_delete: 0,
                    }
                },
                {
                    $lookup: {
                        from: COLLECTION_CONST().CRM_USERS,
                        localField: 'user_id',
                        foreignField: '_id',
                        as: 'userData',
                    },
                },
                { $unwind: { path: '$userData', preserveNullAndEmptyArrays: true } },
                {
                    $addFields: {
                        user_code: '$userData.user_code',
                        email: '$userData.email',
                        mobile: '$userData.mobile',
                        name: '$userData.name',
                        designation: '$userData.designation',
                    },
                },
                {
                    $project: {
                        userData: 0,
                    }
                }
            ]).exec();

            const leaveUserIds = leaveUsers ? leaveUsers.map(user => user?.user_id?.toString()) : [];
            excludedUserIds.push(...leaveUserIds);

            const weekOffUsers = await this.userModel.find({
                org_id: orgId,
                weekly_off: Like(dayOfWeek),
                _id: userIdField,
                is_delete: 0,
                login_type_id: 4,
            }, userProjection).lean();
            const weekOffUserIds = weekOffUsers.map(user => user._id.toString());
            excludedUserIds.push(...weekOffUserIds);

            const allUsers = await this.userModel.find({
                org_id: orgId,
                is_delete: 0,
                login_type_id: 4,
                _id: userIdField,
            }, userProjection).lean();

            const holiday = await this.holidayModel.findOne({
                org_id: orgId,
                holiday_date: { $gte: start, $lte: end },
                holiday_type: global.HOLIDAY_TYPE[0],
                is_delete: 0,
            }).lean();

            let holidayUserIds: string[] = [];
            let absentUserIds: string[] = [];

            if (!holiday) {
                const stateMap: Record<string, string[]> = {};
                for (const user of allUsers) {
                    if (!stateMap[user.state]) stateMap[user.state] = [];
                    stateMap[user.state].push(user._id.toString());
                }

                const regionalHolidays = await this.holidayModel.find({
                    org_id: orgId,
                    holiday_date: { $gte: start, $lte: end },
                    holiday_type: global.HOLIDAY_TYPE[1],
                    is_delete: 0,
                    regional_state: { $in: Object.keys(stateMap) },
                }).lean();

                const regionalStates: any = regionalHolidays.map(h => h.regional_state);

                for (const state of Object.keys(stateMap)) {
                    if (regionalStates.includes(state)) {
                        holidayUserIds.push(...stateMap[state]);
                    } else {
                        absentUserIds.push(...stateMap[state]);
                    }
                }
            } else {
                holidayUserIds = allUsers.map(user => user._id.toString());
            }

            const [holidayUsers, absentUsers] = await Promise.all([
                holidayUserIds.length
                    ? this.userModel.find({
                        org_id: orgId,
                        is_delete: 0,
                        login_type_id: 4,
                        _id: { $in: holidayUserIds, ...userIdField },
                    }, userProjection).lean()
                    : [],
                absentUserIds.length
                    ? this.userModel.find({
                        org_id: orgId,
                        is_delete: 0,
                        login_type_id: 4,
                        _id: { $in: absentUserIds, ...userIdField },
                    }, userProjection).lean()
                    : [],
            ]);

            const docUserIds = [
                ...holidayUsers.map(u => u._id.toString()),
                ...absentUsers.map(u => u._id.toString())
            ];

            const userDocs = await this.userDocsModel.find({
                org_id: orgId,
                row_id: { $in: docUserIds.map(toObjectId) },
                is_delete: 0,
            }).lean();

            const docsMap = new Map<string, any[]>();
            for (const doc of userDocs) {
                const userId = doc.row_id.toString();
                if (!docsMap.has(userId)) {
                    docsMap.set(userId, []);
                }
                docsMap.get(userId)!.push(doc);
            }

            holidayUsers.forEach(user => {
                user.profile_docs = docsMap.get(user._id.toString()) || [];
            });
            absentUsers.forEach(user => {
                user.profile_docs = docsMap.get(user._id.toString()) || [];
            });


            const counters = {
                totalUsers: allUsers.length + excludedUserIds.length,
                totalPunched: punchedUsers.length,
                totalLeave: leaveUsers.length,
                totalWeekOff: weekOffUsers.length,
                totalAbsent: absentUsers.length,
                totalHoliday: holidayUsers.length,
            };

            const finalData = {
                punchedUsers,
                leaveUsers,
                weekOffUsers,
                absentUsers,
                holidayUsers,
                counters,
            };

            return this.res.success('SUCCESS.FETCH', finalData);
        } catch (error) {
            return this.res.error(HttpStatus.BAD_REQUEST, 'ERROR.BAD_REQ', error);
        }
    }

    async detail(req: Request, params: any): Promise<any> {
        try {
            const orgId = req['user']['org_id'];
            let attendancedetail: Record<string, any>, userId: Types.ObjectId, userData: Record<string, any>[];

            if (params?.user_id && params?.attend_date) {
                const { start, end } = convertToUtcRange(params.attend_date);
                params.attendanceMatch = {
                    org_id: orgId,
                    user_id: toObjectId(params.user_id),
                    attend_date: { $gte: start, $lte: end },
                    is_delete: 0,
                };
                attendancedetail = await this.attendanceData(req, params);
            } else if (params.attendance_id) {
                params.attendanceMatch = {
                    org_id: orgId,
                    _id: params.attendance_id,
                    is_delete: 0,
                };
                attendancedetail = await this.attendanceData(req, params);
            }

            if (!attendancedetail) {
                return this.res.error(HttpStatus.NOT_FOUND, 'Attendance data not found');
            }


            userId = attendancedetail?.user_id;
            params.user_id = userId;
            params.attend_date = attendancedetail?.attend_date;
            params.userMatch = { org_id: orgId, _id: userId, is_delete: 0 };

            const { start, end } = convertToUtcRange(params?.attend_date);

            const match: Record<string, any> = {
                user_id: userId,
                attend_date: { $gte: start, $lte: end },
                activity_type: { $ne: TimelineEventType.PUNCH_OUT },
                accuracy: { $lte: 20 },
            };

            const projection: Record<string, any> = {
                created_at: 1,
                created_name: 1,
                timestamp: 1,
                activity_type: 1,
                attend_date: 1,
                latitude: 1,
                longitude: 1,
                speed: 1,
                odometer: 1,
                battery_level: 1,
            };

            const lastLocationPromise = this.validBackgroundLocationModel.findOne(match, projection).sort({ attend_date: -1 }).limit(1).lean();

            const [userDataResult, lastLocationRaw] = await Promise.all([
                this.userData(req, params),
                lastLocationPromise
            ]);

            userData = userDataResult;

            let last_location = null;
            if (lastLocationRaw?.latitude && lastLocationRaw?.longitude) {
                const location = await this.locationService.open_street(lastLocationRaw.latitude, lastLocationRaw.longitude);
                last_location = { ...lastLocationRaw, location };
            }
            attendancedetail.last_location_lat = last_location?.latitude || null
            attendancedetail.last_location_lng = last_location?.longitude || null
            attendancedetail.last_location = last_location?.location || null
            attendancedetail.last_attend_date = last_location?.attend_date || null
            attendancedetail.total_hours = attendancedetail.total_hours


            return this.res.success('SUCCESS.FETCH', {
                attendancedetail,
                userData
            });

        } catch (error) {
            return this.res.error(HttpStatus.BAD_REQUEST, 'ERROR.BAD_REQ', error);
        }
    }
    async attendanceData(req: Request, params: any): Promise<any> {
        try {
            const projection: Record<string, any> =
            {
                attend_date: 1,
                punch_in: 1,
                punch_out: 1,
                start_lat: 1,
                start_lng: 1,
                stop_lat: 1,
                stop_lng: 1,
                start_address: 1,
                stop_address: 1,
                user_id: 1,
                created_name: 1,
                form_data: 1,
                total_hours: 1
            }
            let data: Record<string, any> = await this.attendanceModel.findOne
                (
                    params.attendanceMatch,
                    projection
                ).lean();
            data.files = await this.getDocument(data._id, global.THUMBNAIL_IMAGE)
            return data;
        } catch (error) {
            return null
        }
    }
    async userData(req: Request, params: any): Promise<any> {
        try {
            const projection: Record<string, any> =
            {
                name: 1,
                mobile: 1,
                designation: 1,
                email: 1,
                profile_pic: 1,
                user_code: 1,
                device_info: 1,
                reporting_manager_name: 1,
                form_data: 1,
            }
            let data: Record<string, any> = await this.userModel.findOne
                (
                    params.userMatch,
                    projection
                ).lean();
            if (data._id) data.files = await this.sharedUserService.getDocument(data._id, global.THUMBNAIL_IMAGE)
            return data;
        } catch (error) {
            return null
        }
    }
    async batteryGraph(req: any, params: any): Promise<any> {
        try {
            const { start, end } = convertToUtcRange(params.attend_date);
            const match = {
                user_id: toObjectId(params.user_id),
                attend_date: {
                    $gte: start,
                    $lte: end,
                },
                battery_level: { $ne: null }

            };

            const aggregationPipeline: any[] = [
                { $match: match },
                {
                    $project: {
                        attend_date: 1,
                        battery_level: 1,
                    }
                },
                {
                    $group: {
                        _id: "$battery_level",
                        first_attend_date: { $first: "$attend_date" },
                    }
                },
                {
                    $sort: { first_attend_date: 1 }
                },
                {
                    $project: {
                        battery_level: "$_id",
                        attend_date: "$first_attend_date",
                        _id: 0,
                    }
                }
            ];

            const result = await this.validBackgroundLocationModel.aggregate(aggregationPipeline);

            result.forEach((row) => {
                row.time = dayjs(row.attend_date).format('HH:mm:ss');
            });
            return this.res.success('SUCCESS.FETCH', result);
        } catch (error) {
            return this.res.error(HttpStatus.BAD_REQUEST, 'ERROR.BAD_REQ', error);
        }
    }
    async singleUserMonthData(req: Request, params: any): Promise<any> {
        try {
            params.internalCall = true;
            const result: Record<string, any> = await this.monthRead(req, params)
            return this.res.success('SUCCESS.FETCH', result[0]);
        } catch (error) {
            return this.res.error(HttpStatus.BAD_REQUEST, 'ERROR.BAD_REQ', error);
        }
    }
    async monthRead(req: Request, params: any): Promise<any> {
        try {
            const orgId = req['user']['org_id'];
            const page = params?.page || global.PAGE;
            const limit = params?.limit || global.LIMIT;
            const skip = (page - 1) * limit;

            params.attendanceMatch = {
                org_id: orgId,
                _id: params.attendance_id,
                is_delete: 0,
            };

            if (req?.url.includes(AttendanceRoutes.SINGLE_MONTH_READ)) {
                if (!params.filters) params.filters = {};
                params.filters.month = Number(splitDate(params.attend_date).month);
                params.filters.year = splitDate(params.attend_date).year;
            }

            const dateRange = getAllDatesInMonthIST(params);
            const { startDates, dateMap } = dateRange.reduce((acc, d) => {
                const { startDate, startDayName } = d;
                const { start, end } = convertToUtcRange(startDate);
                acc.startDates.push({ start, end, startDayName, key: startDate });
                acc.dateMap[startDate] = {
                    ...d,
                    punched: false,
                    leave: false,
                    weekOff: false,
                    holiday: false,
                    regionalHoliday: false,
                    absent: true,
                };
                return acc;
            }, { startDates: [], dateMap: {} });



            const userMatch: Record<string, any> = {
                org_id: orgId,
                is_delete: 0,
                login_type_id: global.LOGIN_TYPE_ID['FIELD_USER'],
            };

            if (global.LOGIN_TYPE_ID_PERMISSION?.includes(req['user']['login_type_id'])) {
                const userIds = await this.sharedUserService.getUsersIds(req, params);
                userMatch.$or = [
                    { _id: { $in: userIds } },
                    { created_id: { $in: userIds } }
                ];
            }
            if (params?.user_id) userMatch._id = params.user_id;
            if (params?.name) userMatch.name = Like(params?.name);
            if (params?.filters?.user_name) userMatch.name = Like(params.filters.user_name);

            const [count, allUsers] = await Promise.all([
                this.userModel.countDocuments(userMatch).exec(),
                this.userModel.find(userMatch).skip(skip).limit(limit).exec(),
            ]);

            const userIds = allUsers.map(u => u._id);
            const userStates = allUsers.map(u => u.state);

            const attendanceData = await this.attendanceModel.find({
                org_id: orgId,
                is_delete: 0,
                user_id: { $in: userIds },
                attend_date: { $gte: startDates[0].start, $lte: startDates[startDates.length - 1].end }
            }).exec();

            const leaveData = await this.leaveModel.find({
                org_id: orgId,
                is_delete: 0,
                user_id: { $in: userIds },
                leave_start: { $lte: startDates[startDates.length - 1].end },
                leave_end: { $gte: startDates[0].start },
            }).exec();

            const holidayData = await this.holidayModel.find({
                org_id: orgId,
                is_delete: 0,
                holiday_date: { $gte: startDates[0].start, $lte: startDates[startDates.length - 1].end },
            }).exec();

            let totalWoringDays = getMonthDaysInfo(params.filters.year || currentYear(), params.filters.month || currentMonthNumber());
            totalWoringDays = totalWoringDays


            const results = allUsers.map(user => {
                const data = JSON.parse(JSON.stringify(dateMap));
                let totalPresentDays = 0, totalLeaveDays = 0, totalWeekOffDays = 0, totalHolidayDays = 0, totalAbsentDays = 0;

                for (const { start, end, startDayName, key } of startDates) {

                    const val = data[key];
                    const userAttendance = attendanceData.find(a =>
                        a.user_id.toString() === user._id.toString()
                        && a.attend_date >= start && a.attend_date <= end
                    );

                    const userLeave = leaveData.find(l =>
                        l.user_id.toString() === user._id.toString() &&
                        new Date(l.leave_end) >= start && new Date(l.leave_start) <= end
                    );
                    const userHoliday = holidayData.find((h: any) =>
                        h.holiday_date >= start && h.holiday_date <= end &&
                        (h.holiday_type === global.HOLIDAY_TYPE[0] || (h.holiday_type === global.HOLIDAY_TYPE[1]
                            && userStates.includes(h.regional_state)))
                    );

                    if (userAttendance) {
                        val.punched = true;
                        val.attendance_id = userAttendance._id;
                        val.absent = false;
                        totalPresentDays++;
                    } else if (userLeave) {
                        val.leave = true;
                        val.absent = false;
                        totalLeaveDays++;
                    } else if (user.weekly_off?.toLowerCase() === startDayName?.toLowerCase()) {
                        val.weekOff = true;
                        val.absent = false;
                        totalWeekOffDays++;
                    } else if (userHoliday) {
                        val.holiday = true;
                        val.absent = false;
                        totalHolidayDays++;
                    } else {
                        val.absent = true;
                        totalAbsentDays++;
                    }
                }


                return {
                    userId: user._id,
                    userName: user.name,
                    attendanceData: Object.values(data),
                    totalWoringDays,
                    totalPresentDays,
                    totalLeaveDays,
                    totalWeekOffDays,
                    totalHolidayDays,
                    totalAbsentDays,
                };
            });

            if (params?.internalCall) return results;
            return this.res.pagination(results, count, page, limit);
        } catch (error) {
            if (params?.internalCall) throw error;
            return this.res.error(HttpStatus.BAD_REQUEST, 'ERROR.BAD_REQ', error);
        }
    }
    async getRoute(req: any, params: any): Promise<any> {
        try {

            const { start, end } = convertToUtcRange(params.attend_date);
            const match: Record<string, any> = {
                user_id: toObjectId(params.user_id),
                attend_date: {
                    $gte: start,
                    $lte: end
                },
                activity_type: { $exists: true }
            }
            if (req?.url.includes(global.MODULE_ROUTES[5])) match.accuracy = { $lte: 20 }

            const projection: Record<string, any> = {
                created_at: 1,
                created_name: 1,
                timestamp: 1,
                activity_type: 1,
                attend_date: 1,
                latitude: 1,
                longitude: 1,
                speed: 1,
                odometer: 1,
                battery_level: 1,
                location: 1
            }

            let data: any = await this.validBackgroundLocationModel.find(match, projection).sort({ attend_date: 1 }).lean();
            const uniqueDataMap = new Map();

            for (const item of data) {
                const key = `${item.latitude}_${item.longitude}`;
                if (!uniqueDataMap.has(key)) {
                    uniqueDataMap.set(key, item);
                }
            }

            data = Array.from(uniqueDataMap.values());

            for (let row of data) {
                row.created_at = toIST(row.created_at)
                row.timestamp = toIST(row.timestamp)
                row.attend_date = toIST(row.attend_date)
                row.odometer = row.odometer / 1000
            }
            if ((req?.url.includes(global.MODULE_ROUTES[6]) && !req?.url.includes(global.MODULE_ROUTES[7])) || req?.url.includes(global.MODULE_ROUTES[8])) return data;
            if (req?.url.includes(global.MODULE_ROUTES[5])) return this.res.success('SUCCESS.FETCH', data);
            data = await this.csvService.generateCsv(req, { filename: `${data?.[0]?.created_name}.csv`, data })
            return this.res.success('SUCCESS.FETCH', data);
        } catch (error) {
            return this.res.error(HttpStatus.BAD_REQUEST, 'Error uploading files to S3', error);
        }
    }
    async generateTimeline(req: Request, params: any, records: any[]): Promise<any> {
        const getType = (activity: string): TimelineEvent['type'] => {
            if (['on_foot', 'walking', 'running'].includes(activity)) return 'Walking';
            if (['in_vehicle', 'on_bicycle'].includes(activity)) return 'Travel';
            if (['check_in'].includes(activity)) return 'Check In';
            if (['Punch In'].includes(activity)) return 'Punch In';
            if (['Punch Out'].includes(activity)) return 'Punch Out';
            return 'Halt';
        };

        let events: any[] = [];
        let current: any = null;

        for (let i = 0; i < records.length; i++) {
            const row = records[i];
            const type = getType(row.activity_type);
            const time = dayjs(row.attend_date).format('HH:mm:ss');
            if (isNaN(row.odometer)) row.odometer = 0;

            if (!current) {
                current = {
                    type,
                    from: time,
                    to: time,
                    start: row.attend_date,
                    end: row.attend_date,
                    tat: tat(row.attend_date, row.attend_date),
                    startLat: row.latitude,
                    startLng: row.longitude,
                    endLat: row.latitude,
                    endLng: row.longitude,
                    km: Number(row.odometer?.toFixed(2) || 0),
                    location: row.location || undefined
                };
                continue;
            }

            const gapInMinutes = dayjs(row.attend_date).diff(dayjs(current.end), 'minute');

            if (current.type === type && gapInMinutes <= 15) {

                current.to = time;
                current.end = row.attend_date;
                current.endLat = row.latitude;
                current.endLng = row.longitude;
                current.tat = tat(current.start, current.end);
                current.km = Number(row.odometer?.toFixed(2) || 0);
                current.location = row.location || undefined
            } else {

                events.push(current);

                // If gap > 15, Insert a HALT
                // if (gapInMinutes > 15) {
                //     events.push({
                //         type: 'Halt',
                //         from: dayjs(current.end).format('HH:mm:ss'),
                //         to: dayjs(row.attend_date).format('HH:mm:ss'),
                //         start: current.end,
                //         end: row.attend_date,
                //         tat: tat(current.end, row.attend_date),
                //         startLat: current.endLat,
                //         startLng: current.endLng,
                //         endLat: row.latitude,
                //         endLng: row.longitude,
                //         km: 0,
                //         location: row.location || undefined

                //     });
                // }

                current = {
                    type,
                    from: time,
                    to: time,
                    start: row.attend_date,
                    end: row.attend_date,
                    tat: tat(row.attend_date, row.attend_date),
                    startLat: row.latitude,
                    startLng: row.longitude,
                    endLat: row.latitude,
                    endLng: row.longitude,
                    km: Number(row.odometer?.toFixed(2) || 0),
                    location: row.location || undefined

                };
            }

        }

        if (current) events.push(current);
        events = await this.removeShortTatAndMerge(req, params, events);
        return events;
    }
    async removeShortTatAndMerge(req: Request, params: any, events: any[]): Promise<any> {
        const mergedEvents: any[] = [];
        const tatSumByType: Record<string, number> = {};
        let current: any = null;
        let punchOutEvent: any = null;
        let lastNonZeroKm: number | null = null;
        let totalDiffKm = 0;
        let walkingDiffKm = 0;
        let travelDiffKm = 0;
        const { start, end } = convertToUtcRange(params.attend_date);

        for (const event of events) {
            const eventTypeKey = event.type.toLowerCase().replace(/\s+/g, '_');
            event.tatMin = getTimeDifferenceInMinutes(event.from, event.to);

            if (event.type === TimelineEventType.PUNCH_OUT) {
                punchOutEvent = event;
                continue;
            }

            if (event.type === TimelineEventType.PUNCH_IN) {
                event.diff_km = 0;
                mergedEvents.push(event);
                continue;
            }

            if (event.type !== TimelineEventType.TRAVEL && event.type !== TimelineEventType.WALKING) {
                event.location = await this.locationService.open_street(event.startLat, event.startLng);
            }



            if (event.tatMin < 5) continue;

            if (current && current.type === event.type) {
                current.to = event.to;
                current.end = event.end;
                current.km = event.km;
                current.tatMin = getTimeDifferenceInMinutes(current.from, current.to);
            } else {
                if (current) {
                    current.diff_km = ["Travel", "Walking"].includes(current.type)
                        ? lastNonZeroKm !== null && typeof current.km === "number"
                            ? Number(Math.max(current.km - lastNonZeroKm, 0).toFixed(2))
                            : Number((current.km || 0).toFixed(2))
                        : 0;

                    // Track diff_km totals
                    totalDiffKm += current.diff_km;
                    if (current.type === TimelineEventType.TRAVEL) {
                        travelDiffKm += current.diff_km;
                    } else if (current.type === TimelineEventType.WALKING) {
                        walkingDiffKm += current.diff_km;
                    }

                    if (current.km > 0) lastNonZeroKm = current.km;

                    mergedEvents.push(current);
                }

                current = { ...event };
            }

            tatSumByType[eventTypeKey] = (tatSumByType[eventTypeKey] || 0) + event.tatMin;
        }

        if (current) {
            current.diff_km = ["Travel", "Walking"].includes(current.type)
                ? lastNonZeroKm !== null && typeof current.km === "number"
                    ? Number(Math.max(current.km - lastNonZeroKm, 0).toFixed(2))
                    : Number((current.km || 0).toFixed(2))
                : 0;

            totalDiffKm += current.diff_km;
            if (current.type === TimelineEventType.TRAVEL) {
                travelDiffKm += current.diff_km;
            } else if (current.type === TimelineEventType.WALKING) {
                walkingDiffKm += current.diff_km;
            }

            if (current.km > 0) lastNonZeroKm = current.km;

            mergedEvents.push(current);
        }

        if (punchOutEvent) {
            punchOutEvent.diff_km = 0;
            mergedEvents.push(punchOutEvent);
        }

        if (mergedEvents.length > 1) {
            const first = mergedEvents[0];
            const last = mergedEvents[mergedEvents.length - 1];
            tatSumByType.total_min = getTimeDifferenceInMinutes(first.from, last.to);

            const sumOfEvent = (tatSumByType['walking'] || 0) + (tatSumByType['travel'] || 0) + (tatSumByType['check_in'] || 0);
            // tatSumByType['halt'] = tatSumByType.total_min - sumOfEvent;

            const checkinData = await this.sharedActivityService.checkinData(req, {
                start, end, user_id: params.user_id
            });
            tatSumByType['check_in'] = checkinData.avgMin;
            tatSumByType['check_in_count'] = checkinData.count;
        }

        // Add diff_km aggregates
        tatSumByType.total_diff_km = Number(totalDiffKm.toFixed(2));
        // tatSumByType.walking_diff_km = Number(walkingDiffKm.toFixed(2));
        tatSumByType.travel_diff_km = Number(travelDiffKm.toFixed(2));

        const filteredEvents = mergedEvents.filter(event => event.type !== 'Halt');

        return {
            events: filteredEvents,
            tatSumByType
        };
    }
    async timeline(req: any, params: any): Promise<any> {
        try {
            let data: any = await this.getRoute(req, params);
            const { start, end } = convertToUtcRange(params.attend_date);
            const timelineMatch: Record<string, any> = {
                user_id: toObjectId(params.user_id),
                date: { $gte: start, $lte: end },
            };
            const result: Record<string, any> = await this.timelineModel.findOne(timelineMatch);
            const routeLen: number = data.length;
            if (result?.data_size >= routeLen) {
                data = result.timeline;
            } else {
                data = await this.generateTimeline(req, params, data);
                if (result?._id) {
                    await this.timelineModel.updateOne({ _id: result._id }, { timeline: data, data_size: routeLen })
                } else {
                    if (data?.events?.length === 0) return this.res.success('SUCCESS.FETCH', data);
                    const saveObj: Record<string, any> = {
                        ...req['createObj'],
                        timeline: data,
                        data_size: routeLen,
                        date: params.attend_date,
                        user_id: toObjectId(params.user_id),
                        type: TimelineType.ATTENDANCE
                    }
                    const document = new this.timelineModel(saveObj);
                    document.save();
                }
            }
            data.events = data.events.filter(event => event.type !== 'Halt');
            delete data.tatSumByType.walking_diff_km;
            delete data.tatSumByType.halt;
            return this.res.success('SUCCESS.FETCH', data);
        } catch (error) {
            return this.res.error(HttpStatus.BAD_REQUEST, 'ERROR.BAD_REQ', error);
        }
    }
    async userMapView(req: any, params: any): Promise<any> {
        try {

            const { start, end } = convertToUtcRange(params.attend_date);

            let match: Record<string, any> = {
                org_id: req['user']['org_id'],
                is_delete: 0,
                login_type_id: global.LOGIN_TYPE_ID['FIELD_USER'],
            };

            const allUsers: any[] = await this.userModel.find(match).lean();
            const userIds = allUsers.map(u => u._id);

            const attendanceData = await this.attendanceModel.find({
                org_id: req['user']['org_id'],
                is_delete: 0,
                user_id: { $in: userIds },
                attend_date: { $gte: start, $lte: end }
            }).lean();

            const attendanceUserIds = attendanceData.map(a => a.user_id);

            match = {
                user_id: { $in: attendanceUserIds },
                attend_date: { $gte: start, $lte: end }
            };

            const projection = {
                created_at: 1,
                created_name: 1,
                timestamp: 1,
                activity_type: 1,
                attend_date: 1,
                latitude: 1,
                longitude: 1,
                speed: 1,
                odometer: 1,
                battery_level: 1,
            };

            let data: any = await this.validBackgroundLocationModel.aggregate([
                { $match: match },
                { $sort: { attend_date: -1 } },
                {
                    $group: {
                        _id: "$user_id",
                        latestEntry: { $first: "$$ROOT" },
                    }
                },
                { $replaceRoot: { newRoot: "$latestEntry" } },
                { $project: projection }
            ])

            data = await Promise.all(
                data.map(async (row: any) => {
                    const location = await this.locationService.open_street(row.latitude, row.longitude);
                    return { ...row, location };
                })
            );

            return this.res.success('SUCCESS.FETCH', data);
        } catch (error) {
            return this.res.error(HttpStatus.BAD_REQUEST, 'ERROR.BAD_REQ', error);
        }
    }
    async reset(req: Request, params: any): Promise<any> {
        try {
            let match: Record<string, any> = {
                org_id: req['user']['org_id'],
                is_delete: 0,
                _id: params.attendance_id
            }
            let data: Record<string, any> = await this.attendanceModel.findOne(match)
            if (!data) return this.res.error(HttpStatus.BAD_REQUEST, 'WARNING.DATA_NOT_FOUND');
            if (!data?.stop_lat && !data?.stop_lng && !data?.punch_out && !data?.stop_address) {
                return this.res.error(HttpStatus.BAD_REQUEST, 'ATTENDANCE.RESET_ERROR');
            }
            await this.attendanceModel.updateOne(
                {
                    _id: params.attendance_id
                },
                {
                    stop_lat: null,
                    stop_lng: null,
                    punch_out: null,
                    stop_address: null,
                }
            )

            return this.res.success('ATTENDANCE.RESET');
        } catch (error) {
            return this.res.error(HttpStatus.BAD_REQUEST, 'ERROR.BAD_REQ', error);
        }
    }
    async punchIn(req: Request, params: any): Promise<any> {
        try {
            params.user_id = toObjectId(params.user_id);
            let match: Record<string, any> = {
                org_id: req['user']['org_id'],
                is_delete: 0,
                user_id: params.user_id,
                attend_date: params.attend_date
            }

            let data: Record<string, any> = await this.userModel.findOne({
                org_id: req['user']['org_id'],
                is_delete: 0,
                _id: params.user_id
            })
            if (!data) return this.res.error(HttpStatus.BAD_REQUEST, 'ATTENDANCE.USER_NOT_EXIST');
            data = await this.attendanceModel.findOne(match)
            if (data) return this.res.error(HttpStatus.BAD_REQUEST, 'ATTENDANCE.EXIST');

            let saveObj: Record<string, any> = {
                ...req['createObj'],
                user_id: params.user_id,
                attend_date: params.attend_date,
                punch_in: params.punch_in
            }
            if (params?.punch_out) saveObj.punch_out = params.punch_out;
            const document = new this.attendanceModel(saveObj);
            await document.save();
            return this.res.success('ATTENDANCE.PUNCH');
        } catch (error) {
            return this.res.error(HttpStatus.BAD_REQUEST, 'ERROR.BAD_REQ', error);
        }
    }
    async absent(req: Request, params: any): Promise<any> {
        try {

            let match: Record<string, any> = {
                org_id: req['user']['org_id'],
                is_delete: 0,
                _id: params.attendance_id,
            }

            let data: Record<string, any>;
            data = await this.attendanceModel.findOne(match)
            if (!data) return this.res.error(HttpStatus.NOT_FOUND, 'WARNING.DATA_NOT_FOUND');

            const updateObj: Record<string, any> = {
                ...req['createObj'],
                is_delete: 1
            }

            await this.attendanceModel.updateOne(match, updateObj)
            return this.res.success('ATTENDANCE.ABSENT');
        } catch (error) {
            return this.res.error(HttpStatus.BAD_REQUEST, 'ERROR.BAD_REQ', error);
        }
    }
    async getDocument(
        id: any,
        type: typeof global.FULL_IMAGE | typeof global.THUMBNAIL_IMAGE | typeof global.BIG_THUMBNAIL_IMAGE = global.FULL_IMAGE
    ): Promise<any> {
        return this.s3Service.getDocumentsByRowId(this.attendanceDocsModel, id, type);
    }
    async getDocumentByDocsId(req: any, params: any): Promise<any> {
        const doc = await this.s3Service.getDocumentsById(this.attendanceDocsModel, params._id);
        return this.res.success('SUCCESS.FETCH', doc);
    }
    async upload(files: Express.Multer.File[], req: any, params: any): Promise<any> {
        try {

            req.body.module_name = Object.keys(global.MODULES).find(
                key => global.MODULES[key] === global.MODULES['Attendance']
            );

            let response = await this.s3Service.uploadMultiple(files, req, this.attendanceDocsModel);
            return this.res.success('SUCCESS.CREATE', response);
        } catch (error) {
            return this.res.error(HttpStatus.BAD_REQUEST, 'Error uploading files to S3', error);
        }
    }
    async userCurrentLocation(req: any, params: any): Promise<any> {
        try {
            const { start, end } = convertToUtcRange(new Date());
            const match: Record<string, any> = {
                user_id: req['user']['_id'],
                attend_date: { $gte: start, $lte: end },
            };
            const data: Record<string, any> = await this.validBackgroundLocationModel.findOne(match).sort({ _id: -1 })
            return data;
        } catch (error) {
            throw error
        }
    }

}
