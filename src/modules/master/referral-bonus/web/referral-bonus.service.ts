import { HttpStatus, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { ReferralBonusModel } from '../models/referral-bonus.model';
import mongoose, { Model } from 'mongoose';
import { ResponseService } from 'src/services/response.service';
import { LedgerService } from 'src/modules/loyalty/ledger/web/ledger.service';
import { Like, toObjectId, commonFilters } from 'src/common/utils/common.utils';

@Injectable()
export class ReferralBonusService {
    constructor(
        @InjectModel(ReferralBonusModel.name) private referralBonusModel: Model<ReferralBonusModel>,
        private readonly res: ResponseService,
        private readonly ledgerService: LedgerService
    ) { }

    async create(req: Request, params: any): Promise<any> {
        try {
            const existingBonus = await this.referralBonusModel.findOne({
                bonus_type: params.bonus_type,
                customer_type_id: { $in: params.customer_type_id },
                org_id: req['user']['org_id'],
                is_delete: 0,
                status: global.STATUS[1]
            });

            if (existingBonus) {
                return this.res.error(HttpStatus.BAD_REQUEST, 'WARNING.ALREADY_EXIST');
            }
            params.login_type_id = global.LOGIN_TYPE_ID['INFLUENCER']
            const saveObj = {
                ...req['createObj'],
                ...params
            };

            const document = new this.referralBonusModel(saveObj);
            await document.save();

            return this.res.success('SUCCESS.CREATE');
        } catch (error) {
            return this.res.error(HttpStatus.BAD_REQUEST, 'ERROR.BAD_REQ', error);
        }
    }

    async update(req: Request, params: any): Promise<any> {
        try {
            params._id = toObjectId(params._id)
            const exist = await this.referralBonusModel.findOne({ _id: params._id }).exec();

            if (!exist) return this.res.success('WARNING.NOT_EXIST');

            if (params.bonus_type && params.customer_type_name) {
                const duplicate = await this.referralBonusModel.findOne({
                    _id: { $ne: params._id },
                    bonus_type: params.bonus_type,
                    customer_type_id: { $in: params.customer_type_id },
                    org_id: req['user']['org_id'],
                    is_delete: 0,
                });

                if (duplicate) {
                    return this.res.error(HttpStatus.BAD_REQUEST, 'WARNING.ALREADY_EXIST');
                }
            }

            const updateObj = {
                ...req['updateObj'],
                ...params,
            };

            await this.referralBonusModel.updateOne(
                { _id: exist._id },
                { $set: updateObj }
            );

            if (params.is_delete) return this.res.success('SUCCESS.DELETE')
            else return this.res.success('SUCCESS.UPDATE');
        } catch (error) {
            return this.res.error(HttpStatus.BAD_REQUEST, 'ERROR.BAD_REQ');
        }
    }

    async updateStatus(req: Request, params: any): Promise<any> {
        try {
            params._id = toObjectId(params._id)
            const exist = await this.referralBonusModel.findOne({ _id: params._id }).exec();

            if (!exist) return this.res.success('WARNING.NOT_EXIST');

            const updateObj = {
                ...req['updateObj'],
                ...params,
            };

            await this.referralBonusModel.updateOne(
                { _id: exist._id },
                { $set: updateObj }
            );

            return this.res.success('SUCCESS.UPDATE');
        } catch (error) {
            return this.res.error(HttpStatus.BAD_REQUEST, 'ERROR.BAD_REQ');
        }
    }

    async read(req: Request, params: any): Promise<any> {
        try {
            const filters: Record<string, any> = commonFilters(params?.filters) || {};
            let match: any = { 
                is_delete: 0,
                 org_id: req['user']['org_id'],
                ...filters 
            };
            let sorting: Record<string, 1 | -1> = { _id: -1 };
            

            const page: number = Math.max(1, parseInt(params?.page, 10) || global.PAGE);
            const limit: number = Math.max(1, parseInt(params?.limit, 10) || global.LIMIT);
            const skip: number = (page - 1) * limit;

            const total = await this.referralBonusModel.countDocuments(match);
            const result = await this.referralBonusModel.find(match)
                .sort(sorting)
                .skip(skip)
                .limit(limit)
                .lean();


            const modifiedResult = result.map((row: any) => {
                let const_param = { customer_type_id: row.customer_type_id, creation_type: row.bonus_type }
                let total_points = this.ledgerService.readTransactionTypeWise(req, const_param) ?? 0
                return {
                    ...row,
                    user_working_flow: global.BONUS_TYPES_USER_FLOW[row.bonus_type],
                    admin_working_flow: global.BONUS_TYPES_ADMIN_FLOW[row.bonus_type],
                    total_points_claimed: total_points
                };
            });

            return this.res.pagination(modifiedResult, total, page, limit);

        } catch (error) {
            return this.res.error(HttpStatus.BAD_REQUEST, 'ERROR.BAD_REQ', error);
        }
    }
}