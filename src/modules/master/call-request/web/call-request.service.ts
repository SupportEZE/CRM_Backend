import { HttpStatus, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { CallRequestModel } from '../models/call-request.model';
import { Model } from 'mongoose';
import { ResponseService } from 'src/services/response.service';
import { toObjectId, commonFilters } from 'src/common/utils/common.utils';

@Injectable()
export class CallRequestService {
    constructor(
        @InjectModel(CallRequestModel.name) private callRequestModel: Model<CallRequestModel>,
        private readonly res: ResponseService
    ) { }

    async read(req: Request, params: any): Promise<any> {
        try {
            let match: any
            if (req['user']['login_type_id'] === 1) {
                match = { is_delete: 0 };
            } else {
                match = { is_delete: 0, org_id: req['user']['org_id'] };
            }
            let sorting: Record<string, 1 | -1> = { _id: -1 };

            const filters = params?.filters || {};

            let statusFilter = {};
            if (params.activeTab) {
                statusFilter = { status: params.activeTab };
            }

            match = { ...match, ...commonFilters(filters), ...statusFilter };

        
            const page: number = params?.page || global.PAGE;
            const limit: number = params?.limit || global.LIMIT;
            const skip: number = (page - 1) * limit;

            const total = await this.callRequestModel.countDocuments(match);

            const result = await this.callRequestModel.find(match)
                .sort(sorting)
                .skip(skip)
                .limit(limit)
                .exec();

            const enhancedResult = result.map((item: any) => {
                let timeDifference: string | null = null;
                let createdAt: Date = new Date(item.created_at);
                let closedDate: Date = item.closed_date ? new Date(item.closed_date) : new Date();

                if (createdAt && closedDate && !isNaN(closedDate.getTime())) {
                    let timeDifferenceInMillis = closedDate.getTime() - createdAt.getTime();
                    let timeDifferenceInMinutes = Math.floor(timeDifferenceInMillis / 1000 / 60);

                    const days = Math.floor(timeDifferenceInMinutes / 1440);
                    const hours = Math.floor((timeDifferenceInMinutes % 1440) / 60);
                    const minutes = timeDifferenceInMinutes % 60;
                    let timeStr = '';
                    if (days > 0) timeStr += `${days} day${days > 1 ? 's' : ''} `;
                    if (hours > 0) timeStr += `${hours} hr${hours > 1 ? 's' : ''} `;
                    if (minutes > 0 || (days === 0 && hours === 0)) timeStr += `${minutes} min`;

                    timeDifference = timeStr.trim();
                }

                return {
                    ...item.toObject(),
                    tat: timeDifference || 'N/A',
                };
            });

            return this.res.pagination(enhancedResult, total, page, limit);
        } catch (error) {
            console.error('Error reading data:', error);
            return this.res.error(HttpStatus.BAD_REQUEST, 'ERROR.BAD_REQ', error);
        }
    }

    async graph(req: Request, params: any): Promise<any> {
        try {
            const orgId = req['user']['org_id'];
            const match: any = { is_delete: 0, org_id: orgId };

            const statusAggregation = [
                { $match: match },
                { $group: { _id: "$status", count: { $sum: 1 } } },
                { $project: { status: "$_id", count: 1, _id: 0 } }
            ];
            const status = await this.callRequestModel.aggregate(statusAggregation);

            const subStatusAggregation = [
                { $match: { ...match, sub_status: { $ne: null } } },
                { $group: { _id: "$sub_status", count: { $sum: 1 } } },
                { $project: { sub_status: "$_id", count: 1, _id: 0 } }
            ];
            const sub_status = await this.callRequestModel.aggregate(subStatusAggregation);

            const stateAggregation = [
                { $match: match },
                { $group: { _id: "$state", count: { $sum: 1 } } },
                { $project: { state: "$_id", count: 1, _id: 0 } }
            ];
            const state = await this.callRequestModel.aggregate(stateAggregation);

            const finalData = {
                status,
                sub_status,
                state_data: state
            };

            return this.res.success('SUCCESS.FETCH', finalData);

        } catch (error) {
            return this.res.error(HttpStatus.BAD_REQUEST, 'ERROR.BAD_REQ', error);
        }
    }

    async graphMonthWise(req: Request, params: any): Promise<any> {
        try {
            let match: any = { is_delete: 0, org_id: req['user']['org_id'] };

            const sixMonthsAgo = new Date();
            sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
            match.created_at = { $gte: sixMonthsAgo };

            const monthNames = global.MONTH_ARRAY;

            const aggregationPipeline = [
                { $match: match },
                {
                    $project: {
                        status: 1,
                        sub_status: 1,
                        month: { $month: "$created_at" },
                        year: { $year: "$created_at" }
                    }
                },
                {
                    $group: {
                        _id: { month: "$month", year: "$year", sub_status: "$sub_status" },
                        count: { $sum: 1 }
                    }
                },
                {
                    $group: {
                        _id: { month: "$_id.month", year: "$_id.year" },
                        sub_status: {
                            $push: { sub_status: "$_id.sub_status", count: "$count" }
                        },
                        total_count: { $sum: "$count" }
                    }
                },
                {
                    $project: {
                        month: "$_id.month",
                        year: "$_id.year",
                        sub_status: {
                            $map: {
                                input: "$sub_status",
                                as: "status",
                                in: {
                                    k: {
                                        $ifNull: ["$$status.sub_status", "Unknown"]
                                    },
                                    v: "$$status.count"
                                }
                            }
                        },
                        total_count: 1
                    }
                },
                {
                    $project: {
                        month: 1,
                        year: 1,
                        sub_status: {
                            $arrayToObject: {
                                $map: {
                                    input: "$sub_status",
                                    as: "status",
                                    in: ["$$status.k", "$$status.v"]
                                }
                            }
                        },
                        total_count: 1
                    }
                }
            ];

            const result = await this.callRequestModel.aggregate(aggregationPipeline);
            const total = await this.callRequestModel.countDocuments(match);

            const months = [];
            for (let i = 0; i < 6; i++) {
                const date = new Date();
                date.setMonth(date.getMonth() - i);
                const month = date.getMonth();
                const year = date.getFullYear();
                months.push({ month, year });
            }

            const formattedResult = months.map(monthInfo => {
                const matchingMonthData = result.find(item => item.month === monthInfo.month + 1 && item.year === monthInfo.year);

                return {
                    month_name: monthNames[monthInfo.month],
                    year: monthInfo.year,
                    sub_status: matchingMonthData ? matchingMonthData.sub_status : {}
                };
            });

            const subStatusNames = new Set<string>();
            formattedResult.forEach(item => {
                Object.keys(item.sub_status).forEach((status: string) => {
                    subStatusNames.add(status);
                });
            });

            const series = Array.from(subStatusNames).map(status => {
                if (!status.trim()) return null;
                const data = formattedResult.map(item => item.sub_status[status] || 0);
                return {
                    name: status,
                    type: 'bar',
                    data: data
                };
            }).filter(item => item !== null);

            const monthsFormatted = formattedResult.map(item => item.month_name);

            return this.res.success('SUCCESS.FETCH', {
                result: {
                    series: series,
                    month: monthsFormatted
                },
                count: total
            });

        } catch (error) {
            return this.res.error(HttpStatus.BAD_REQUEST, 'ERROR.BAD_REQ', error);
        }
    }

    async update(req: Request, params: any): Promise<any> {
        try {
            const exist = await this.callRequestModel.findById(toObjectId(params._id)).exec();
            if (!exist) {
                return this.res.error(HttpStatus.BAD_REQUEST, 'ERROR.BAD_REQ', 'Record not found with given id.');
            }

            const updateObj = {
                ...req['updateObj'],
                ...params,
            };
            if (params.status === global.CALL_REQUEST[2]) {
                updateObj.closed_date = Date.now();
            }

            await this.callRequestModel.updateOne(
                { _id: params._id },
                { $set: updateObj }
            );

            return this.res.success('SUCCESS.UPDATE');
        } catch (error) {
            return this.res.error(HttpStatus.BAD_REQUEST, 'ERROR.BAD_REQ', error);
        }
    }
}