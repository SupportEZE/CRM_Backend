import { Injectable, HttpStatus } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { BonusModel } from '../models/bonus.model';
import { Model } from 'mongoose';
import { ResponseService } from 'src/services/response.service';
import { toObjectId ,commonFilters } from 'src/common/utils/common.utils';
import { PointCategoryModel } from 'src/modules/master/point-category/models/point-category.model';
import { BonusPointCategoryModel } from '../models/bonu-point-category.model';



@Injectable()
export class BonusService {
    constructor(
        @InjectModel(BonusModel.name) private bonusModel: Model<BonusModel>,
        @InjectModel(PointCategoryModel.name) private pointCategoryModel: Model<PointCategoryModel>,
        @InjectModel(BonusPointCategoryModel.name) private bonusPointCategoryModel: Model<BonusPointCategoryModel>,
        private readonly res: ResponseService
    ) { }

    async create(req: any, params: any): Promise<any> {
        try {

            let match: Record<string, any> = {
                org_id: req['user']['org_id'],
                state: { $in: params.state },
                district: { $in: params.district },
                customer_type_name: { $in: params.customer_type_name },
                status: global.STATUS[1],
                start_date: { $lte: params.end_date },
                end_date: { $gte: params.start_date },

            };

            const exist: Record<string, any> = await this.bonusModel.findOne(match).exec();
            if (exist) return this.res.error(HttpStatus.CONFLICT, 'BONUS.ALREADY_EXIST');
            let product_point: any
            if (params.product_point && params.product_point.length > 0) {
                product_point = params.product_point
            }
            delete params.product_point
            const document: Record<string, any> = new this.bonusModel({
                ...req['createObj'],
                ...params,
                status: global.STATUS[1]
            });
            const savedBonus = await document.save();

            if (product_point && product_point.length > 0) {
                const productPointsToInsert = product_point.map((point: any) => ({
                    ...req['createObj'],
                    ...point,
                    bonus_id: savedBonus._id,
                    point_category_name: point.point_category_name,
                    point_category_id: toObjectId(point.point_category_id),
                    point_category_value: point.point_category_value
                }));
                await this.bonusPointCategoryModel.insertMany(productPointsToInsert);
            }
            return this.res.success('SUCCESS.CREATE');
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
            const bonus: Record<string, any> = await this.bonusModel.findOne(match).exec();
            if (!bonus) return this.res.error(HttpStatus.BAD_REQUEST, 'ERROR.BAD_REQ', 'No bonus exist with given id.');
            const updateObj = {
                ...req['updateObj'],
                title: params.title,
                start_date: params.start_date,
                end_date: params.end_date
            };
            await this.bonusModel.updateOne(
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
            const activeCount = await this.bonusModel.countDocuments({ ...match, status: global.STATUS[1] });
            const inActiveCount = await this.bonusModel.countDocuments({ ...match, status: global.STATUS[0] });

            match = { ...match,status: params.activeTab }

            const page: number = params?.page || global.PAGE;
            const limit: number = params?.limit || global.LIMIT;
            const skip: number = (page - 1) * limit;

            const result: Record<string, any>[] = await this.bonusModel
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

    async detail(req: Request, params: any): Promise<any> {
        try {
            let match: Record<string, any> = {
                org_id: req['user']['org_id'],
                _id: params._id,
                is_delete: 0
            };
            let data: Record<string, any> = await this.bonusModel.findOne(match).lean();
            if (data) {
                let bonusPointCategoryData: Record<string, any>[] = await this.bonusPointCategoryModel.find({ bonus_id: data['_id'] }).lean();
                data.product_point = [];
                if (bonusPointCategoryData && bonusPointCategoryData.length > 0) {
                    bonusPointCategoryData.forEach(item => {
                        data.product_point.push({
                            point_category_id: item.point_category_id,
                            point_category_name: item.point_category_name,
                            point_category_value: item.point_category_value
                        });
                    });
                }
            }
            return this.res.success('SUCCESS.DETAIL', data);
        } catch (error) {
            return this.res.error(HttpStatus.BAD_REQUEST, 'ERROR.BAD_REQ', error);
        }
    }

    async updateStatus(req: Request, params: any): Promise<any> {
        try {
            const exist: Record<string, any> = await this.bonusModel.findOne({ _id: params._id }).exec();
            if (!exist) return this.res.error(HttpStatus.BAD_REQUEST, 'ERROR.BAD_REQ', 'No bonus exist with given id.')

            const updateObj = {
                ...req['updateObj'],
                ...params,
            };
            await this.bonusModel.updateOne(
                { _id: params._id },
                updateObj
            );
            if (params?.status) return this.res.success('SUCCESS.STATUS_UPDATE')
        } catch (error) {
            return this.res.error(HttpStatus.BAD_REQUEST, 'ERROR.BAD_REQ', error);
        }
    }

    async readPointCategory(req: Request, params: any): Promise<any> {
        try {
            let match: Record<string, any> = {
                is_delete: 0,
                org_id: req['user']['org_id'],
            };
            const data: Record<string, any>[] = await this.pointCategoryModel
                .find(match)
                .lean();
            return this.res.success('SUCCESS.FETCH', data);
        } catch (error) {
            return this.res.error(HttpStatus.BAD_REQUEST, 'ERROR.BAD_REQ', error);
        }
    }

    async updatePoint(req: any, params: any): Promise<any> {
        try {
            let match: Record<string, any> = {
                _id: params._id,
                org_id: req['user']['org_id']
            };
            const bonus: Record<string, any> = await this.bonusModel.findOne(match).exec();
            if (!bonus) return this.res.error(HttpStatus.BAD_REQUEST, 'ERROR.BAD_REQ', 'No bonus exist with given id.');
            for (const item of params.product_point) {
                await this.bonusPointCategoryModel.updateOne(
                    {
                        bonus_id: toObjectId(params._id),
                        point_category_id: toObjectId(item.point_category_id)
                    },
                    {
                        $set: {
                            point_category_value: item.point_category_value
                        }
                    }
                );
            }
            return this.res.success('SUCCESS.UPDATE');
        } catch (error) {
            return this.res.error(HttpStatus.BAD_REQUEST, 'ERROR.BAD_REQ', error);
        }
    }

    async updateStates(req: any, params: any): Promise<any> {
        try {
            let match: Record<string, any> = {
                _id: params._id,
                org_id: req['user']['org_id']
            };
            const bonus: Record<string, any> = await this.bonusModel.findOne(match).exec();
            if (!bonus) return this.res.error(HttpStatus.BAD_REQUEST, 'ERROR.BAD_REQ', 'No bonus exist with given id.');
            if (params.state) {
                await this.bonusModel.updateOne(
                    { _id: toObjectId(params._id), org_id: req['user']['org_id'] },
                    { $set: { state: params.state } }
                );
            }
            if (params.district) {
                await this.bonusModel.updateOne(
                    { _id: toObjectId(params._id), org_id: req['user']['org_id'] },
                    { $set: { district: params.district } }
                );
            }
            return this.res.success('SUCCESS.UPDATE');
        } catch (error) {
            return this.res.error(HttpStatus.BAD_REQUEST, 'ERROR.BAD_REQ', error);
        }
    }


}
