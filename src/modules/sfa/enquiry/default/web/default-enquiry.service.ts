import { HttpStatus, Injectable } from '@nestjs/common';
import { ResponseService } from 'src/services/response.service';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { DropdownService } from 'src/modules/master/dropdown/web/dropdown.service';
import { S3Service } from 'src/shared/rpc/s3.service';
import { SharedUserService } from 'src/modules/master/user/shared-user.service';
import { calculatePercentage, commonFilters, eMatch, Like, nextSeq, tat, toObjectId } from 'src/common/utils/common.utils';
import { EnquiryModel, EnquiryStatus } from '../models/enquiry.model';
import { EnquiryDocsModel } from '../models/enquiry-docs.model';
import { EnquiryStageModel } from '../models/enquiry-stage.model';
import { SharedActivityService } from 'src/modules/sfa/activity/shared-activity.service';
import { EnquiryStrategy } from '../../enquiry-strategy.interface';
import { FollowupModel } from 'src/modules/sfa/followup/models/followup.model';

@Injectable()
export class DefaultEnquiryService implements EnquiryStrategy {
    constructor
        (
            @InjectModel(EnquiryModel.name) private enquiryModel: Model<EnquiryModel>,
            @InjectModel(EnquiryDocsModel.name) private enquiryDocsModel: Model<EnquiryDocsModel>,
            @InjectModel(EnquiryStageModel.name) private enquiryStageModel: Model<EnquiryStageModel>,
            @InjectModel(FollowupModel.name) private followupModel: Model<FollowupModel>,
            private readonly res: ResponseService,
            private readonly dropdownService: DropdownService,
            private readonly s3Service: S3Service,
            private readonly sharedUserService: SharedUserService,
            private readonly sharedActivityService: SharedActivityService
        ) { }

    async createEnquiry(req: Request, params: any): Promise<any> {
        try {
            const orgId: number = req['user']['org_id'];
            params.org_id = orgId;
            if (params?.assigned_to_user_id) {
                params.assigned_to_user_id = toObjectId(params.assigned_to_user_id);
                params.assigned_to_user_name = params.assigned_to_user_name;
                params.assigned_date = new Date();
            } else {
                params.assigned_to_user_id = toObjectId(req['user']['_id']);
                params.assigned_to_user_name = req['user']['name'];
                params.assigned_date = new Date();
            }

            if (params?.visit_activity_id) params.visit_activity_id = toObjectId(params.visit_activity_id)

            const seq = {
                modelName: this.enquiryModel,
                idKey: 'enquiry_id',
                prefix: 'ENQ'
            }
            const newEnquiryId = await nextSeq(req, seq)
            params.enquiry_id = newEnquiryId;
            params.status = EnquiryStatus.ASSIGNED

            const saveObj: Record<string, any> = {
                ...req['createObj'],
                ...params
            };
            const document = new this.enquiryModel(saveObj);
            const insert = await document.save();
            if (!insert || !insert._id) {
                return this.res.error(HttpStatus.BAD_REQUEST, 'ERROR.BAD_REQ');
            }
            return this.res.success('SUCCESS.CREATE', { inserted_id: insert._id });
        } catch (error) {
            return this.res.error(HttpStatus.BAD_REQUEST, 'ERROR.BAD_REQ', error);
        }
    }

    async upload(files: Express.Multer.File[], req: any): Promise<any> {
        try {
            req.body.module_name = Object.keys(global.MODULES).find(
                key => global.MODULES[key] === global.MODULES['Enquiry']
            );
            let response = await this.s3Service.uploadMultiple(files, req, this.enquiryDocsModel);
            return this.res.success('SUCCESS.CREATE', response);
        } catch (error) {
            return this.res.error(HttpStatus.BAD_REQUEST, 'Error uploading files to S3', error?.message || error
            );
        }
    }

    async getDocument(
        id: any,
        type: typeof global.FULL_IMAGE | typeof global.THUMBNAIL_IMAGE | typeof global.BIG_THUMBNAIL_IMAGE = global.FULL_IMAGE
    ): Promise<any> {
        return this.s3Service.getDocumentsByRowId(this.enquiryDocsModel, id, type);
    }

    async getDocumentByDocsId(req: any, params: any): Promise<any> {
        const doc = await this.s3Service.getDocumentsById(this.enquiryDocsModel, params._id);
        return this.res.success('SUCCESS.FETCH', doc);
    }

