import { HttpStatus, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { ResponseService } from 'src/services/response.service';
import { Like } from 'src/common/utils/common.utils';
import { PostalCodeModel } from '../models/postal-code.model';
import { toTitleCase } from 'src/common/utils/common.utils';
@Injectable()
export class PostalCodeService {
    constructor(
        @InjectModel(PostalCodeModel.name) private postalCodeModel: Model<PostalCodeModel>,
        private readonly res: ResponseService
    ) { }

    async read(req: any, params: any): Promise<any> {
        try {
            let match: any = { is_delete: 0 };
            const projection = {
                updated_at: 0,
                created_unix_time: 0,
                is_delete: 0,
                org_id: 0,
                created_id: 0
            };

            if (params?.filters?.customer_name) {
                const pattern = new RegExp(params.filters.customer_name, 'i');
                match.customer_name = { $regex: pattern };
            }
            if (params?.filters?.state) match.state = Like(params.filters.state);
            if (params?.filters?.district) match.district = Like(params.filters.district);
            if (params?.filters?.pincode) match.pincode = Like(params.filters.pincode);
            if (params?.filters?.city) match.city = Like(params.filters.city);

            const page: number = params?.page || global.PAGE;
            const limit: number = params?.limit || global.LIMIT;
            const skip: number = (page - 1) * limit;

            const total = await this.postalCodeModel.countDocuments(match);
            const data = await this.postalCodeModel.find(match, projection)
                .sort({ _id: -1 })
                .skip(skip)
                .limit(limit)

            return this.res.pagination(data, total, page, limit);
        } catch (error) {
            return this.res.error(HttpStatus.BAD_REQUEST, 'ERROR.BAD_REQ', error);
        }
    }
    
    async readStates(req: any, params: any): Promise<any> {
        try {
            let match: any = { is_delete: 0 };

            match.country = params?.country || 'India';

            const searchValue = params?.search?.trim() || params?.filters?.search?.trim();
            if (searchValue) {
                match.state = { $regex: searchValue, $options: 'i' };
            }

            let data: any = await this.postalCodeModel.aggregate([
                { $match: match },
                {
                    $group: {
                        _id: "$state",
                        count: { $sum: 1 }
                    }
                },
                { $sort: { _id: 1 } }
            ]);

            data = data.map((row: any) => ({
                label: row._id,
                value: row._id,
                count: row.count
            }));
            return this.res.success('SUCCESS.FETCH', data);
        } catch (error) {
            return this.res.error(HttpStatus.BAD_REQUEST, 'ERROR.BAD_REQ', error);
        }
    }

    async readDistricts(req: any, params: any): Promise<any> {
        try {
            const match: any = {
                is_delete: 0,
            };

            if (params?.state) {
                match.state = { $regex: `^${params.state.trim()}$`, $options: 'i' };
            }

            if (params?.country) {
                match.country = { $regex: `^${params.country.trim()}$`, $options: 'i' };
            }

            if (params?.filters?.search) {
                const searchValue = params.filters.search.trim();
                match.district = { $regex: searchValue, $options: 'i' };
            }

            const page: number = params?.page || global.PAGE;
            const limit: number = params?.limit || global.LIMIT;
            const skip: number = (page - 1) * limit;

            let data: any = await this.postalCodeModel.aggregate([
                {
                    $match: match
                },
                {
                    $group: {
                        _id: "$district",
                        count: { $sum: 1 }
                    }
                },
                {
                    $project: {
                        district: "$_id",
                        count: 1,
                        _id: 0
                    }
                },
                {
                    $sort: { district: 1 }
                },
                {
                    $skip: skip
                },
                {
                    $limit: limit
                }
            ]);

            data = data.map((row: any) => ({
                label: row.district,
                value: row.district,
                count: row.count
            }));

            return this.res.success('SUCCESS.FETCH', data);
        } catch (error) {
            return this.res.error(HttpStatus.BAD_REQUEST, 'ERROR.BAD_REQ', error);
        }
    }

    async readUsingPincode(req: any, params: any): Promise<any> {
        try {
            const match: Record<string, any> = {
                is_delete: 0,
                pincode: params.pincode
            };
            const data = await this.postalCodeModel.findOne(match).lean();
            if (!data) {
                return this.res.error(HttpStatus.BAD_REQUEST, 'ERROR.NOT_FOUND');
            }
            data.state = data.state ? toTitleCase(data.state) : '';
            data.city = data.city ? toTitleCase(data.city) : '';
            data.district = data.district ? toTitleCase(data.district) : '';
            data.country = data.country ? toTitleCase(data.country) : '';
            return this.res.success('SUCCESS.FETCH', data);
        } catch (error) {
            return this.res.error(HttpStatus.BAD_REQUEST, 'ERROR.BAD_REQ', error);
        }
    }

    async create(req: any, params: any): Promise<any> {
        try {
            const exist: Record<string, any> = await this.postalCodeModel.findOne({ org_id: req['user']['org_id'], country: params.country, pincode: params.pincode }).exec();
            if (exist) return this.res.error(HttpStatus.BAD_REQUEST, 'WARNING.ALREADY_EXIST');

            const saveObj = {
                ...req['createObj'],
                ...params
            };

            const document = new this.postalCodeModel(saveObj);
            await document.save();

            return this.res.success('SUCCESS.CREATE');
        } catch (error) {
            return this.res.error(HttpStatus.BAD_REQUEST, 'ERROR.BAD_REQ', error);
        }
    }


    async update(req: any, params: any): Promise<any> {
        try {
            const postalCodeData: Record<string, any> = await this.postalCodeModel.findOne(
                {
                    _id: params._id,
                    is_delete: 0
                }
            ).lean();
            if (!postalCodeData) return this.res.error(HttpStatus.BAD_REQUEST, 'ERROR.NOT_FOUND');
            if (params?.is_delete && postalCodeData['is_delete'] === params?.is_delete) return this.res.error(HttpStatus.BAD_REQUEST, 'WARNING.ALREADY_DELETE');

            if (
                postalCodeData.city === params.city &&
                postalCodeData.pincode === params.pincode &&
                postalCodeData.state === params.state &&
                postalCodeData.district === params.district
            ) {
                return this.res.error(HttpStatus.BAD_REQUEST, 'WARNING.ALREADY_UPDATED');
            }

            const updateObj = {
                ...req['updateObj'],
                ...params
            };

            const updatedDocument = await this.postalCodeModel.updateOne(
                { _id: params._id },
                updateObj
            );
            return this.res.success('SUCCESS.UPDATE', updatedDocument);
        } catch (error) {
            return this.res.error(HttpStatus.BAD_REQUEST, 'ERROR.BAD_REQ', error);
        }
    }

    async isPostalDataExist(org_id: number, params: any): Promise<any> {
        try {
            const result = await this.postalCodeModel.find(params);
            return result;
        } catch (error) {
            console.log('Error during PostalDataExist function.', error)
            return this.res.error(HttpStatus.BAD_REQUEST, 'ERROR.BAD_REQ', error);
        }
    }

}
