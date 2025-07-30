import { Injectable, HttpStatus } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { ResponseService } from 'src/services/response.service';
import { LocationService } from 'src/services/location.service';
import { AttendanceModel } from '../models/attendance.model';
import { BackgroundLocationModel } from '../models/backgroud-location.model.ts';
import { InvalidBackgroundLocationModel } from '../models/invalid-backgroud-location.model';
import { ValidBackgroundLocationModel } from '../models/valid-background-location.model';
import { convertToUtcRange, tat } from 'src/common/utils/common.utils';
import { AttendanceService } from '../web/attendance.service';
import { TimelineEventType } from '../web/attendance.service';
import { WorkingActivityType } from 'src/modules/master/user/models/user-working-activity.model';
import { SharedUserService } from 'src/modules/master/user/shared-user.service';
import { DB_NAMES } from 'src/config/db.constant';
import { LeaveModel } from '../../leave/models/leave.model';
import { HolidayModel } from 'src/modules/master/holiday/models/holiday.model';
@Injectable()
export class AppAttendanceService {
    constructor(
        @InjectModel(AttendanceModel.name) private attendanceModel: Model<AttendanceModel>,
        @InjectModel(BackgroundLocationModel.name, DB_NAMES().SUPPORT_DB) private backgroundLocationModel: Model<BackgroundLocationModel>,
        @InjectModel(InvalidBackgroundLocationModel.name, DB_NAMES().SUPPORT_DB) private invalidBackgroundLocationModel: Model<InvalidBackgroundLocationModel>,
        @InjectModel(ValidBackgroundLocationModel.name, DB_NAMES().SUPPORT_DB) private validBackgroundLocationModel: Model<ValidBackgroundLocationModel>,
        @InjectModel(LeaveModel.name) private leaveModel: Model<LeaveModel>,
        @InjectModel(HolidayModel.name) private holidayModel: Model<HolidayModel>,
        private readonly locationService: LocationService,
        private readonly attendanceService: AttendanceService,
        private readonly sharedUserService: SharedUserService,
        private readonly res: ResponseService,
    ) { }

