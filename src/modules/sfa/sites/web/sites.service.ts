import { HttpStatus, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { SitesModel, SitesStatus } from '../models/sites.model';
import { ResponseService } from 'src/services/response.service';
import { SitesStageModel } from '../models/sites-stage.model';
import { DropdownService } from 'src/modules/master/dropdown/web/dropdown.service';
import { toObjectId, commonFilters, eMatch, tat, Like, nextSeq } from 'src/common/utils/common.utils';
import { VisitActivityModel } from '../../activity/models/visit-activity.model';
import { CallActivityModel } from '../../activity/models/call-activity.model';
import { FollowupModel } from '../../followup/models/followup.model';
import { SitesDocsModel } from '../models/sites-docs.model';
import { S3Service } from 'src/shared/rpc/s3.service';
import { SitesContactModel } from '../models/sites-contact.model';

import { LocationService } from 'src/services/location.service';
import { SitesComptetorModel } from '../models/sites-competitor.model';
import { SharedUserService } from 'src/modules/master/user/shared-user.service';
import { QuotationModel } from '../../quotation/default/models/quotation.model';
@Injectable()
export class SitesService {
    constructor
        (
            @InjectModel(SitesModel.name) private siteprojectModel: Model<SitesModel>,
            @InjectModel(SitesStageModel.name) private siteprojectStageModel: Model<SitesStageModel>,
            @InjectModel(CallActivityModel.name) private callActivityModel: Model<CallActivityModel>,
            @InjectModel(VisitActivityModel.name) private visitActivityModel: Model<VisitActivityModel>,
            @InjectModel(FollowupModel.name) private followupModel: Model<FollowupModel>,
            @InjectModel(SitesDocsModel.name) private sitesDocsModel: Model<SitesDocsModel>,
            @InjectModel(SitesContactModel.name) private sitesContactModel: Model<SitesContactModel>,
            @InjectModel(QuotationModel.name) private quotationModel: Model<QuotationModel>,
            @InjectModel(SitesComptetorModel.name) private sitesComptetorModel: Model<SitesComptetorModel>,
            private readonly res: ResponseService,
            private readonly dropdownService: DropdownService,
            private readonly s3Service: S3Service,
            private readonly locationService: LocationService,
            private readonly sharedUserService: SharedUserService,
        ) { }

    async upload(files: Express.Multer.File[], req: any): Promise<any> {
        try {
            req.body.module_name = Object.keys(global.MODULES).find(
                key => global.MODULES[key] === global.MODULES['Site-Project']
            );
            let response = await this.s3Service.uploadMultiple(files, req, this.sitesDocsModel);
            return this.res.success('SUCCESS.CREATE', response);
        } catch (error) {
            return this.res.error(HttpStatus.BAD_REQUEST, 'Error uploading files to S3', error?.message || error
            );
        }
    }

    async deleteFile(ids: string[]): Promise<any> {
        try {
            await this.sitesDocsModel.updateMany(
                { _id: { $in: ids.map(id => toObjectId(id)) } },
                { $set: { is_delete: 1 } }
            );

            return this.res.success('SUCCESS.DELETE', { deleted_ids: ids });
        } catch (error) {
            return this.res.error(HttpStatus.BAD_REQUEST, 'ERROR.DELETE_FAILED', error?.message || error);
        }
    }

    async getDocument(
        id: any,
        type: typeof global.FULL_IMAGE | typeof global.THUMBNAIL_IMAGE | typeof global.BIG_THUMBNAIL_IMAGE = global.FULL_IMAGE
    ): Promise<any> {
        return this.s3Service.getDocumentsByRowId(this.sitesDocsModel, id, type);
    }

    async getDocumentByDocsId(req: any, params: any): Promise<any> {
        const doc = await this.s3Service.getDocumentsById(this.sitesDocsModel, params._id);
        return this.res.success('SUCCESS.FETCH', doc);
    }

    async create(req: Request, params: any): Promise<any> {
        try {

            if (req.url.includes(global.MODULE_ROUTES[9])) {
                params.assigned_to_user_id = req['user']['_id'];
                params.assigned_to_user_name = req['user']['name']
            } else {
                params.assigned_to_user_id = toObjectId(params.assigned_to_user_id);
            }
            params.assigned_date = new Date();
            params.status = SitesStatus.INPROCESS;

            const seq = {
                modelName: this.siteprojectModel,
                idKey: 'site_id',
                prefix: 'SITE'
            }

            const newSiteId = await nextSeq(req, seq)
            const saveObj: Record<string, any> = {
                ...req['createObj'],
                ...params,
                site_id: newSiteId,

            };
            const document = new this.siteprojectModel(saveObj);
            const insert = await document.save();
            if (!insert) return this.res.error(HttpStatus.BAD_REQUEST, 'ERROR.BAD_REQ');
            return this.res.success('SUCCESS.CREATE', { inserted_id: insert._id });
        } catch (error) {
            return this.res.error(HttpStatus.BAD_REQUEST, 'ERROR.BAD_REQ', error);
        }
    }


    async update(req: Request, params: any): Promise<any> {
        try {
            const exist: Record<string, any> = await this.siteprojectModel.findOne({ _id: params._id }).exec();
            if (!exist) return this.res.error(HttpStatus.NOT_FOUND, 'ERROR.NOT_FOUND');
            if (!req.url.includes(global.MODULE_ROUTES[9])) {
                params.org_id = req['user']['org_id'];
                params.assigned_user_id = toObjectId(params.assigned_user_id);
            }
            const updateObj: Record<string, any> = {
                ...req['updateObj'],
                ...params,
            };
            const updatedDocument = await this.siteprojectModel.updateOne(
                { _id: params._id },
                updateObj
            );
            if (!updatedDocument) return this.res.error(HttpStatus.BAD_REQUEST, 'ERROR.UPDATE_FAILED');
            return this.res.success('SUCCESS.UPDATE');
        } catch (error) {
            return this.res.error(HttpStatus.BAD_REQUEST, 'ERROR.BAD_REQ', error);
        }
    }

    async read(req: Request, params: any): Promise<any> {
        try {
            let match: Record<string, any> = { is_delete: 0, org_id: req['user']['org_id'] };
            let sorting: Record<string, 1 | -1> = { _id: -1 };

            if (params?.sorting && typeof params.sorting === 'object' && Object.keys(params.sorting).length !== 0) {
                sorting = params.sorting;
            }
            let filters: Record<string, any> = params?.filters ? commonFilters(params.filters) : {};
            if (params.activeTab) {
                const activeTab = params.activeTab;
                if (activeTab == SitesStatus.INPROCESS) {
                    match.status = SitesStatus.INPROCESS;
                } else if (activeTab == SitesStatus.LOST) {
                    match.status = SitesStatus.LOST;
                } else if (activeTab == SitesStatus.WIN) {
                    match.status = SitesStatus.WIN;
                }
            }

            match = { ...match, ...filters };

            if (global.LOGIN_TYPE_ID_PERMISSION?.includes(req['user']['login_type_id'])) {
                const userIds = await this.sharedUserService.getUsersIds(req, params);
                match.$or = [
                    { assigned_to_user_id: { $in: userIds } },
                    { created_id: { $in: userIds } }
                ];
            }
            const page: number = params?.page || global.PAGE;
            const limit: number = params?.limit || global.LIMIT;
            const skip: number = (page - 1) * limit;

            const result: Record<string, any>[] = await this.siteprojectModel
                .find(match)
                .sort(sorting)
                .skip(skip)
                .limit(limit)
                .lean();

            const inprocessCount = await this.siteprojectModel.countDocuments({ ...match, status: SitesStatus.INPROCESS });
            const lostCount = await this.siteprojectModel.countDocuments({ ...match, status: SitesStatus.LOST });
            const winCount = await this.siteprojectModel.countDocuments({ ...match, status: SitesStatus.WIN });

            const data: any = {
                result,
                tabCounts: { inprocces: inprocessCount, win: winCount, lost: lostCount },
            };

            let total = 0
            if (params.activeTab === SitesStatus.INPROCESS) {
                total = inprocessCount
            } else if (params.activeTab === SitesStatus.WIN) {
                total = lostCount;
            } else if (params.activeTab === SitesStatus.LOST) {
                total = lostCount;

            }
            return this.res.pagination(data, total, page, limit);
        } catch (error) {
            return this.res.error(HttpStatus.BAD_REQUEST, 'ERROR.BAD_REQ', error.message);
        }
    }

    async detail(req: Request, params: any): Promise<any> {
        try {
            const exist: Record<string, any> = await this.siteprojectModel.findOne({ _id: params._id }).exec();
            if (!exist) return this.res.error(HttpStatus.NOT_FOUND, 'ERROR.NOT_FOUND');

            let match: Record<string, any> = { is_delete: 0, org_id: req['user']['org_id'], _id: params._id };
            let result = await this.siteprojectModel.findOne(match).lean() as Record<string, any>;
            if (result) {
                const CompetitorDetail: Record<string, any>[] = await this.fethCompetitor(req, params);
                result.competitor = CompetitorDetail || [];

                const StageDetail: Record<string, any>[] = await this.fethStages(req, params);
                result.stages = StageDetail || [];

                const upcomingFollowup: Record<string, any> = await this.followupModel.findOne({
                    category_type: "Site",
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

                let latestVisit = null; let latestCall = null;
                latestVisit = await this.visitActivityModel
                    .findOne({ module_id: global.MODULES['Site-Project'], customer_id: toObjectId(params._id) })
                    .sort({ activity_date: -1 })
                    .lean();
                if (latestVisit) {
                    latestVisit = { ...latestVisit, visit_type: 'visit' };
                }

                latestCall = await this.callActivityModel
                    .findOne({ module_id: global.MODULES['Site-Project'], customer_id: toObjectId(params._id) })
                    .sort({ activity_date: -1 })
                    .lean();
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
                const ContactPersonDetail: Record<string, any>[] = await this.getContactPerson(req, params);
                result.contact_person_detail = ContactPersonDetail || [];
                result.files = await this.getDocument(result._id, global.THUMBNAIL_IMAGE)
                result.gps_address = (result.lat && result.long)
                    ? await this.locationService.open_street(result.lat, result.long)
                    : '';
            }
            return this.res.success('SUCCESS.FETCH', result);
        } catch (error) {
            return this.res.error(HttpStatus.BAD_REQUEST, 'ERROR.BAD_REQ', error);
        }
    }

    async fethCompetitor(req: Request, params: any): Promise<any> {
        try {
            params.module_id = global.MODULES['Site-Project'];
            params.dropdown_name = global.DROPDOWNS[3];
            params.internalCall = true;

            const competitors: Record<string, any> = await this.dropdownService.readDropdown(req, params);
            const result = await Promise.all(
                competitors.map(async (row: any) => {
                    const competitorExist = await this.sitesComptetorModel.findOne({
                        site_project_id: toObjectId(params._id),
                        competitor: row.label
                    }).lean();

                    return {
                        [row.label]: competitorExist ? !!competitorExist['checked'] : false
                    };
                })
            );
            return result;
        } catch (error) {
            return this.res.error(HttpStatus.BAD_REQUEST, 'ERROR.BAD_REQ', error.message);
        }
    }

    async fethStages(req: Request, params: any): Promise<any> {
        try {
            params.module_id = global.MODULES['Site-Project'];
            params.dropdown_name = global.DROPDOWNS[2];
            params.internalCall = true;

            const stages: Record<string, any> = await this.dropdownService.readDropdown(req, params);
            const result = await Promise.all(
                stages.map(async (row: any) => {
                    const stageExist = await this.siteprojectStageModel.findOne({
                        site_project_id: toObjectId(params._id),
                        stage: row.label
                    }).lean();

                    return {
                        [row.label]: stageExist ? !!stageExist['checked'] : false
                    };
                })
            );
            return result;
        } catch (error) {
            return this.res.error(HttpStatus.BAD_REQUEST, 'ERROR.BAD_REQ', error.message);
        }
    }


    async readQuotation(req: Request, params: any): Promise<any> {
        try {
            let match: Record<string, any> = {
                org_id: req['user']['org_id'],
                customer_id: toObjectId(params._id),
                is_delete: 0
            }
            let data: Record<string, any> = await this.quotationModel.find(match).lean().exec();
            data = data.map((quotation) => {
                const cartItems = quotation.cart_item || [];
                const total_qty = cartItems.reduce((sum, item) => sum + (item.qty || 0), 0);
                const total_item = cartItems.length;
                return {
                    ...quotation,
                    total_item,
                    total_qty
                };
            });
            return this.res.success('SUCCESS.FETCH', data);
        } catch (error) {
            return this.res.error(HttpStatus.BAD_REQUEST, 'ERROR.BAD_REQ', error.message)
        }
    }

    async saveContact(req: Request, params: any): Promise<any> {
        try {
            params.site_project_id = toObjectId(params.site_project_id);
            const saveObj: Record<string, any> = {
                ...req['createObj'],
                ...params
            };
            const document = new this.sitesContactModel(saveObj);
            const insert = await document.save();
            if (!insert || !insert._id) {
                return this.res.error(HttpStatus.BAD_REQUEST, 'ERROR.BAD_REQ');
            }
            return this.res.success('SUCCESS.CREATE');
        } catch (error) {
            return this.res.error(HttpStatus.BAD_REQUEST, 'ERROR.BAD_REQ', error);
        }
    }

    async updateContact(req: Request, params: any): Promise<any> {
        try {
            const exist: Record<string, any> = await this.sitesContactModel.findOne({ _id: params._id }).exec();
            if (!exist) return this.res.error(HttpStatus.NOT_FOUND, 'ERROR.NOT_FOUND');
            const updateObj: Record<string, any> = {
                ...req['updateObj'],
                ...params,
            };
            const updatedDocument = await this.sitesContactModel.updateOne(
                { _id: params._id },
                updateObj
            );
            if (!updatedDocument) return this.res.error(HttpStatus.BAD_REQUEST, 'ERROR.UPDATE_FAILED');
            return this.res.success('SUCCESS.UPDATE');
        } catch (error) {
            return this.res.error(HttpStatus.BAD_REQUEST, 'ERROR.BAD_REQ', error);
        }
    }

    async deleteContact(req: Request, params: any): Promise<any> {
        try {
            params._id = toObjectId(params._id)
            const exist: Record<string, any> = await this.sitesContactModel.findOne({ _id: params._id, is_delete: 0 }).exec();
            if (!exist) return this.res.error(HttpStatus.NOT_FOUND, 'ERROR.NOT_FOUND');
            const updateObj: Record<string, any> = {
                ...req['updateObj'],
                is_delete: 1,
            };
            const updatedDocument = await this.sitesContactModel.updateOne(
                { _id: params._id },
                updateObj
            );
            if (!updatedDocument) return this.res.error(HttpStatus.BAD_REQUEST, 'ERROR.UPDATE_FAILED');
            return this.res.success('SUCCESS.DELETE');
        } catch (error) {
            return this.res.error(HttpStatus.BAD_REQUEST, 'ERROR.BAD_REQ', error);
        }
    }

    async saveStage(req: Request, params: any): Promise<any> {
        try {
            const org_id = req['user']['org_id'];
            const site_project_id = params.site_project_id = toObjectId(params.site_project_id);
            const stage = eMatch(params.stage);

            const existingStage: Record<string, any> = await this.siteprojectStageModel.findOne({ site_project_id, stage, org_id });

            if (existingStage) {
                const updateObj: Record<string, any> = {
                    ...req['updateObj'],
                    ...params,
                };

                const updatedDocument = await this.siteprojectStageModel.updateOne(
                    { _id: existingStage._id },
                    updateObj
                );
                if (!updatedDocument) return this.res.error(HttpStatus.BAD_REQUEST, 'ERROR.UPDATE_FAILED');
                return this.res.success('SUCCESS.CREATE');
            } else {
                params.org_id = req['user']['org_id'];
                params.user_id = req['user']['_id'];

                const saveObj: Record<string, any> = {
                    ...req['createObj'],
                    ...params
                };
                const document = new this.siteprojectStageModel(saveObj);
                const insert = await document.save();
                if (!insert || !insert._id) {
                    return this.res.error(HttpStatus.BAD_REQUEST, 'ERROR.BAD_REQ');
                }
                return this.res.success('SUCCESS.UPDATE');
            }
        } catch (error) {
            return this.res.error(HttpStatus.BAD_REQUEST, 'ERROR.BAD_REQ', error);
        }
    }

    async getContactPerson(req: Request, params: any): Promise<any> {
        try {
            let match: Record<string, any> = {
                org_id: req['user']['org_id'],
                site_project_id: toObjectId(params._id),
                is_delete: 0
            }
            let data: Record<string, any> = await this.sitesContactModel.find(match).sort({ _id: -1 }).lean();
            return data
        } catch (error) {
            return this.res.error(HttpStatus.BAD_REQUEST, 'ERROR.BAD_REQ', error.message)
        }
    }

    async userAssign(req: Request, params: any): Promise<any> {
        try {
            const exist: Record<string, any> = await this.siteprojectModel.findOne({ _id: params._id }).exec();
            if (!exist) return this.res.error(HttpStatus.BAD_REQUEST, 'WARNING.NOT_EXIST');

            params.assigned_to_user_id = toObjectId(params.assigned_to_user_id);
            params.assigned_date = new Date();

            const updateObj: Record<string, any> = {
                ...req['updateObj'],
                ...params,
            };

            await this.siteprojectModel.updateOne(
                { _id: params._id },
                updateObj
            );
            return this.res.success('SUCCESS.USER_ASSIGNED');
        } catch (error) {
            return this.res.error(HttpStatus.BAD_REQUEST, 'ERROR.BAD_REQ', error);
        }
    }

    async statusUpdate(req: Request, params: any): Promise<any> {
        try {
            const exist: Record<string, any> = await this.siteprojectModel.findOne({ _id: params._id }).exec();
            if (!exist) return this.res.error(HttpStatus.NOT_FOUND, 'ERROR.NOT_FOUND');

            const updateObj: Record<string, any> = {
                ...req['updateObj'],
                ...params,
            };
            const updatedDocument = await this.siteprojectModel.updateOne(
                { _id: params._id },
                updateObj
            );
            if (!updatedDocument) return this.res.error(HttpStatus.BAD_REQUEST, 'ERROR.UPDATE_FAILED');
            return this.res.success('SUCCESS.STATUS_UPDATE');
        } catch (error) {
            return this.res.error(HttpStatus.BAD_REQUEST, 'ERROR.BAD_REQ', error);
        }
    }

    async saveLocation(req: Request, params: any): Promise<any> {
        try {
            const exist: Record<string, any> = await this.siteprojectModel.findOne({ _id: toObjectId(params.site_project_id) }).exec();
            if (!exist) return this.res.error(HttpStatus.NOT_FOUND, 'ERROR.NOT_FOUND');

            const updateObj: Record<string, any> = {
                ...req['updateObj'],
                ...params,
            };
            const updatedDocument = await this.siteprojectModel.updateOne(
                { _id: toObjectId(params.site_project_id) },
                updateObj
            );
            if (!updatedDocument) return this.res.error(HttpStatus.BAD_REQUEST, 'ERROR.UPDATE_FAILED');
            return this.res.success('SUCCESS.UPDATE');
        } catch (error) {
            return this.res.error(HttpStatus.BAD_REQUEST, 'ERROR.BAD_REQ', error);
        }
    }

    async activities(req: Request, params: any): Promise<any> {
        try {
            let match: Record<string, any> = {
                is_delete: 0,
                org_id: req['user']['org_id'],
                module_id: global.MODULES['Site-Project'],
                customer_id: toObjectId(params.site_project_id)
            };
            const visitActivities: Record<string, any> = await this.visitActivityModel.find(match).lean();
            const callActivities: Record<string, any> = await this.callActivityModel.find(match).lean();

            const taggedVisitActivities: any = visitActivities.map(activity => ({
                ...activity,
                type: 'visit'
            }));

            const taggedCallActivities: any = callActivities.map(activity => ({
                ...activity,
                type: 'call'
            }));
            const result: Record<string, any> = [...taggedVisitActivities, ...taggedCallActivities];
            result.sort((a, b) => new Date(a.activity_date).getTime() - new Date(b.activity_date).getTime());
            return this.res.success('SUCCESS.FETCH', result);
        } catch (error) {
            return this.res.error(HttpStatus.BAD_REQUEST, 'ERROR.BAD_REQ', error);
        }
    }

    async saveCompetitor(req: Request, params: any): Promise<any> {
        try {
            const org_id = req['user']['org_id'];
            const site_project_id = params.site_project_id = toObjectId(params.site_project_id);
            const competitor = eMatch(params.competitor);

            const existingCompetitor: Record<string, any> = await this.sitesComptetorModel.findOne({ site_project_id, competitor, org_id });

            if (existingCompetitor) {
                const updateObj: Record<string, any> = {
                    ...req['updateObj'],
                    ...params,
                };

                await this.sitesComptetorModel.updateOne(
                    { _id: existingCompetitor._id },
                    updateObj
                );
                return this.res.success('SUCCESS.CREATE');
            } else {
                params.org_id = req['user']['org_id'];
                params.user_id = toObjectId(req['user']['_id']);

                const saveObj: Record<string, any> = {
                    ...req['createObj'],
                    ...params
                };
                const document = new this.sitesComptetorModel(saveObj);
                await document.save();
                return this.res.success('SUCCESS.UPDATE');
            }
        } catch (error) {
            return this.res.error(HttpStatus.BAD_REQUEST, 'ERROR.BAD_REQ', error);
        }
    }


    async readSite(req: Request, params: any): Promise<any> {
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
            let data: any = await this.siteprojectModel.find(match, { site_name: 1 }).sort(sorting).limit(limit).lean()
            data = data.map((row: any) => {
                return {
                    label: row.site_name,
                    value: row._id,
                    module_id: global.MODULES['Site-Project'],
                    module_name: Object.keys(global.MODULES).find(key => global.MODULES[key] === global.MODULES['Site-Project'])

                }
            })
            return this.res.success('SUCCESS.FETCH', data);
        } catch (error) {
            return this.res.error(HttpStatus.BAD_REQUEST, 'ERROR.BAD_REQ', error);
        }
    }
}