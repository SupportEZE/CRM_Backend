import { HttpStatus, Injectable } from '@nestjs/common';
import { ResponseService } from 'src/services/response.service';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { appCommonFilters, toObjectId } from 'src/common/utils/common.utils';
import { EnquiryStrategy } from '../../enquiry-strategy.interface';
import { EnquiryModel, EnquiryStatus } from '../models/enquiry.model';
import { EnquiryDocsModel } from '../models/enquiry-docs.model';
import { EnquiryStageModel } from '../models/enquiry-stage.model';
import { UserHierarchyModel } from 'src/modules/master/user/models/user-hierarchy.model';

@Injectable()
export class AppDefaultEnquiryService implements EnquiryStrategy {
    constructor
        (
            @InjectModel(EnquiryModel.name) private enquiryModel: Model<EnquiryModel>,
            @InjectModel(EnquiryDocsModel.name) private enquiryDocsModel: Model<EnquiryDocsModel>,
            @InjectModel(EnquiryStageModel.name) private enquiryStageModel: Model<EnquiryStageModel>,
            @InjectModel(UserHierarchyModel.name) private userHierarchyModel: Model<UserHierarchyModel>,
            private readonly res: ResponseService
        ) { }

    async getAllEnquiries(req: Request, params: any): Promise<any> {
        try {
            let userId = toObjectId(req['user']['_id']);
            let orgId = req['user']['org_id'];
            let match: Record<string, any> = {
                is_delete: 0,
                org_id: orgId,
                $or: [
                    { assigned_to_user_id: userId },
                    { created_id: userId }
                ]
            };

            let sorting: Record<string, 1 | -1> = { _id: -1 };
            if (params?.sorting && typeof params.sorting === 'object' && Object.keys(params.sorting).length !== 0) {
                sorting = params.sorting;
            }

            if (params?.activeTab) {
                const activeTab = params.activeTab;
                if (activeTab === EnquiryStatus.INPROCESS) {
                    match.status = { $in: [EnquiryStatus.INPROCESS, EnquiryStatus.ASSIGNED, EnquiryStatus.NOT_ASSIGNED] };
                } else if (activeTab === EnquiryStatus.CLOSE) {
                    match.status = { $in: [EnquiryStatus.JUNK, EnquiryStatus.DROP, EnquiryStatus.LOST] };
                } else if (activeTab === EnquiryStatus.WIN) {
                    match.status = EnquiryStatus.WIN;
                }
            }

            if (params?.filters?.search) {
                const fieldsToSearch = ["enquiry_id", "enquiry_type", "enquiry_source", "name", "mobile", "status", "assigned_to_user_name"];
                const searchQuery = appCommonFilters(params.filters, fieldsToSearch);
                match = { ...match, ...searchQuery };
            }

            const page: number = parseInt(params?.page) || global.PAGE;
            const limit: number = parseInt(params?.limit) || global.LIMIT;
            const skip: number = (page - 1) * limit;

            const mainPipeline = [
                { $match: match },
                { $sort: sorting },
                { $project: { created_unix_time: 0 } },
            ];

            const INPROCESS_STATUSES = [EnquiryStatus.INPROCESS, EnquiryStatus.ASSIGNED, EnquiryStatus.NOT_ASSIGNED];
            const CLOSE_STATUSES = [EnquiryStatus.JUNK, EnquiryStatus.DROP, EnquiryStatus.LOST];
            const WIN_STATUSES = [EnquiryStatus.WIN];

            let tabCounts: Record<string, number> = {
                Inprocess: 0,
                Close: 0,
                Win: 0
            };

            const statusAggregation = await this.enquiryModel.aggregate([
                {
                    $match: {
                        is_delete: 0,
                        org_id: orgId,
                        $or: [
                            { assigned_to_user_id: userId },
                            { created_id: userId }
                        ]
                    }
                },
                {
                    $group: {
                        _id: "$status",
                        count: { $sum: 1 }
                    }
                }
            ]);

            statusAggregation.forEach((item) => {
                if (INPROCESS_STATUSES.includes(item._id)) {
                    tabCounts.Inprocess += item.count;
                }
                if (CLOSE_STATUSES.includes(item._id)) {
                    tabCounts.Close += item.count;
                }
                if (WIN_STATUSES.includes(item._id)) {
                    tabCounts.Win += item.count;
                }
            });

            const totalCountData = await this.enquiryModel.aggregate([
                ...mainPipeline,
                { $count: "totalCount" },
            ]);

            const total: number = totalCountData.length > 0 ? totalCountData[0].totalCount : 0;
            let result: Record<string, any>[] = await this.enquiryModel.aggregate([
                ...mainPipeline,
                { $skip: skip },
                { $limit: limit },
            ]);

            const finalData: any = {
                result,
                tabCounts
            };
            return this.res.pagination(finalData, total, page, limit);
        } catch (error) {
            return this.res.error(HttpStatus.BAD_REQUEST, 'ERROR.BAD_REQ', error.message);
        }
    }

    async assignUserList(req: Request, params: any): Promise<any> {
        try {
            let match: Record<string, any>;
            let result: Record<string, any>[];
            match = {
                is_delete: 0,
                org_id: req['user']['org_id'],
                parent_user_id: req['user']['_id']
            };
            result = await this.userHierarchyModel.find(match, { child_user_id: 1, child_user_name: 1 }).lean()
            result = result.map((row: any) => {
                return {
                    label: row.child_user_name,
                    value: row.child_user_id
                }
            })
            result = [
                {
                    label: req['user']['name'],
                    value: req['user']['_id']
                },
                ...result
            ]
            return this.res.success('SUCCESS.FETCH', result)
        } catch (error) {
            return this.res.error(HttpStatus.BAD_REQUEST, 'ERROR.BAD_REQ', error)
        }
    }
}
