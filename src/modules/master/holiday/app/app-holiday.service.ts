import { Injectable, HttpStatus } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { HolidayModel } from '../models/holiday.model';
import mongoose, { Model, Types } from 'mongoose';
import { ResponseService } from 'src/services/response.service';
import { toObjectId } from 'src/common/utils/common.utils';

@Injectable()
export class AppHolidayService {
    constructor(
        @InjectModel(HolidayModel.name) private holidayModel: Model<HolidayModel>,
        private readonly res: ResponseService
    ) { }

    async read(req: Request, params: any): Promise<any> {
        try {
            const query: any = {};

            if (params._id) query._id = params._id;

            if (params.search) {
                query.$or = [
                    { holiday_name: { $regex: params.search, $options: 'i' } },
                    { holiday_type: { $regex: params.search, $options: 'i' } }
                ];
            }

            const page: number = params?.page || global.PAGE;
            const limit: number = params?.limit || global.LIMIT;
            const skip: number = (page - 1) * limit;

            const data = await this.holidayModel.find(query).skip(skip).limit(limit).exec();
            const totalRecords = await this.holidayModel.countDocuments(query);
            return this.res.pagination(data, totalRecords, page, limit);
        } catch (error) {
            return this.res.error(HttpStatus.BAD_REQUEST, 'ERROR.BAD_REQ', error);
        }
    }

}
