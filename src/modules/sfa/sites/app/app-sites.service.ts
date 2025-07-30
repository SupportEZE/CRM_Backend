import { HttpStatus, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { SitesModel, SitesStatus } from '../models/sites.model';
import { ResponseService } from 'src/services/response.service';
import { SitesStageModel } from '../models/sites-stage.model';
import { DropdownService } from 'src/modules/master/dropdown/web/dropdown.service';
import { FollowupModel } from '../../followup/models/followup.model';
import { CallActivityModel } from '../../activity/models/call-activity.model';
import { VisitActivityModel } from '../../activity/models/visit-activity.model';
import { toObjectId, eMatch, commonFilters, tat, appCommonFilters } from 'src/common/utils/common.utils';
import { SitesDocsModel } from '../models/sites-docs.model';
import { SitesContactModel } from '../models/sites-contact.model';
import { S3Service } from 'src/shared/rpc/s3.service';
import { SitesComptetorModel } from '../models/sites-competitor.model';
import { LocationService } from 'src/services/location.service';
import { SitesService } from '../web/sites.service';

@Injectable()
export class AppSitesService {
    constructor
    (
        @InjectModel(SitesModel.name) private siteprojectModel: Model<SitesModel>,
        @InjectModel(SitesStageModel.name) private siteprojectStageModel: Model<SitesStageModel>,
        @InjectModel(FollowupModel.name) private followupModel: Model<FollowupModel>,
        @InjectModel(CallActivityModel.name) private callActivityModel: Model<CallActivityModel>,
        @InjectModel(VisitActivityModel.name) private visitActivityModel: Model<VisitActivityModel>,
        @InjectModel(SitesDocsModel.name) private sitesDocsModel: Model<SitesDocsModel>,
        @InjectModel(SitesContactModel.name) private sitesContactModel: Model<SitesContactModel>,
        @InjectModel(SitesComptetorModel.name) private sitesComptetorModel: Model<SitesComptetorModel>,
        private readonly res: ResponseService,
        private readonly dropdownService: DropdownService,
        private readonly sitesService: SitesService,
        private readonly locationService: LocationService
        
    ) { }
    
    
    async read(req: Request, params: any): Promise<any> {
        try {
            let userId = toObjectId(req['user']['_id']);
            let match: Record<string, any> = {
                is_delete: 0,
                org_id: req['user']['org_id'],
                $or: [
                    { assigned_to_user_id: userId },
                    { created_id: userId }
                ]
            };
            let sorting: Record<string, 1 | -1> = { _id: -1 };
            
            if (params?.sorting && typeof params.sorting === 'object' && Object.keys(params.sorting).length !== 0) {
                sorting = params.sorting;
            }
            
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
            
            const filters = ["site_id", "site_type","site_name","district","address","mobile"];
            Object.assign(match,appCommonFilters(params.filters, filters))
         
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
            return this.res.error(HttpStatus.BAD_REQUEST, 'ERRORR.BAD_REQ', error.message);
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
                
                const upcomingFollowup = await this.followupModel.findOne({
                    category_type: "Site",
                    category_id: toObjectId(params._id),
                    followup_date: { $gte: new Date() },
                    is_delete: 0
                }).sort({ followup_date: 1 });
                
                result.upcomingFollowup = upcomingFollowup;
                
                //****************************************/
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
                result.gps_address = (result.lat && result.long)
                ? await this.locationService.open_street(result.lat, result.long)
                : '';
                result.files = await this.sitesService.getDocument(result._id, global.THUMBNAIL_IMAGE)
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
            
            const competitors = await this.dropdownService.readDropdown(req, params);
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
            
            const stages = await this.dropdownService.readDropdown(req, params);
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
    
    async statusUpdate(req: Request, params: any): Promise<any> {
        try {
            const exist: Record<string, any> = await this.siteprojectModel.findOne({ _id: params._id }).exec();
            if (!exist) return this.res.error(HttpStatus.BAD_REQUEST, 'ENQUIRY.NOT_EXIST');
            
            const updateObj: Record<string, any> = {
                ...req['updateObj'],
                ...params,
            };
            
            await this.siteprojectModel.updateOne(
                { _id: params._id },
                updateObj
            );
            return this.res.success('SUCCESS.STATUS_UPDATE');
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
                
                await this.siteprojectStageModel.updateOne(
                    { _id: existingStage._id },
                    updateObj
                );
                return this.res.success('SUCCESS.CREATE');
            } else {
                params.org_id = req['user']['org_id'];
                params.user_id = req['user']['_id'];
                
                const saveObj: Record<string, any> = {
                    ...req['createObj'],
                    ...params
                };
                const document = new this.siteprojectStageModel(saveObj);
                await document.save();
                return this.res.success('SUCCESS.UPDATE');
            }
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
            const visitActivities = await this.visitActivityModel.find(match).lean();
            const callActivities = await this.callActivityModel.find(match).lean();
            
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
    
    async saveContact(req: Request, params: any): Promise<any> {
        try {
            params.site_project_id = toObjectId(params.site_project_id);
            const saveObj: Record<string, any> = {
                ...req['createObj'],
                ...params
            };
            const document = new this.sitesContactModel(saveObj);
            await document.save();
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
            await this.sitesContactModel.updateOne(
                { _id: params._id },
                updateObj
            );
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
            await this.sitesContactModel.updateOne(
                { _id: params._id },
                updateObj
            );
            return this.res.success('SUCCESS.DELETE');
        } catch (error) {
            return this.res.error(HttpStatus.BAD_REQUEST, 'ERROR.BAD_REQ', error);
        }
    }
    
    async userAssign(req: Request, params: any): Promise<any> {
        try {
            const exist: Record<string, any> = await this.siteprojectModel.findOne({ _id: params._id }).exec();
            if (!exist) return this.res.error(HttpStatus.BAD_REQUEST, 'ENQUIRY.NOT_EXIST');
            
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
            return this.res.success('SUCCESS.USR_ASSIGNED');
        } catch (error) {
            return this.res.error(HttpStatus.BAD_REQUEST, 'ERROR.BAD_REQ', error);
        }
    }
    
}