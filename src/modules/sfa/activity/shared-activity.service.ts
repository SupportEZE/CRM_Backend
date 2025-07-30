import { Injectable, HttpStatus } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { ResponseService } from 'src/services/response.service';
import { convertToUtcRange, parseTat, tat, toObjectId } from 'src/common/utils/common.utils';
import { Model, Types } from 'mongoose';
import { COLLECTION_CONST } from 'src/config/collection.constant';
import { S3Service } from 'src/shared/rpc/s3.service';
import { ActivityDocsModel } from './models/activity-docs.model';
import { VisitActivityModel } from './models/visit-activity.model';
import { SharedUserService } from 'src/modules/master/user/shared-user.service';
import { CallActivityModel } from './models/call-activity.model';

enum VisitType {
    VISITOR = 'visitor',
    CUSTOMER_TYPE = 'customer_type',
    STATE = 'state',
    BEAT_CODE = 'beat_code'
}
@Injectable()
export class SharedActivityService {
    constructor(
        @InjectModel(ActivityDocsModel.name) private activityDocsModel: Model<ActivityDocsModel>,
        @InjectModel(VisitActivityModel.name) private visitActivityModel: Model<VisitActivityModel>,
        @InjectModel(CallActivityModel.name) private callActivityModel: Model<CallActivityModel>,
        private readonly res: ResponseService,
        private readonly s3Service: S3Service,
        private readonly sharedUserService: SharedUserService,
    ) { }

    async getGroupStage(
        req: Request,
        type: string,
        users: Types.ObjectId[],
        customers: Types.ObjectId[],
        start: Date,
        end: Date
    ): Promise<any> {
        const baseMatch: Record<string, any> = {
            is_delete: 0,
            org_id: req['user']['org_id'],
            created_at: { $gte: start, $lte: end }
        };

        if (type === VisitType.VISITOR && users.length) {
            baseMatch.user_id = { $in: users };
        }

        if (
            [VisitType.CUSTOMER_TYPE, VisitType.STATE, VisitType.BEAT_CODE].includes(type as VisitType) &&
            customers.length
        ) {
            baseMatch.customer_id = { $in: customers };
        }

        switch (type) {
            case VisitType.VISITOR:
                return [
                    {
                        $lookup: {
                            from: COLLECTION_CONST().CRM_USERS,
                            localField: 'user_id',
                            foreignField: '_id',
                            as: 'user_info'
                        }
                    },
                    { $unwind: { path: '$user_info', preserveNullAndEmptyArrays: true } },
                    {
                        $match: {
                            user_id: { $ne: null },
                            ...baseMatch
                        }
                    },
                    {
                        $group: {
                            _id: "$user_id",
                            user_name: { $first: "$user_info.name" },
                            count: { $sum: 1 }
                        }
                    }
                ];

            case VisitType.CUSTOMER_TYPE:
                return [
                    {
                        $match: {
                            "customer_details.customer_type_name": { $ne: null },
                            ...baseMatch
                        }
                    },
                    {
                        $group: {
                            _id: "$customer_details.customer_type_name",
                            customer_type_name: { $first: "$customer_details.customer_type_name" },
                            count: { $sum: 1 }
                        }
                    }
                ];

            case VisitType.STATE:
                return [
                    {
                        $match: {
                            "customer_details.state": { $ne: null },
                            ...baseMatch
                        }
                    },
                    {
                        $group: {
                            _id: "$customer_details.state",
                            state: { $first: "$customer_details.state" },
                            count: { $sum: 1 }
                        }
                    }
                ];

            case VisitType.BEAT_CODE:
                return [
                    {
                        $match: {
                            "customer_details.beat_code": { $ne: null },
                            ...baseMatch
                        }
                    },
                    {
                        $group: {
                            _id: "$customer_details.beat_code",
                            beat_code: { $first: "$customer_details.beat_code" },
                            beat_code_desc: { $first: "$customer_details.beat_code_desc" },
                            count: { $sum: 1 }
                        }
                    }
                ];

            default:
                return [];
        }
    }
    async getAggregationPipeline(req: Request, type: string, users: Types.ObjectId[], customers: Types.ObjectId[], start, end): Promise<any> {
        const groupStage = await this.getGroupStage(req, type, users, customers, start, end);
        return [
            ...groupStage,
            { $sort: { count: -1 } }
        ];
    }
    visitLookupForCustomer(req: Request, params: any) {
        const { start, end } = params
        const orgId: number = req['user']['org_id'];
        const userId: any = req['user']['_id']
        return {
            $lookup: {
                from: COLLECTION_CONST().CRM_VISIT_ACTIVITY,
                let: { cid: '$customer_info._id' },
                pipeline: [
                    {
                        $match: {
                            $expr: {
                                $and: [
                                    { $eq: ['$is_delete', 0] },
                                    { $eq: ['$org_id', orgId] },
                                    { $eq: ['$user_id', userId] },
                                    { $eq: ['$customer_id', '$$cid'] },
                                    { $gte: ['$activity_date', start] },
                                    { $lte: ['$activity_date', end] }
                                ]
                            }
                        }
                    }
                ],
                as: 'visit_logs'
            }
        };
    }
    async checkinData(req: Request, params: any): Promise<any> {
        try {
            const match: Record<string, any> = {
                is_delete: 0,
                org_id: req['user']['org_id'],
                activity_date: {
                    $gte: params.start,
                    $lte: params.end
                },
                user_id: params.user_id
            };

            const count: number = await this.visitActivityModel.countDocuments(match);
            const records = await this.visitActivityModel.find(match, { avarage_meeting_time: 1 }).lean();

            let totalSeconds = 0;

            for (const record of records) {
                const timeStr = record.avarage_meeting_time || "";
                totalSeconds += parseTat(timeStr);
            }
            const avgMin = totalSeconds * 60
            return {
                avgMin,
                count
            }
        } catch (error) {
            throw error;
        }
    }
    async customerLastVisit(req: Request, params: any): Promise<any> {
        try {
            const match: Record<string, any> = {
                visit_end: { $exists: true },
                is_delete: 0,
                org_id: req['user']['org_id']
            }
            if (Array.isArray(params.customer_id)) match.customer_id = { $in: params.customer_id }
            else match.customer_id = params.customer_id
            const projection: Record<string, any> = {
                activity_date: 1,
                customer_id: 1
            }
            if (params?.user_id) match.user_id = params.user_id
            let data: Record<string, any>[] = await this.visitActivityModel.find(match, projection).sort({ _id: -1 }).lean();
            data = data.map((row: any) => {
                return {
                    ...row,
                    tat: tat(new Date(), row.activity_date, global.TAT_UNIT[1])
                }
            })

            return data;
        } catch (error) {
            throw error
        }
    }