    async punchIn(req: Request, params: any): Promise<any> {
        try {
            params.user_id = req['user']['_id']
            const exist = await this.attendanceExist(req, params);
            if (exist) return this.res.error(HttpStatus.BAD_REQUEST, 'ATTENDANCE.ALREADY_PUNCH_IN');
            const nowUtc = new Date() //.toISOString();
            params.attend_date = nowUtc;
            params.punch_in = nowUtc;

            const saveObj = {
                ...req['createObj'],
                ...params,
            };
            const document = new this.attendanceModel(saveObj);
            const insert: Record<string, any> = await document.save();
            if (!insert._id) return this.res.error(HttpStatus.BAD_REQUEST, 'ATTENDANCE.PUNCH_IN_ERROR');

            setImmediate(async () => {
                const start_address = await this.locationService.open_street(params.start_lat, params.start_lng);
                await this.attendanceModel.updateOne({ _id: insert._id }, { start_address });
            });

            const background = {
                ...req['createObj'],
                user_id: params.user_id,
                attend_date: nowUtc,
                timestamp: new Date().getTime(),
                event: TimelineEventType.PUNCH_IN,
                latitude: params.start_lat,
                longitude: params.start_lng,
                _id: insert._id,
                working_activity_type: WorkingActivityType.PUNCH_IN
            };
            this.createBackgroundLocally(req, background);

            return this.res.success('ATTENDANCE.PUNCH_IN', { inserted_id: insert?._id });
        } catch (error) {
            return this.res.error(HttpStatus.BAD_REQUEST, 'ERROR.BAD_REQ', error);
        }
    }
    async punchOut(req: Request, params: any): Promise<any> {
        try {
            params.user_id = req['user']['_id'];
            const exist: Record<string, any> = await this.attendanceModel.findOne({ _id: params._id })
            if (!exist) return this.res.error(HttpStatus.NOT_FOUND, 'ATTENDANCE.ALREADY_PUNCH_OUT');
            if (exist?.['punch_out']) return this.res.error(HttpStatus.BAD_REQUEST, 'ATTENDANCE.ALREADY_PUNCH_OUT');
            params.punch_out = new Date() //.toISOString();
            params.total_hours = tat(exist.punch_in, params.punch_out);
            params.form_data = { ...exist.form_data, ...params.form_data };
            const updateObj = { ...req['updateObj'], ...params };
            const update: Record<string, any> = await this.attendanceModel.updateOne({ _id: params._id }, updateObj);
            if (!update) return this.res.error(HttpStatus.BAD_REQUEST, 'ATTENDANCE.PUNCH_OUT_ERROR');

            setImmediate(async () => {
                const stop_address = await this.locationService.open_street(params.stop_lat, params.stop_lng);
                await this.attendanceModel.updateOne({ _id: params._id }, { stop_address });
            });

            const background = {
                ...req['createObj'],
                user_id: exist.user_id,
                attend_date: exist.attend_date,
                timestamp: new Date().getTime(),
                event: TimelineEventType.PUNCH_OUT,
                latitude: params.stop_lat,
                longitude: params.stop_lng,
                _id: params._id,
                working_activity_type: WorkingActivityType.PUNCH_OUT
            };
            this.createBackgroundLocally(req, background);
            return this.res.success('ATTENDANCE.PUNCH_OUT');
        } catch (error) {
            return this.res.error(HttpStatus.BAD_REQUEST, 'ERROR.BAD_REQ', error);
        }
    }
    async detail(req: Request, params: any): Promise<any> {
        try {
            const userId: string = req['user']['_id'];
            const weekly_off: string = req['user']['weekly_off'];
            const attendDate = new Date(params.attend_date || new Date());
            const { start, end } = convertToUtcRange(params.attend_date || new Date);

            const match = {
                user_id: userId,
                attend_date: { $gte: start, $lte: end },
                is_delete: 0,
            };

            const attendanceRecord = await this.attendanceModel.findOne(match).lean();
            
            if (!attendanceRecord) {
                const leave = await this.leaveModel.findOne({
                    user_id: userId,
                    is_delete: 0,
                    status: 'Approved',
                    leave_start: { $lte: attendDate },
                    leave_end: { $gte: attendDate }
                }).lean();

                if (leave) {
                    return this.res.success('SUCCESS.FETCH', {
                        type: 'leave',
                        leave: leave
                    });
                }

                const holiday = await this.holidayModel.findOne({
                    is_delete: 0,
                    holiday_date: {
                        $gte: new Date(attendDate.setHours(0, 0, 0, 0)),
                        $lte: new Date(attendDate.setHours(23, 59, 59, 999))
                    }
                }).lean();

                if (holiday) {
                    return this.res.success('SUCCESS.FETCH', {
                        type: 'holiday',
                        holiday: holiday
                    });
                }

                const dayName = attendDate.toLocaleDateString('en-US', { weekday: 'long', timeZone: 'Asia/Kolkata' });
                if (dayName.toLowerCase() === weekly_off.toLowerCase()) {
                    return this.res.success('SUCCESS.FETCH', {
                        type: 'weekoff',
                        day: dayName
                    });
                }
            } else {

                const attendanceId = attendanceRecord._id;

                const [routes, docs, batteryGraph] = await Promise.all([
                    this.attendanceService.getRoute(req, match),
                    this.attendanceService.getDocument(attendanceId, global.THUMBNAIL_IMAGE),
                    this.attendanceService.batteryGraph(req, match),
                ]);

                return this.res.success('SUCCESS.FETCH', {
                    ...attendanceRecord,
                    routes: routes || [],
                    docs: docs || [],
                    batteryGraph,
                    type: "present"
                });
            }
            if (!attendanceRecord) return this.res.success('SUCCESS.FETCH', { type: "absent", data: null });
        } catch (error) {
            return this.res.error(HttpStatus.BAD_REQUEST, 'ERROR.BAD_REQ', error);
        }
    }
    async createBackgroundLocally(req: Request, params: any): Promise<any> {
        try {
            const saveObj = {
                ...req['createObj'],
                user_id: req['user']['_id'],
                attend_date: new Date(),
                timestamp: params.timestamp,
                event: params.event || TimelineEventType.LOCALLY,
                activity_type: params.event || TimelineEventType.LOCALLY,
                latitude: params.latitude,
                longitude: params.longitude,
            };

            const document = new this.validBackgroundLocationModel(saveObj);
            const insert = await document.save();
            if (insert?._id) {
                setImmediate(async () => {
                    const location = await this.locationService.open_street(params.latitude, params.longitude);
                    await this.validBackgroundLocationModel.updateOne({ _id: insert._id }, { location });
                    if (
                        params.working_activity_type === WorkingActivityType.PUNCH_IN
                        ||
                        params.working_activity_type === WorkingActivityType.PUNCH_OUT
                    ) {
                        const data = {
                            working_activity_type: params.working_activity_type,
                            working_activity_id: params._id,
                            display_name: location
                        }
                        await this.sharedUserService.saveUserWorkingActivity(req, data);
                    }
                });
            }
            return true
        } catch (error) {
            throw error
        }
    }
    async createRawBackground(req: Request, params: any): Promise<any> {
        try {
            if (!Array.isArray(params.location)) throw new Error('params.location must be an array');
            const createdDocuments = [];
            for (const data of params.location) {
                const saveObj = {
                    ...req['createObj'],
                    user_id: req['user']['_id'],
                    attend_date: new Date(),
                    timestamp: typeof data.timestamp === 'number'
                        ? data.timestamp
                        : new Date(data.timestamp).getTime(),
                    event: data.event || TimelineEventType.MOTION_CHANGE,
                    latitude: data.coords?.latitude || null,
                    longitude: data.coords?.longitude || null,
                    accuracy: data.coords?.accuracy || null,
                    speed: data.coords?.speed || null,
                    heading: data.coords?.heading || null,
                    altitude: data.coords?.altitude || null,
                    altitude_accuracy: data.coords?.altitude_accuracy || null,
                    heading_accuracy: data.coords?.heading_accuracy || null,
                    speed_accuracy: data.coords?.speed_accuracy || null,
                    is_moving: data.is_moving || false,
                    battery_level: data.battery?.level || null,
                    battery_is_charging: data.battery?.is_charging || false,
                    activity_type: data.activity?.type || null,
                    activity_confidence: data.activity?.confidence || null,
                    uuid: data.uuid || null,
                    odometer: data.odometer || null,
                    mock: data.mock || null,
                };

                const document = new this.backgroundLocationModel(saveObj);
                const insert = await document.save();
                createdDocuments.push(document);
            }
            return this.res.success('SUCCESS.CREATE_BACKGROUND', createdDocuments);
        } catch (error) {
            return this.res.error(HttpStatus.BAD_REQUEST, 'ERROR.BAD_REQ', error.message);
        }
    }
    async createBackground(req: Request, params: any): Promise<any> {
        try {
            if (params?.location?.length > 0) {

                await this.createRawBackground(req, params);
                const validDocuments = [];
                const invalidEntries = [];

                const GPS_ACCURACY_THRESHOLD = 50;
                const MIN_SPEED = 0.1;
                const SPEED_ACCURACY_THRESHOLD = 10;
                const MIN_TIME_DIFF = 60 * 1000; // 1 minute
                const BATTERY_DRAIN_THRESHOLD = 0.1;
                const MAX_JUMP_DISTANCE = 1000;
                const MAX_UNREALISTIC_SPEED = 150;
                const EXPECTED_ACTIVITY_TYPES = ['on_foot', 'walking', 'running', 'still', 'in_vehicle', 'on_bicycle', 'tilting'];
                const ALLOWED_LATITUDE_RANGE = [-90, 90];
                const ALLOWED_LONGITUDE_RANGE = [-180, 180];

                let lastTimestamp = 0;
                let previousLocation = null;
                let lastOdometer = 0;
                let lastBatteryLevel = null;
                let skipCondition: boolean = true;

                for (const data of params.location) {
                    try {
                        const coords = data.coords || {};
                        const battery = data.battery || {};
                        const activity = data.activity || {};

                        // if (
                        //     coords.latitude < ALLOWED_LATITUDE_RANGE[0] || coords.latitude > ALLOWED_LATITUDE_RANGE[1] ||
                        //     coords.longitude < ALLOWED_LONGITUDE_RANGE[0] || coords.longitude > ALLOWED_LONGITUDE_RANGE[1]
                        // ) {
                        //     throw new Error('Invalid latitude or longitude.');
                        // }

                        // const time = typeof data.timestamp === 'number' 
                        // ? data.timestamp 
                        // : new Date(data.timestamp).getTime()

                        // if (!skipCondition && lastTimestamp > 0 && (time - lastTimestamp) < MIN_TIME_DIFF) {
                        //     throw new Error('Timestamps are inconsistent.');
                        // }
                        // lastTimestamp = data.timestamp;

                        // if (!skipCondition && lastOdometer > 0 && data.odometer < lastOdometer) {
                        //     throw new Error('Odometer value is decreasing.');
                        // }

                        // if (coords.accuracy > GPS_ACCURACY_THRESHOLD) {
                        //     throw new Error('Low GPS accuracy.');
                        // }

                        // if (!skipCondition && previousLocation) {
                        //     const distance = this.locationService.getDistance(previousLocation.coords.latitude, previousLocation.coords.longitude, coords.latitude, coords.longitude);
                        //     const timeDiff = (data.timestamp - previousLocation.timestamp) / 1000;
                        //     const calculatedSpeed = distance / timeDiff;
                        //     if (calculatedSpeed > SPEED_ACCURACY_THRESHOLD) {
                        //         throw new Error('Unrealistic speed.');
                        //     }

                        //     const jumpDistance = this.locationService.getDistance(previousLocation.coords.latitude, previousLocation.coords.longitude, coords.latitude, coords.longitude);
                        //     if (jumpDistance > MAX_JUMP_DISTANCE) {
                        //         throw new Error('Location jump distance too large.');
                        //     }

                        //     const odometerIncrease = data.odometer - lastOdometer;
                        //     if (odometerIncrease > distance + 10) {
                        //         throw new Error('Odometer increase mismatch.');
                        //     }
                        // }

                        // lastOdometer = data.odometer;

                        // if (coords.heading < 0 || coords.heading > 360) {
                        //     throw new Error('Invalid heading.');
                        // }

                        // if (!EXPECTED_ACTIVITY_TYPES.includes(activity.type)) {
                        //     throw new Error('Invalid activity type.');
                        // }

                        // if (data.is_moving && (coords.speed <= 0 || coords.speed > MAX_UNREALISTIC_SPEED)) {
                        //     throw new Error('Unrealistic speed while moving.');
                        // }

                        // if (!data.is_moving && coords.speed > 0) {
                        //     throw new Error('Speed should be zero when not moving.');
                        // }

                        // if (lastBatteryLevel && (battery.level < lastBatteryLevel - BATTERY_DRAIN_THRESHOLD)) {
                        //     throw new Error('Battery dropped too quickly.');
                        // }
                        // lastBatteryLevel = battery.level;

                        if (data.mock) throw new Error('Fake entry');

                        const saveObj = {
                            ...req['createObj'],
                            user_id: req['user']['_id'],
                            attend_date: new Date(),
                            timestamp: typeof data.timestamp === 'number'
                                ? data.timestamp
                                : new Date(data.timestamp).getTime(),
                            event: data.event || TimelineEventType.MOTION_CHANGE,
                            latitude: coords.latitude || null,
                            longitude: coords.longitude || null,
                            accuracy: coords.accuracy || null,
                            speed: coords.speed || null,
                            heading: coords.heading || null,
                            altitude: coords.altitude || null,
                            altitude_accuracy: coords.altitude_accuracy || null,
                            heading_accuracy: coords.heading_accuracy || null,
                            speed_accuracy: coords.speed_accuracy || null,
                            is_moving: data.is_moving || false,
                            battery_level: battery.level || null,
                            battery_is_charging: battery.is_charging || false,
                            activity_type: activity.type || null,
                            activity_confidence: activity.confidence || null,
                            uuid: data.uuid || null,
                            odometer: data.odometer || null,
                            mock: data.mock || null,
                        };

                        validDocuments.push(saveObj);
                        previousLocation = data;

                    } catch (validationError) {
                        invalidEntries.push({
                            ...req['createObj'],
                            user_id: req['user']['_id'],
                            error_reason: validationError.message,
                            data,
                            created_at: new Date()
                        });
                    }
                }

                let insertedDocuments = [];
                if (validDocuments.length > 0) {
                    insertedDocuments = await this.validBackgroundLocationModel.insertMany(validDocuments);
                }

                if (invalidEntries.length > 0) {
                    await this.invalidBackgroundLocationModel.insertMany(invalidEntries);
                }

                return this.res.success('SUCCESS.CREATE_BACKGROUND', {
                    inserted: insertedDocuments.length,
                    skipped: invalidEntries.length,
                    documents: insertedDocuments,
                });
            }
        } catch (error) {
            return this.res.error(HttpStatus.BAD_REQUEST, 'ERROR.BAD_REQ', error);
        }
    }
    async getCheckinRoute(req: Request, params: any): Promise<any> {
        try {
            const { start, end } = convertToUtcRange(params.attend_date);

            let match: Record<string, any> = {
                is_delete: 0,
                user_id: req['user']['_id'],
                attend_date: {
                    $gte: start,
                    $lte: end,
                },
                activity_type: {
                    $in: [TimelineEventType.PUNCH_IN, TimelineEventType.PUNCH_OUT],
                },
            };
            let projection: Record<string, any> = {
                activity_type: 1,
                attend_date: 1,
                location: 1
            }

            let attendance: Record<string, any>[] = await this.validBackgroundLocationModel.find(match, projection).sort({ attend_date: -1 }).limit(2).lean();
            attendance = attendance.reverse();
            delete match.attend_date;
            match.activity_date = {
                $gte: start,
                $lte: end,
            };
            match.activity_type = {
                $in: [TimelineEventType.CHECK_IN, TimelineEventType.CHECK_OUT],
            };

            const activity: Record<string, any>[] = await this.validBackgroundLocationModel.find(match).sort({ activity_date: 1 }).lean();

            let combined: Record<string, any>[] = [];

            if (attendance.length > 0) {
                combined = [
                    attendance[0],
                    ...activity,
                    ...attendance.slice(1)
                ];
            } else {
                combined = activity;
            }

            if (req?.url?.includes(global.MODULE_ROUTES[17])) return combined;
            return this.res.success('SUCCESS', combined);
        } catch (error) {
            if (req?.url?.includes(global.MODULE_ROUTES[17])) throw error
            return this.res.error(HttpStatus.BAD_REQUEST, 'ERROR.BAD_REQ', error);
        }
    }
    async attendanceExist(req: Request, params: any): Promise<any> {
        try {
            const { start, end } = convertToUtcRange(new Date());
            const exist = await this.attendanceModel.findOne({
                user_id: req['user']['_id'],
                attend_date: {
                    $gte: start,
                    $lte: end
                },
                is_delete: 0
            }).lean();
            return exist
        } catch (error) {
            throw error
        }
    }

}
