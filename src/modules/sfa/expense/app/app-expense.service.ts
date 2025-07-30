import { Injectable, HttpStatus } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { ResponseService } from 'src/services/response.service';
import { ExpenseModel } from '../models/expense.model';
import { commonFilters, currentMonthNumber, currentYear, getMonthStartEnd, nextSeq, tat, toLocalDateString, toObjectId } from 'src/common/utils/common.utils';
import { ActiveTab } from './dto/app-expense.dto';
import { SharedUserService } from 'src/modules/master/user/shared-user.service';
import { ExpenseStatus } from '../web/dto/expense.dto';

@Injectable()
export class AppExpenseService {
    constructor(
        @InjectModel(ExpenseModel.name) private expenseModel: Model<ExpenseModel>,
        private readonly res: ResponseService,
        private readonly sharedUserService: SharedUserService,
    ) { }

    async createExpense(req: any, params: any): Promise<any> {
        try {
            const orgId = req['user']['org_id']
            const requestedLeaveStart = toLocalDateString(new Date(params.start_date));
            const requestedLeaveEnd = toLocalDateString(new Date(params.end_date));
            if (requestedLeaveStart > requestedLeaveEnd) {
                return this.res.error(HttpStatus.BAD_REQUEST, 'EXPENSE.APP.DATE_CONFLICT');
            }
            const exist: Record<string, any> = await this.expenseModel.findOne({
                org_id: orgId,
                user_id: req['user']['_id'],
                is_delete: 0,
                _id: { $ne: params._id },
                $or: [
                    { start_date: { $lte: requestedLeaveEnd }, end_date: { $gte: requestedLeaveStart } },
                    { start_date: { $gte: requestedLeaveStart, $lte: requestedLeaveEnd } },
                    { end_date: { $gte: requestedLeaveStart, $lte: requestedLeaveEnd } }
                ]
            }).exec();
            if (exist) return this.res.error(HttpStatus.BAD_REQUEST, 'EXPENSE.APP.EXIST');

            params.user_id = toObjectId(req['user']['_id']);

            const seq = {
                modelName: this.expenseModel,
                idKey: 'expense_id',
                prefix: 'EXP'
            }

            const newExpenseId = await nextSeq(req, seq)

            const saveObj: Record<string, any> = {
                ...req['createObj'],
                ...params,
                expense_id: newExpenseId,
            };
            if (req?.['user']?.['org']?.['is_expesne_senior_status']) {
                saveObj['senior_status'] = global.EXPENSE_STATUS[6];
            }
            const document = new this.expenseModel(saveObj);
            const savedExpense = await document.save();
            if (!savedExpense._id) return this.res.error(HttpStatus.BAD_REQUEST, 'ERROR.BAD_REQ');
            return this.res.success('SUCCESS.CREATE', { inserted_id: savedExpense._id });
        } catch (error) {
            return this.res.error(HttpStatus.BAD_REQUEST, 'ERROR.BAD_REQ', error);
        }
    }
    async readExpense(req: Request, params: any): Promise<any> {
        try {

            let is_senior_status: Boolean = false;
            if (req?.['user']?.['org']?.['is_expesne_senior_status']) is_senior_status = true;

            if (is_senior_status && (!params.activeTab || ![ActiveTab.SELF, ActiveTab.TEAM].includes(params.activeTab))) {
                return this.res.error(
                    HttpStatus.BAD_REQUEST,
                    'ERROR.BAD_REQ',
                    'activeTab should be either "self" or "team"'
                );
            }

            let dateRange: any
            if (params?.month && params?.year) {
                dateRange = getMonthStartEnd(params.month, params.year)
            } else {
                dateRange = getMonthStartEnd(currentMonthNumber(), currentYear())
            }
            let match: Record<string, any> = { is_delete: 0, org_id: req['user']['org_id'], user_id: req['user']['_id'] };

            if (params?.activeTab && params.activeTab === ActiveTab.TEAM) {
                params.level = 1
                const juniorsIds = await this.sharedUserService.getJunior(req, params);
                match.user_id = { $in: juniorsIds }
            }

            let sorting: Record<string, 1 | -1> = { _id: -1 };
            if (params?.sorting && Object.keys(params.sorting).length !== 0) sorting = params.sorting;
            const filters: Record<string, any> = commonFilters(params?.filters);
            match = { ...match, ...filters };
            const { start, end } = dateRange;
            if (start && end) {
                match.created_at = {
                    $gte: new Date(start),
                    $lt: new Date(end),
                };
            }
            const page: number = params?.page || global.PAGE;
            const limit: number = params?.limit || global.LIMIT;
            const skip: number = (page - 1) * limit;
            const result = await this.expenseModel.find(match)
                .skip(skip)
                .limit(limit)
                .sort(sorting)
                .select("_id description created_at created_id created_name updated_at start_date end_date status status_remark expense_type total_item claim_amount reason expense_id").lean();
            const total = await this.expenseModel.countDocuments(match);
            const data: any = { result, is_senior_status };
            return this.res.pagination(data, total, page, limit);
        } catch (error) {
            return this.res.error(HttpStatus.BAD_REQUEST, 'ERROR.BAD_REQ', error);
        }
    }
    async getExpenseSummary(req: Request, params: any): Promise<any> {
        try {


            let match: Record<string, any> = {
                is_delete: 0,
                org_id: req['user']['org_id'],
                user_id: toObjectId(req['user']['_id'])
            };

            if (!req.url.includes('app-home')) {

                if (req?.['user']?.['org']?.['is_expesne_senior_status'] && !params.activeTab) {
                    return this.res.error(
                        HttpStatus.BAD_REQUEST,
                        'ERROR.BAD_REQ',
                        'activeTab should be either "self" or "team"'
                    );
                }

                if (params?.activeTab && params.activeTab === ActiveTab.TEAM) {
                    params.level = 1
                    const juniorsIds = await this.sharedUserService.getJunior(req, params);
                    match.user_id = { $in: juniorsIds }
                }
            }


            let dateRange: any;
            if (!params?.internalCall) {

                if (params?.month && params?.year) {
                    dateRange = getMonthStartEnd(params.month, params.year);
                } else {
                    dateRange = getMonthStartEnd(currentMonthNumber(), currentYear());
                }
                const { start, end } = dateRange;
                if (start && end) {
                    match.created_at = {
                        $gte: start,
                        $lt: end,
                    };
                }
            }
            const result = await this.expenseModel.aggregate([
                { $match: match },
                {
                    $facet: {
                        total_claim: [
                            { $match: { status: { $in: [ExpenseStatus.Submitted, ExpenseStatus.Approved, ExpenseStatus.Paid] } } },
                            {
                                $group:
                                {
                                    _id: null,
                                    total_claim_amount: { $sum: "$claim_amount" },
                                    total_claim_count: { $sum: 1 },
                                }
                            },
                        ],
                        total_approved: [
                            { $match: { status: { $in: [ExpenseStatus.Approved, ExpenseStatus.Paid] } } },
                            {
                                $group:
                                {
                                    _id: null,
                                    total_approved_amount: { $sum: "$approved_amount" },
                                    total_approved_count: { $sum: 1 },

                                }
                            },
                        ],
                        total_paid: [
                            { $match: { status: ExpenseStatus.Paid } },
                            {
                                $group:
                                {
                                    _id: null,
                                    total_paid_amount: { $sum: "$approved_amount" },
                                    total_paid_count: { $sum: 1 },
                                }
                            }
                        ]
                    }
                },
                {
                    $project: {
                        total_claim_amount: { $ifNull: [{ $arrayElemAt: ["$total_claim.total_claim_amount", 0] }, 0] },
                        total_claim_count: { $ifNull: [{ $arrayElemAt: ["$total_claim.total_claim_count", 0] }, 0] },
                        total_approved_amount: { $ifNull: [{ $arrayElemAt: ["$total_approved.total_approved_amount", 0] }, 0] },
                        total_approved_count: { $ifNull: [{ $arrayElemAt: ["$total_approved.total_approved_count", 0] }, 0] },
                        total_paid_amount: { $ifNull: [{ $arrayElemAt: ["$total_paid.total_paid_amount", 0] }, 0] },
                        total_paid_count: { $ifNull: [{ $arrayElemAt: ["$total_paid.total_paid_count", 0] }, 0] },
                    }
                }
            ]);
            const totalData = result.length > 0 ? result[0] : {
                total_claim_amount: 0,
                total_claim_count: 0,
                total_approved_amount: 0,
                total_approved_count: 0,
                total_paid_amount: 0,
                total_paid_count: 0
            };
            if (params?.internalCall) {
                const lastClaim: Record<string, any> = await this.expenseModel.findOne(match).sort({ created_at: -1 });
                if (lastClaim) {
                    totalData.tat = tat(lastClaim.created_at, new Date(), 'd');
                } else {
                    totalData.tat = '0 days'
                }
                return totalData
            }
            return this.res.success('SUCCESS.FETCH', totalData);
        } catch (error) {
            if (params?.internalCall) throw error
            return this.res.error(HttpStatus.BAD_REQUEST, 'ERROR.BAD_REQ', error);
        }
    }
    async updateStatus(req: Request, params: any): Promise<any> {
        try {
            // if (!req?.['user']?.['org']?.['is_expesne_senior_status']) {
            //     return this.res.error(HttpStatus.BAD_REQUEST, 'ERROR.IS_SENIOR_AUTHORIZED');
            // }

            const status = params.status;
            const exist: any = await this.expenseModel.findOne({ _id: toObjectId(params._id), is_delete: 0 }).exec();
            if (!exist) return this.res.error(HttpStatus.BAD_REQUEST, 'ERROR.BAD_REQ');

            let updateObj: Record<string, any> = {};
            if (params?.update_type === ActiveTab.TEAM) {
                updateObj = {
                    ...req['updateObj'],
                    ...req['seniorObj'],
                    ...params,
                }
            } else {
                updateObj = {
                    ...req['updateObj'],
                    ...params,
                }
            }
            await this.expenseModel.findOneAndUpdate(
                { _id: toObjectId(params._id), is_delete: 0 },
                updateObj,
                { new: true }
            ).exec();
            return this.res.success('SUCCESS.STATUS_UPDATE');
        } catch (error) {
            console.log(error)
            return this.res.error(HttpStatus.BAD_REQUEST, 'ERROR.BAD_REQ', error);
        }
    }
}
