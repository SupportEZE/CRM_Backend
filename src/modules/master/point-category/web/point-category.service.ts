import { Injectable, HttpStatus } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { ResponseService } from 'src/services/response.service';
import { Lts } from 'src/shared/translate/translate.service';
import { toObjectId, commonFilters } from 'src/common/utils/common.utils';
import { PointCategoryMapModel } from '../models/point-category-map.model';
import { PointCategoryModel } from '../models/point-category.model';

@Injectable()
export class PointCategoryService {
    constructor(
        @InjectModel(PointCategoryModel.name) private pointCategoryModel: Model<PointCategoryModel>,
        @InjectModel(PointCategoryMapModel.name) private pointCategoryMapModel: Model<PointCategoryMapModel>,
        private readonly res: ResponseService,
        private readonly lts: Lts
    ) { }

    async create(req: Request, params: any): Promise<any> {
        try {
            const exist = await this.pointCategoryModel.findOne({
                point_category_name: params.point_category_name,
                org_id: req['user']['org_id'],
            }).exec();

            if (exist) {
                return this.res.error(HttpStatus.BAD_REQUEST, 'ERROR.BAD_REQ', 'A category with the same name already exists.');
            }

            params.status = global.STATUS[1]
            const saveObj = {
                ...req['createObj'],
                ...params,
            };
            const document = new this.pointCategoryModel(saveObj);
            await document.save();

            return this.res.success('SUCCESS.CREATE');
        } catch (error) {
            return this.res.error(HttpStatus.BAD_REQUEST, 'ERROR.BAD_REQ', error?.message || 'An unexpected error occurred.');
        }
    }

    async update(req: Request, params: any): Promise<any> {
        try {
            const exist = await this.pointCategoryModel.findById(params._id).exec();
            if (!exist) {
                return this.res.error(HttpStatus.BAD_REQUEST, 'ERROR.BAD_REQ', 'Point category not found.');
            }

            const updateObj = {
                ...req['updateObj'],
                ...params,
            };

            await this.pointCategoryModel.updateOne(
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
            let match: any = { is_delete: 0, org_id: req['user']['org_id'] };
            let sorting: Record<string, 1 | -1> = { _id: -1 };

            const filters = params?.filters || {};
            match = { ...match, ...commonFilters(filters) };

            const page: number = Math.max(1, parseInt(params?.page, 10) || global.PAGE);
            const limit: number = Math.max(1, parseInt(params?.limit, 10) || global.LIMIT);
            const skip: number = (page - 1) * limit;

            const total = await this.pointCategoryModel.countDocuments(match);
            const result = await this.pointCategoryModel.find(match)
                .sort(sorting)
                .skip(skip)
                .limit(limit)
                .exec();

            return this.res.pagination(result, total, page, limit);

        } catch (error) {
            return this.res.error(HttpStatus.BAD_REQUEST, 'ERROR.BAD_REQ', error);
        }
    }

    async detail(req: Request, params: any): Promise<any> {
        try {
            let match: Record<string, any> = { _id: toObjectId(params._id) };

            const result = await this.pointCategoryModel.findOne(match).exec()

            return this.res.success('SUCCESS.FETCH', result);

        } catch (error) {
            return this.res.error(HttpStatus.BAD_REQUEST, 'ERROR.BAD_REQ', error);
        }
    }

    async readDropdown(req: Request, params: any): Promise<any> {
        try {
            let match: Record<string, any> = { is_delete: 0, org_id: req['user']['org_id'] };
            let sorting: Record<string, 1 | -1> = { _id: -1 };
            if (params?.sorting && Object.keys(params.sorting).length !== 0) sorting = params.sorting;

            const filters: Record<string, any> = commonFilters(params?.filters);
            match = { ...match, ...filters };

            const page: number = parseInt(params?.page) || global.PAGE;
            const limit: number = parseInt(params?.limit) || global.LIMIT;
            const skip: number = (page - 1) * limit;

            const pipeline = [
                {
                    $project: {
                        label: "$point_category_name",
                        value: "$_id",
                        org_id: 1,
                        is_delete: 1
                    }
                },
                {
                    $match: match,
                }
            ];

            const totalCountData: Record<string, any>[] = await this.pointCategoryModel.aggregate([
                ...pipeline,
                { $count: "totalCount" },
            ]);

            const total: number = totalCountData.length > 0 ? totalCountData[0].totalCount : 0;

            let result: Record<string, any>[] = await this.pointCategoryModel.aggregate([
                ...pipeline,
                { $skip: skip },
                { $limit: limit },
            ]);

            return this.res.pagination(result, total, page, limit);
        } catch (error) {
            return this.res.error(HttpStatus.BAD_REQUEST, 'ERROR.BAD_REQ', error);
        }
    }

    async updateStatus(req: Request, params: any): Promise<any> {
        try {
            const exist = await this.pointCategoryModel.findById(params._id).exec();
            if (!exist) {
                return this.res.error(HttpStatus.BAD_REQUEST, 'ERROR.BAD_REQ', 'Point category not found.');
            }

            const updateObj = {
                ...req['updateObj'],
                ...params,
            };

            await this.pointCategoryModel.updateOne(
                { _id: params._id },
                { $set: updateObj }
            );

            return this.res.success('SUCCESS.UPDATE');
        } catch (error) {
            return this.res.error(HttpStatus.BAD_REQUEST, 'ERROR.BAD_REQ', error);
        }
    }

    async pointProductMap(req: Request, params: any): Promise<any> {
        try {
            params.product_id = toObjectId(params.product_id)

            if (params.is_delete) {
                const updateObj = {
                    ...req['updateObj'],
                    is_delete: 1,
                };

                await this.pointCategoryMapModel.updateMany(
                    { product_id: params.product_id },
                    { $set: updateObj }
                );
                return this.res.success('SUCCESS.DELETE');
            }

            params.point_category_id = toObjectId(params.point_category_id)

            const exist = await this.pointCategoryMapModel.findOne({
                point_category_id: params.point_category_id,
                product_id: params.product_id,
                org_id: req['user']['org_id'],
                is_delete: 0
            }).exec();

            if (exist) {
                return this.res.error(HttpStatus.BAD_REQUEST, 'ERROR.BAD_REQ', 'Point category with the same Product already Mapped.');
            }


            const existProduct = await this.pointCategoryMapModel.findOne({
                product_id: params.product_id,
                org_id: req['user']['org_id'],
                is_delete: 0
            }).exec();

            if (existProduct) {
                const updateObj = {
                    ...req['updateObj'],
                    ...params,
                };

                await this.pointCategoryMapModel.updateOne(
                    { _id: existProduct._id },
                    { $set: updateObj }
                );
                return this.res.success('SUCCESS.UPDATE');
            } else {
                const saveObj = {
                    ...req['createObj'],
                    ...params,
                };
                const document = new this.pointCategoryMapModel(saveObj);
                await document.save();
                return this.res.success('SUCCESS.CREATE');

            }
        } catch (error) {
            return this.res.error(HttpStatus.BAD_REQUEST, 'ERROR.BAD_REQ', error);
        }
    }
}
