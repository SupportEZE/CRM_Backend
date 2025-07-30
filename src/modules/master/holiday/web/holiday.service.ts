import { HttpStatus, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { HolidayModel } from '../models/holiday.model';
import mongoose, { Model, Types } from 'mongoose';
import { ResponseService } from 'src/services/response.service';
import { eMatch, toObjectId } from 'src/common/utils/common.utils';
import { DateTimeService } from 'src/services/date-time.service';
import { Like } from 'src/common/utils/common.utils';
@Injectable()
export class HolidayService {
    constructor(
        @InjectModel(HolidayModel.name) private holidayModel: Model<HolidayModel>,
        private readonly res: ResponseService,
        private readonly dateTimeService: DateTimeService,
    ) { }

    async create(req: any, params: any): Promise<any> {
        try {
            let match: any = { org_id: req.user.org_id, holiday_name: eMatch(params.holiday_name) };
            let exist: object;

            if (params.holiday_type === 'National') {
                match.holiday_date = params.holiday_date;
                exist = await this.holidayModel.findOne(match).exec();
                if (exist) return this.res.error(HttpStatus.BAD_REQUEST, 'WARNING.ALREADY_EXIST');
            } else {
                exist = await this.holidayModel.findOne(match).exec();
                if (exist) return this.res.error(HttpStatus.BAD_REQUEST, 'WARNING.ALREADY_EXIST');
            }
            const { year, month, dayName } = this.dateTimeService.getDateParts(new Date(params.holiday_date));
            params.year = year;
            params.month = month;
            params.day = dayName;
            const saveObj = {
                ...req['createObj'],
                ...params,
            };
            if (params.holiday_type === 'National') delete saveObj.regional_state
            const document = new this.holidayModel(saveObj);
            await document.save();
            return this.res.success('SUCCESS.CREATE');
        } catch (error) {
            return this.res.error(HttpStatus.BAD_REQUEST, 'ERROR.BAD_REQ', error);
        }
    }
    async read(req: any, params: any): Promise<any> {
        try {
            let filters: any = { org_id: req.user.org_id, is_delete: 0 };
            if (params?.filters?.holiday_name) filters.holiday_name = Like(params.filters.holiday_name)
            if (params?.filters?.month) filters.month = Like(params.filters.month)
            if (params?.filters?.year) filters.year = params.filters.year
            if (params?.filters?.regional_state) filters.regional_state = { $in: params.filters.regional_state }
            if (params?.filters?.holiday_date) {
                filters.holiday_date = {
                    $gte: params.filters.holiday_date['start_date'],
                    $lte: params.filters.holiday_date['end_date']
                };
            }
            const page = params.page || global.PAGE;
            const limit = params.limit || global.PAGE_LIMIT;
            const skip = (page - 1) * limit;

            const projection: Record<string, any> = {}

            const data = await this.holidayModel.find(filters, projection).skip(skip).limit(limit).lean();
            const total = await this.holidayModel.countDocuments(filters);
            return this.res.pagination(data, total, page, limit);
        } catch (error) {
            return this.res.error(HttpStatus.BAD_REQUEST, 'ERROR.BAD_REQ', error);
        }
    }
    async delete(req: any, params: any): Promise<any> {
        try {
            let match: any = { _id: params._id, is_delete: 0 };
            const exist = await this.holidayModel.findOne(match).exec();
            if (!exist) return this.res.error(HttpStatus.BAD_REQUEST, 'ERROR.NOT_EXIST');
            if (params?.is_delete && exist['is_delete'] === params?.is_delete) return this.res.error(HttpStatus.BAD_REQUEST, 'WARNING.ALREADY_DELETE');
            const updateObj = {
                ...req['updateObj'],
                ...params,
            };
            await this.holidayModel.updateOne(
                { _id: params._id },
                updateObj
            );
            return this.res.success('SUCCESS.DELETE');
        } catch (error) {
            return this.res.error(HttpStatus.BAD_REQUEST, 'ERROR.BAD_REQ', error);
        }
    }

}