    async getAllEnquiries(req: Request, params: any): Promise<any> {
        try {
            let match: Record<string, any> = { is_delete: 0, org_id: req['user']['org_id'] };
            let sorting: Record<string, 1 | -1> = { _id: -1 };

            if (params?.sorting && typeof params.sorting === 'object' && Object.keys(params.sorting).length !== 0) {
                sorting = params.sorting;
            }

            if (params.activeTab) {
                const activeTab = params.activeTab;
                const activeSubTab = params.activeSubTab;

                if (activeTab == EnquiryStatus.PENDING) {
                    match.status = EnquiryStatus.PENDING;
                } else if (activeTab == EnquiryStatus.INPROCESS) {
                    match.status = activeSubTab == EnquiryStatus.NOT_ASSIGNED ? EnquiryStatus.NOT_ASSIGNED : EnquiryStatus.ASSIGNED;
                } else if (activeTab == EnquiryStatus.CLOSE) {
                    if ([EnquiryStatus.LOST, EnquiryStatus.DROP, EnquiryStatus.JUNK].includes(activeSubTab)) {
                        match.status = activeSubTab;
                    }
                } else if (activeTab == EnquiryStatus.WIN) {
                    match.status = EnquiryStatus.WIN
                }
            }

            Object.assign(match, commonFilters(params.filters))

            const statusMatch: Record<string, any> = {
                is_delete: 0, org_id: req['user']['org_id']
            }

            if (global.LOGIN_TYPE_ID_PERMISSION?.includes(req['user']['login_type_id'])) {
                const userIds = await this.sharedUserService.getUsersIds(req, params);
                match.$or = [
                    { assigned_to_user_id: { $in: userIds } },
                    { created_id: { $in: userIds } }
                ];
                statusMatch.$or = [
                    { assigned_to_user_id: { $in: userIds } },
                    { created_id: { $in: userIds } }
                ];
            }

            const page: number = parseInt(params?.page) || global.PAGE;
            const limit: number = parseInt(params?.limit) || global.LIMIT;
            const skip: number = (page - 1) * limit;

            const mainPipeline = [
                { $match: match },
                { $sort: sorting },
            ];

            const statusAggregation: any = await this.enquiryModel.aggregate([
                { $match: statusMatch },
                {
                    $group: {
                        _id: "$status",
                        count: { $sum: 1 }
                    }
                }
            ]);

            let defaultStatusCounts: Record<string, number> = {
                "Review Pending": 0,
                "Not Assigned": 0,
                "Assigned": 0,
                "Lost": 0,
                "Drop": 0,
                "Junk & Close": 0,
                "Win": 0
            };

            statusAggregation.forEach((item) => {
                if (defaultStatusCounts.hasOwnProperty(item._id)) {
                    defaultStatusCounts[item._id] = item.count;
                }
            });

            defaultStatusCounts = Object.fromEntries(
                Object.entries(defaultStatusCounts).map(([key, value]) => [
                    key.toLowerCase().replace(/\s+/g, "_").replace("&", "and"),
                    value
                ])
            );

            const totalCountData: any = await this.enquiryModel.aggregate([
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
                tabCounts: defaultStatusCounts
            };

            return this.res.pagination(finalData, total, page, limit);
        } catch (error) {
            return this.res.error(HttpStatus.BAD_REQUEST, 'ERROR.BAD_REQ', error);
        }
    }

    async detail(req: Request, params: any): Promise<any> {
        try {
            const exist = await this.enquiryModel.findOne({ _id: params._id }).exec();
            if (!exist) return this.res.error(HttpStatus.BAD_REQUEST, 'WARNING.NOT_EXIST');

            let match: Record<string, any> = { is_delete: 0, org_id: req['user']['org_id'], _id: params._id };
            let result = await this.enquiryModel.findOne(match).lean() as Record<string, any>;
            if (result) {
                params.module_id = global.MODULES['Enquiry'];
                params.dropdown_name = global.DROPDOWNS[1];
                params.internalCall = true;
                let stages = await this.dropdownService.readDropdown(req, params);
                result.stages = await Promise.all(
                    stages.map(async (row: any) => {
                        const stageExist = await this.enquiryStageModel.findOne({
                            enquiry_id: toObjectId(params._id),
                            stage: row.label
                        }).lean();

                        return {
                            [row.label]: stageExist ? !!stageExist['checked'] : false
                        };
                    })
                );

                const upcomingFollowup: Record<string, any> = await this.followupModel.findOne({
                    category_type: "Enquiry",
                    category_id: toObjectId(params._id),
                    followup_date: { $gte: new Date() },
                    is_delete: 0
                }).sort({ followup_date: 1 }).lean();

                if (upcomingFollowup) {
                    const tat_days = tat(new Date(), upcomingFollowup['followup_date']);
                    upcomingFollowup.tat_days = tat_days;
                    result.upcoming_followup = upcomingFollowup;
                } else {
                    result.upcoming_followup = null;
                }

                /****************************************/
                let latestVisit = null; let latestCall = null;

                latestVisit = await this.sharedActivityService.fetchLatestVisitForEnquiry(req, params);
                if (latestVisit) {
                    latestVisit = { ...latestVisit, visit_type: 'visit' };
                }

                latestVisit = await this.sharedActivityService.fetchLatestCallForEnquiry(req, params);
                if (latestCall) {
                    latestCall = { ...latestCall, visit_type: 'call' };
                }

                if (latestVisit || latestCall) {
                    let lastActivity = null;

                    if (!latestVisit) {
                        lastActivity = latestCall;
                    } else if (!latestCall) {
                        lastActivity = latestVisit;
                    } else {
                        const visitDate = new Date(latestVisit.activity_date);
                        const callDate = new Date(latestCall.activity_date);
                        lastActivity = visitDate > callDate ? latestVisit : latestCall;
                    }
                    const tat_days = tat(new Date(lastActivity.activity_date), new Date());
                    lastActivity.tat_days = tat_days;
                    result.last_activity = lastActivity;
                } else {
                    result.last_activity = null;
                }
                result.files = await this.getDocument(result._id, global.THUMBNAIL_IMAGE)
            }
            return this.res.success('SUCCESS.FETCH', result);
        } catch (error) {
            return this.res.error(HttpStatus.BAD_REQUEST, 'ERROR.BAD_REQ', error);
        }
    }

    async updateEnquiry(req: Request, params: any): Promise<any> {
        try {
            const { _id } = params;
            const exist = await this.enquiryModel.findOne({ _id }).lean();
            if (!exist) {
                return this.res.error(HttpStatus.BAD_REQUEST, 'WARNING.NOT_EXIST');
            }
            if (params?.assigned_to_user_id) {
                params.assigned_to_user_id = toObjectId(params.assigned_to_user_id);
                params.assigned_to_user_name = params.assigned_to_user_name;
            } else {
                params.assigned_to_user_id = toObjectId(req['user']['_id']);
                params.assigned_to_user_name = req['user']['name'];
            }
            params.assigned_date = new Date();
            if (params?.visit_activity_id) {
                params.visit_activity_id = toObjectId(params.visit_activity_id);
            }
            params.org_id = req['user']['org_id'];

            const updateObj: Record<string, any> = {
                ...req['updateObj'],
                ...params,
            };

            const result = await this.enquiryModel.updateOne({ _id }, updateObj);
            if (result.modifiedCount === 0) {
                return this.res.error(HttpStatus.BAD_REQUEST, 'ERROR.UPDATE_FAILED');
            }
            return this.res.success('SUCCESS.UPDATE', { updated_id: _id });
        } catch (error) {
            return this.res.error(HttpStatus.BAD_REQUEST, 'ERROR.BAD_REQ', error);
        }
    }

    async statusUpdate(req: Request, params: any): Promise<any> {
        try {
            const exist = await this.enquiryModel.findOne({ _id: params._id }).exec();
            if (!exist) return this.res.error(HttpStatus.BAD_REQUEST, 'WARNING.NOT_EXIST');

            const updateObj: Record<string, any> = {
                ...req['updateObj'],
                ...params,
            };

            const updatedDocument = await this.enquiryModel.updateOne(
                { _id: params._id },
                updateObj
            );
            if (!updatedDocument) return this.res.error(HttpStatus.BAD_REQUEST, 'ERROR.UPDATE_FAILED');
            return this.res.success('SUCCESS.STATUS_UPDATE');
        } catch (error) {
            return this.res.error(HttpStatus.BAD_REQUEST, 'ERROR.BAD_REQ', error);
        }
    }

    async saveStage(req: Request, params: any): Promise<any> {
        try {
            let match: Record<string, any> = {
                is_delete: 0,
                org_id: req['user']['org_id'],
                enquiry_id: toObjectId(params.enquiry_id),
                stage: eMatch(params.stage)
            };
            const existingStage = await this.enquiryStageModel.findOne(match);
            if (existingStage) {
                const updateObj: Record<string, any> = {
                    ...req['updateObj'],
                    ...params,
                };
                const updatedDocument = await this.enquiryStageModel.updateOne(
                    { _id: existingStage._id },
                    updateObj
                );
                if (!updatedDocument) return this.res.error(HttpStatus.BAD_REQUEST, 'ERROR.UPDATE_FAILED');
                return this.res.success('ENQUIRY.STAGE_UPDATE');
            } else {
                params.enquiry_id = toObjectId(params.enquiry_id)
                const saveObj: Record<string, any> = {
                    ...req['createObj'],
                    ...params
                };
                const document = new this.enquiryStageModel(saveObj);
                const insert = await document.save();
                if (!insert || !insert._id) {
                    return this.res.error(HttpStatus.BAD_REQUEST, 'ERROR.BAD_REQ');
                }
                return this.res.success('ENQUIRY.STAGE_UPDATE');
            }
        } catch (error) {
            return this.res.error(HttpStatus.BAD_REQUEST, 'ERROR.BAD_REQ', error);
        }
    }

    async activities(req: Request, params: any): Promise<any> {
        try {
            const visitActivities = await this.sharedActivityService.fetchVisitActivities(req, params);
            const callActivities = await this.sharedActivityService.fetchCallActivities(req, params);

            const taggedVisitActivities = visitActivities.map(activity => ({
                ...activity,
                type: 'visit'
            }));

            const taggedCallActivities = callActivities.map(activity => ({
                ...activity,
                type: 'call'
            }));

            const result = [...taggedVisitActivities, ...taggedCallActivities];
            result.sort((a, b) => new Date(a.activity_date).getTime() - new Date(b.activity_date).getTime());
            return this.res.success('SUCCESS.FETCH', result);
        } catch (error) {
            return this.res.error(HttpStatus.BAD_REQUEST, 'ERROR.BAD_REQ', error);
        }
    }

    async readEnquiry(req: Request, params: any): Promise<any> {
        try {
            let match: any = { is_delete: 0, org_id: req['user']['org_id'] };
            let sorting: Record<string, 1 | -1> = { _id: -1 };
            if (params?.sorting && Object.keys(params.sorting).length !== 0) sorting = params.sorting;
            if (params?.filter) {
                Object.keys(params.filter).forEach(key => {
                    if (params.filter[key]) {
                        match[key] = Like(params.filter[key])
                    }
                });
            }
            let limit = global.OPTIONS_LIMIT
            if (params?.limit) limit = params.limit;
            let data: any = await this.enquiryModel.find(match, { name: 1 }).sort(sorting).limit(limit)
            data = data.map((row: any) => {
                return {
                    label: row.name,
                    value: row._id,
                    module_id: global.MODULES['Enquiry'],
                    module_name: Object.keys(global.MODULES).find(key => global.MODULES[key] === global.MODULES['Enquiry'])
                }
            })
            return this.res.success('SUCCESS.FETCH', data);
        } catch (error) {
            return this.res.error(HttpStatus.BAD_REQUEST, 'ERROR.BAD_REQ', error);
        }
    }

    async enquiryDashboard(req: Request, params: any): Promise<any> {
        try {
            const matchBase = {
                is_delete: 0,
                $or: [
                    { assigned_to_user_id: req['user']['_id'] },
                    { created_id: req['user']['_id'] }
                ],
                org_id: req['user']['org_id'],
            };

            const [result] = await this.enquiryModel.aggregate([
                { $match: matchBase },
                {
                    $group: {
                        _id: null,
                        total: { $sum: 1 },
                        win: {
                            $sum: {
                                $cond: [{ $eq: ["$status", EnquiryStatus.WIN] }, 1, 0]
                            }
                        },
                        last_win_updated_at: {
                            $max: {
                                $cond: [
                                    { $eq: ["$status", EnquiryStatus.WIN] },
                                    "$updated_at",
                                    null
                                ]
                            }
                        }
                    }
                }
            ]);
            const total = result?.total || 0
            const win = result?.win || 0
            const lastUpdatedAt = result?.last_win_updated_at;
            let tatOf = '0 days';
            if (lastUpdatedAt) tatOf = tat(lastUpdatedAt, new Date());
            return {
                total,
                win,
                progress: calculatePercentage(win, total),
                tat: tatOf
            };
        } catch (error) {
            throw error;
        }
    }
}
