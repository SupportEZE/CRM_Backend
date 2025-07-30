import { Injectable, HttpStatus } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { SpinWinModel } from '../models/spin-win-model';
import { SpinWinCustomersModel } from '../models/spin-win-customer.model';
import { Model } from 'mongoose';
import { ResponseService } from 'src/services/response.service';
import { toObjectId } from 'src/common/utils/common.utils';
import { commonFilters } from 'src/common/utils/common.utils';
@Injectable()
export class SpinWinService {
    constructor(
        @InjectModel(SpinWinModel.name) private spinWinModel: Model<SpinWinModel>,
        @InjectModel(SpinWinCustomersModel.name) private spinWinCustomersModel: Model<SpinWinCustomersModel>,
        private readonly res: ResponseService
    ) { }

    async create(req: any, params: any): Promise<any> {
        try {
            let match: Record<string, any> = {
                is_delete: 0,
                org_id: req['user']['org_id'],
                customer_type_id: { $in: params.customer_type_id },
                status: global.STATUS[1]
            };
            const exist: Record<string, any>[] = await this.spinWinModel.find(match).exec();
            if (exist.length > 0) return this.res.error(HttpStatus.CONFLICT, 'SPIN.ALREADY_EXIST');

            const saveObj: Record<string, any> = {
                ...req['createObj'],
                ...params,
                status: global.STATUS[1]
            };
            const document = new this.spinWinModel(saveObj);
            await document.save();
            return this.res.success('SUCCESS.CREATE');
        } catch (error) {
            return this.res.error(HttpStatus.BAD_REQUEST, 'ERROR.BAD_REQ', error);
        }
    }

    async read(req: Request, params: any): Promise<any> {
        try {
             const filters: Record<string, any> = commonFilters(params.filters);
            let match: Record<string, any> = {
                is_delete: 0,
                org_id: req['user']['org_id'],
                ...filters,
            };

            let sorting: Record<string, 1 | -1> = { _id: -1 };

            const activeCount = await this.spinWinModel.countDocuments({ ...match, status: global.STATUS[1] });

            const inActiveCount = await this.spinWinModel.countDocuments({ ...match, status: global.STATUS[0] });

            match = { ...match, status: params.activeTab }

            const page: number = params?.page || global.PAGE;
            const limit: number = params?.limit || global.LIMIT;
            const skip: number = (page - 1) * limit;

            const result: Record<string, any>[] = await this.spinWinModel
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

    async updateStatus(req: Request, params: any): Promise<any> {
        try {
            const exist: Record<string, any> = await this.spinWinModel.findOne({ _id: params._id }).exec();
            if (!exist) return this.res.error(HttpStatus.BAD_REQUEST, 'ERROR.BAD_REQ', 'Record not found with given id.')

            const updateObj = {
                ...req['updateObj'],
                ...params,
            };

            await this.spinWinModel.updateOne(
                { _id: params._id },
                updateObj
            );

            if (params?.status) return this.res.success('SUCCESS.UPDATE')
        } catch (error) {
            return this.res.error(HttpStatus.BAD_REQUEST, 'ERROR.BAD_REQ', error);
        }
    }

    async updateSpinWin(req: Request, params: any): Promise<any> {
        try {
            const exist: Record<string, any> = await this.spinWinModel.findOne({ _id: params._id }).exec();
            if (!exist) return this.res.error(HttpStatus.BAD_REQUEST, 'ERROR.BAD_REQ', 'Record not found with given id.');
            const updateObj = {
                ...req['updateObj'],
                ...params,
            };
            const updateResult = await this.spinWinModel.updateOne(
                { _id: params._id },
                updateObj
            );
            return this.res.success('SUCCESS.UPDATE');
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
            }
            let data: Record<string, any> = await this.spinWinModel.findOne(match).lean();
            return this.res.success('SUCCESS.DETAIL', data);
        } catch (error) {
            return this.res.error(HttpStatus.BAD_REQUEST, 'ERROR.BAD_REQ', error)
        }
    }

    async spinCount(req, params): Promise<any> {

        params._id = toObjectId(params?.customer_id) || req['user']['_id']
              
        
        if (!params.customer_id || !params.org_id) {
            return { count: 0, points: 0 };
        }

        const count = await this.spinWinModel.countDocuments({
            customer_id: toObjectId(params.customer_id),
            org_id: params.org_id
        });

        const result = await this.spinWinCustomersModel.aggregate([
            {
                $match: {
                    customer_id: params.customer_id,
                    org_id: params.org_id
                }
            },
            {
                $group: {
                    _id: null,
                    totalPoints: { $sum: "$points" }
                }
            }
        ]);

        const points = result[0]?.totalPoints || 0;

        return { count, points };
    }

}
