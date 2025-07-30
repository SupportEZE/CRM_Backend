import { Injectable, HttpStatus } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { BadgesModel } from '../models/badges.model';
import { Model } from 'mongoose';
import { ResponseService } from 'src/services/response.service';
import { S3Service } from 'src/shared/rpc/s3.service';
import { endOfDay, startOfDay } from 'date-fns';
import { BadgeDocsModel } from '../models/badge-docs.model';
import { commonFilters } from 'src/common/utils/common.utils';

@Injectable()
export class BadgesService {
    constructor(
        @InjectModel(BadgesModel.name) private badgesModel: Model<BadgesModel>,
        @InjectModel(BadgeDocsModel.name) private badgeDocsModel: Model<BadgeDocsModel>,
        private readonly res: ResponseService,
        private readonly s3Service: S3Service,
    ) { }

    async create(req: any, params: any): Promise<any> {
        try {
            const startOfDayUTC = startOfDay(params.start_date)
            const endOfDayUTC = endOfDay(params.end_date)
            let match: Record<string, any> = {
                org_id: req['user']['org_id'],
                start_date: { $lte: endOfDayUTC },
                end_date: { $gte: startOfDayUTC },
                eligible_points: params.eligible_points
            };
            const exist: Record<string, any> = await this.badgesModel.findOne(match).exec();

            if (exist) return this.res.error(HttpStatus.CONFLICT, 'BADGES.ALREADY_EXIST');

            params.status = global.STATUS[1]
            const document: Record<string, any> = new this.badgesModel({
                ...req['createObj'],
                ...params
            });
            const insert = await document.save();
            return this.res.success('SUCCESS.CREATE', { inserted_id: insert._id })
        } catch (error) {
            return this.res.error(HttpStatus.BAD_REQUEST, 'ERROR.BAD_REQ', error);
        }
    }

    async update(req: any, params: any): Promise<any> {
        try {
            let match: Record<string, any> = {
                _id: params._id,
                org_id: req['user']['org_id']
            };
            const bonus: Record<string, any> = await this.badgesModel.findOne(match).exec();
            if (!bonus) return this.res.error(HttpStatus.BAD_REQUEST, 'ERROR.BAD_REQ', 'No Data found for given badge id.')

            const startOfDayUTC = startOfDay(params.attend_date)
            const endOfDayUTC = endOfDay(params.attend_date)

            let exist_match: Record<string, any> = {
                _id: { $ne: params._id },
                org_id: req['user']['org_id'],
                start_date: { $lte: endOfDayUTC },
                end_date: { $gte: startOfDayUTC },
                points: params.eligible_points
            };

            const exist: Record<string, any> = await this.badgesModel.findOne(exist_match).exec();
            if (exist) return this.res.error(HttpStatus.CONFLICT, 'BADGE.ALREADY_EXIST');

            const updateObj = {
                ...req['updateObj'],
                ...params,
            };

            await this.badgesModel.updateOne(
                { _id: params._id },
                { $set: updateObj }
            );

            return this.res.success('SUCCESS.UPDATE');
        } catch (error) {
            return this.res.error(HttpStatus.BAD_REQUEST, 'ERROR.BAD_REQ', error);
        }
    }

    async read(req: Request, params: any): Promise<any> {
        try {
            const filters: Record<string, any> = commonFilters(params?.filters) || {};
            let match: Record<string, any> = {
                is_delete: 0,
                org_id: req['user']['org_id'],
                ...filters
            };
                   
            let sorting: Record<string, 1 | -1> = { _id: -1 };

            const activeCount = await this.badgesModel.countDocuments({ ...match, status: global.STATUS[1] });
            const inActiveCount = await this.badgesModel.countDocuments({ ...match, status: global.STATUS[0] });

            match = { ...match, status: params.activeTab }

            const page: number = params?.page || global.PAGE;
            const limit: number = params?.limit || global.LIMIT;
            const skip: number = (page - 1) * limit;

            const result: Record<string, any>[] = await this.badgesModel
                .find(match)
                .sort(sorting)
                .skip(skip)
                .limit(limit)
                .lean();

            const statusTabs: Record<string, any> = {
                activeCount,
                inActiveCount,
            };

            const data: any = {
                result,
                statusTabs
            };

            data.result = await Promise.all(
                result.map(async (item: any) => {
                    item.files = await this.getDocument(item._id, global.THUMBNAIL_IMAGE)
                    return item;
                })
            );

            let total = 0
            if (params.activeTab === global.STATUS[1]) {
                total = activeCount
            } else if (params.activeTab === global.STATUS[0]) {
                total = inActiveCount;
            }
            return this.res.pagination(data, total, page, limit);
        } catch (error) {
            return this.res.error(HttpStatus.BAD_REQUEST, 'ERROR.BAD_REQ', error);
        }
    }

    async updateStatus(req: Request, params: any): Promise<any> {
        try {
            const exist: Record<string, any> = await this.badgesModel.findOne({ _id: params._id }).exec();
            if (!exist) return this.res.error(HttpStatus.BAD_REQUEST, 'ERROR.BAD_REQ', 'No badge data is found with given date')

            const updateObj = {
                ...req['updateObj'],
                ...params,
            };
            await this.badgesModel.updateOne({ _id: params._id }, updateObj);
            return this.res.success('SUCCESS.UPDATE')
        } catch (error) {
            return this.res.error(HttpStatus.BAD_REQUEST, 'ERROR.BAD_REQ', error);
        }
    }

    async upload(files: Express.Multer.File[], req: any): Promise<any> {
        try {
            req.body.module_name = Object.keys(global.SUB_MODULES).find(
                key => global.SUB_MODULES[key] === global.SUB_MODULES['Badges']
            );
            let response = await this.s3Service.uploadMultiple(files, req, this.badgeDocsModel);
            return this.res.success('SUCCESS.CREATE', response);
        } catch (error) {
            return this.res.error(HttpStatus.BAD_REQUEST, 'Error uploading files to S3', error);
        }
    }

    async getDocument(
        id: any,
        type: typeof global.FULL_IMAGE | typeof global.THUMBNAIL_IMAGE | typeof global.BIG_THUMBNAIL_IMAGE = global.FULL_IMAGE
    ): Promise<any> {
        return this.s3Service.getDocumentsByRowId(this.badgeDocsModel, id, type);
    }

    async getDocumentByDocsId(req: any, params: any): Promise<any> {
        const doc = await this.s3Service.getDocumentsById(this.badgeDocsModel, params._id);
        return this.res.success('SUCCESS.FETCH', doc);
    }

     async delete(req: Request, params: any): Promise<any> {
            try {
                let match: Record<string, any> = { org_id: req['user']['org_id'], _id: params._id, is_delete: 0 };
    
                let data: Record<string, any> = await this.badgesModel.findOne(match).lean();
                if (!data) return this.res.error(HttpStatus.BAD_REQUEST, 'ERROR.BAD_REQ', 'No Badge found with given id');
    
    
                const updateObj = {
                    ...req['updateObj'],
                    is_delete: 1,
                };
    
                await this.badgesModel.updateOne(
                    { _id: params._id },
                    { $set: updateObj }
                );
    
                return this.res.success('SUCCESS.DELETE');
            } catch (error) {
                return this.res.error(HttpStatus.BAD_REQUEST, 'ERROR.BAD_REQ', error);
            }
        }
}