    async getDocument(
        id: any,
        type: typeof global.FULL_IMAGE | typeof global.THUMBNAIL_IMAGE | typeof global.BIG_THUMBNAIL_IMAGE = global.FULL_IMAGE
    ): Promise<any> {
        return this.s3Service.getDocumentsByRowId(this.activityDocsModel, id, type);
    }

    async getDocumentByDocsId(req: any, params: any): Promise<any> {
        const doc = await this.s3Service.getDocumentsById(this.activityDocsModel, params._id);
        return this.res.success('SUCCESS.FETCH', doc);
    }

    async fetchLatestVisitForEnquiry(req: Request, params: any): Promise<any> {
        const latestVisit = await this.visitActivityModel
            .findOne({ module_id: global.MODULES['Enquiry'], customer_id: toObjectId(params._id) })
            .sort({ activity_date: -1 })
            .lean();
        return latestVisit
    }

    async fetchLatestCallForEnquiry(req: Request, params: any): Promise<any> {
        const latestCall = await this.callActivityModel
            .findOne({ module_id: global.MODULES['Enquiry'], customer_id: toObjectId(params._id) })
            .sort({ activity_date: -1 })
            .lean();
        return latestCall
    }
    async fetchLatestVisitForCustomer(req: Request, params: any): Promise<any> {
        const latestVisit = await this.visitActivityModel
          .findOne({
            module_id: global.MODULES['Customers'], // Use the correct module ID, e.g., 4 if defined
            customer_id: toObjectId(params._id)
          })
          .sort({ activity_date: -1 })
          .lean();
      
        return latestVisit;
      }
      async fetchLatestCallForCustomer(req: Request, params: any): Promise<any> {
        const latestCall = await this.callActivityModel
          .findOne({
            module_id: global.MODULES['Customers'], // Use the correct module ID, e.g., 4 if defined
            customer_id: toObjectId(params._id)
          })
          .sort({ activity_date: -1 })
          .lean();
      
        return latestCall;
      }
    async fetchVisitActivities(req: Request, params: any): Promise<any> {
        const match: Record<string, any> = {
            is_delete: 0,
            org_id: req['user']['org_id'],
            module_id: global.MODULES['Enquiry'],
            customer_id: toObjectId(params.enquiry_id)
        };
        const visitActivities = await this.visitActivityModel.find(match).lean();
        return visitActivities
    }

    async fetchCallActivities(req: Request, params: any): Promise<any> {
        const match: Record<string, any> = {
            is_delete: 0,
            org_id: req['user']['org_id'],
            module_id: global.MODULES['Enquiry'],
            customer_id: toObjectId(params.enquiry_id)
        };
        const callActivities = await this.callActivityModel.find(match).lean();
        return callActivities
    }

    async todayActivityData(req: Request, params: any): Promise<any> {
        try {
            const { start, end } = convertToUtcRange(new Date());
            const match: Record<string, any> = {
                is_delete: 0,
                org_id: req['user']['org_id'],
                created_id: req['user']['_id'],
                activity_date: {
                    $gte: start,
                    $lte: end
                },
                visit_end: { $exists: true },
                customer_id: { $in: params?.customer_ids || [] }
            };
            const [result] = await this.visitActivityModel.aggregate([
                { $match: match },
                {
                    $group: {
                        _id: null,
                        total_count: { $sum: 1 },
                        last_activity: { $max: "$created_at" }
                    }
                }
            ]);

            return {
                total_count: result?.total_count || 0,
                last_activity: result?.last_activity || null
            };

        } catch (error) {
            throw error
        }

    }
}