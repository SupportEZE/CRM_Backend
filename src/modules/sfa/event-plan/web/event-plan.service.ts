import { HttpStatus, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { EventPlanModel } from '../models/event-plan.model';
import { ResponseService } from 'src/services/response.service';
import { appCommonFilters, calculatePercentage, commonFilters, convertToUtcRange, nextSeq, toIST, toObjectId } from 'src/common/utils/common.utils';
import { EventStatus, ParticipantStatus } from './dto/event-plan.dto';
import { format } from 'date-fns';
import { EventPlanParticipantModel } from '../models/event-plan-participants.model';
import { S3Service } from 'src/shared/rpc/s3.service';
import { EventPlanDocsModel } from '../models/event-plan-docs.model';
import { ExpenseService } from '../../expense/web/expense.service';
import { SharedUserService } from 'src/modules/master/user/shared-user.service';
import { SharedCustomerService } from 'src/modules/master/customer/shared-customer.service';
import { EventRoutes } from './event-plan.controller';
@Injectable()
export class EventPlanService {
    constructor
    (
        @InjectModel(EventPlanModel.name) private eventPlanModel: Model<EventPlanModel>,
        @InjectModel(EventPlanParticipantModel.name) private eventPlanParticipantModel: Model<EventPlanParticipantModel>,
        @InjectModel(EventPlanDocsModel.name) private eventPlanDocsModel: Model<EventPlanDocsModel>,
        private readonly res: ResponseService,
        private readonly s3Service: S3Service,
        private readonly expenseService: ExpenseService,
        private readonly sharedUserService: SharedUserService,
        private readonly sharedCustomerService: SharedCustomerService,
    ) { }
    
    async upload(files: Express.Multer.File[], req: any): Promise<any> {
        try {
            req.body.module_name = Object.keys(global.MODULES).find(
                key => global.MODULES[key] === global.MODULES['Event Plan']
            );
            let response = await this.s3Service.uploadMultiple(files, req, this.eventPlanDocsModel);
            return this.res.success('SUCCESS.CREATE', response);
        } catch (error) {
            return this.res.error(HttpStatus.BAD_REQUEST, 'Error uploading files to S3', error?.message || error
            );
        }
    }
    
    async deleteFile(req: Request, params: any): Promise<any> {
        try {
            params._id = toObjectId(params._id)
            const exist: Record<string, any> = await this.eventPlanDocsModel.findOne({ _id: params._id, is_delete: 0 }).exec();
            
            if (!exist) return this.res.error(HttpStatus.NOT_FOUND, 'ERROR.NOT_FOUND');
            
            const updateObj = {
                ...req['updateObj'],
                is_delete: 1,
            };
            await this.eventPlanDocsModel.updateOne(
                { _id: params._id },
                updateObj
            );
            
            return this.res.success('SUCCESS.FILE_DELETE');
        } catch (error) {
            return this.res.error(HttpStatus.BAD_REQUEST, 'ERROR.BAD_REQ', error);
        }
    }
    
    async getDocument(
        id: any,
        type: typeof global.FULL_IMAGE | typeof global.THUMBNAIL_IMAGE | typeof global.BIG_THUMBNAIL_IMAGE = global.FULL_IMAGE
    ): Promise<any> {
        return this.s3Service.getDocumentsByRowId(this.eventPlanDocsModel, id, type);
    }
    
    async getDocumentByDocsId(req: any, params: any): Promise<any> {
        const doc = await this.s3Service.getDocumentsById(this.eventPlanDocsModel, params._id);
        return this.res.success('SUCCESS.FETCH', doc);
    }
    
    async create(req: any, params: any): Promise<any> {
        try {
            
            if(req.url.includes(EventRoutes.ADMIN_CREATE)) {
                params.assigned_to_user_id = toObjectId(params.assigned_to_user_id)
                params.assigned_to_user_name = params.assigned_to_user_name
            }else{
                params.assigned_to_user_id = req['user']['_id']
                params.assigned_to_user_name = req['user']['name']
            }
            
            const orgId: number = req['user']['org_id'];
            const { start, end } = convertToUtcRange(params.event_date);
            const exist: Record<string, any> = await this.eventPlanModel.findOne({
                org_id: orgId,
                assigned_to_user_id:params.assigned_to_user_id,
                is_delete: 0,
                event_date: { $gte: start, $lte: end }
            }).exec();
            if (exist) return this.res.error(HttpStatus.BAD_REQUEST, 'WARNING.ALREADY_EXIST');
            
            params.status = EventStatus.Pending
            params.customer_id = toObjectId(params.customer_id);
            params.customer_type_id = toObjectId(params.customer_type_id);
            
            const seq = {
                modelName: this.eventPlanModel,
                idKey: 'event_id',
                prefix: 'EVT'
            }
            
            const newEventId =  await nextSeq(req,seq)
            const saveObj: Record<string, any> = {
                ...req['createObj'],
                ...params,
                event_id: newEventId,
            };
            const document = new this.eventPlanModel(saveObj);
            const insert = await document.save();
            if (!insert._id) return this.res.error(HttpStatus.BAD_REQUEST, 'ERROR.BAD_REQ');
            return this.res.success('SUCCESS.CREATE');
        } catch (error) {
            return this.res.error(HttpStatus.BAD_REQUEST, 'ERROR.BAD_REQ', error);
        }
    }
    
    async read(req: Request, params: any): Promise<any> {
        try {
            const { start, end } = convertToUtcRange(new Date());
            const orgId = req['user']['org_id'];
            let match: Record<string, any> = {
                is_delete: 0,
                org_id: orgId,
            };
            let filters: Record<string, any>={};
            
            if (params?.filters?.search && req.url.includes(global.MODULE_ROUTES[24])) {
                const fieldsToSearch = ["event_id", "event_type", "customer_name", "budget_request_per_person", "event_venue", "remark"];
                filters = appCommonFilters(params.filters, fieldsToSearch);
            }else{
                filters = commonFilters(params.filters);
                
            }
            
            Object.assign(match,filters)
            
            const tabStatus = params.activeTab;
            if (tabStatus === global.EVENT_STATUS[1]) {
                match.status = tabStatus;
            } else if (tabStatus === global.EVENT_STATUS[2]) {
                match.status = global.EVENT_STATUS[7];
                match.event_date = { $gt: end };
            } else if (tabStatus === global.EVENT_STATUS[3]) {
                match.status = global.EVENT_STATUS[7];
                match.event_date = { $lt: end };
            } else if ([global.EVENT_STATUS[4], global.EVENT_STATUS[5]].includes(tabStatus)) {
                match.status = tabStatus;
            }
            params.status = match.status
            
            const commonMatch: Record<string, any> = {
                org_id: orgId,
                is_delete: 0
            }
            
            if(req.url.includes(global.MODULE_ROUTES[24])){
                
                match.$or = [
                    { assigned_to_user_id: req['user']['_id'] },
                    { created_id : req['user']['_id'] } 
                ];
                commonMatch.$or = [
                    { assigned_to_user_id: req['user']['_id'] },
                    { created_id : req['user']['_id'] } 
                ];
                
                const tabStatus = params.activeTab;
                if (tabStatus === global.EVENT_STATUS[1]) {
                    match.status = tabStatus;
                } else if (tabStatus === global.EVENT_STATUS[7]) {
                    match.status = global.EVENT_STATUS[7];
                } else if (tabStatus === global.EVENT_STATUS[4]) {
                    match.status = global.EVENT_STATUS[4];
                } else if (tabStatus === global.EVENT_STATUS[5]) {
                    match.status = tabStatus;
                }
            }
            
            if (
                !req.url.includes(global.MODULE_ROUTES[24]) && 
                global.LOGIN_TYPE_ID_PERMISSION?.includes(req['user']['login_type_id'])
            ) {
                const userIds = await this.sharedUserService.getUsersIds(req, params);
                match.$or = [
                    { assigned_to_user_id: { $in: userIds } },
                    { created_id: { $in: userIds } }
                ];
                commonMatch.$or = [
                    { assigned_to_user_id: { $in: userIds } },
                    { created_id: { $in: userIds } }
                ];
            }
            
            const page: number = params?.page || global.PAGE;
            const limit: number = params?.limit || global.LIMIT;
            const skip: number = (page - 1) * limit;
            
            params.localField = 'assigned_to_user_id';
            const userLookup:any[] = this.sharedUserService.userLookup(req,params);
            
            const result: Record<string, any>[] = await this.eventPlanModel.aggregate([
                { $match: match },
                { $sort: { created_at: -1 } },
                { $skip: skip },
                { $limit: limit },
                ...userLookup,
                {
                    $addFields: {
                        reporting_manager_name: '$user_info.reporting_manager_name',
                        user_mobile: '$user_info.mobile',
                    }
                },
                {
                    $project: {
                        created_at: 1,
                        created_name: 1,
                        event_id: 1,
                        event_date: 1,
                        event_type: 1,
                        event_venue: 1,
                        assigned_to_user_id: 1,
                        assigned_to_user_name: 1,
                        invite_members: 1,
                        budget_request_per_person: 1,
                        gift_detail: 1,
                        remark: 1,
                        updated_at: 1,
                        status: 1,
                        customer_id: 1,
                        customer_name: 1,
                        customer_type_id: 1,
                        customer_type_name: 1,
                        reporting_manager_name: 1,
                        user_mobile:1
                    }
                }
            ]);
            
            
            const tabCounts = await Promise.all([
                this.eventPlanModel.countDocuments({ ...commonMatch, status: global.EVENT_STATUS[1], event_date: { $lte: end } }),
                this.eventPlanModel.countDocuments({ ...commonMatch, status: global.EVENT_STATUS[7], event_date: { $gt: end } }),
                this.eventPlanModel.countDocuments({ ...commonMatch, status: global.EVENT_STATUS[7], event_date: { $lt: end } }),
                this.eventPlanModel.countDocuments({ ...commonMatch, status: global.EVENT_STATUS[4] }),
                this.eventPlanModel.countDocuments({ ...commonMatch, status: global.EVENT_STATUS[5] }),
                this.eventPlanModel.countDocuments({ ...commonMatch }),
            ]);
            
            const [pendingCount, upcomingCount, inprocessCount, completeCount, rejectCount, totalCount] = tabCounts;
            const data: any = {
                result,
                tabCounts: {
                    pending_count: pendingCount,
                    upcoming_count: upcomingCount,
                    inprocess_count: inprocessCount,
                    complete_count: completeCount,
                    reject_count: rejectCount,
                    total_count: totalCount
                },
            };
            
            let total = 0;
            if (tabStatus === global.EVENT_STATUS[1]) {
                total = pendingCount;
            } else if (tabStatus === global.EVENT_STATUS[2]) {
                total = upcomingCount;
            } else if (tabStatus === global.EVENT_STATUS[3]) {
                total = inprocessCount;
            } else if (tabStatus === global.EVENT_STATUS[4]) {
                total = completeCount;
            } else if (tabStatus === global.EVENT_STATUS[5]) {
                total = rejectCount;
            } else if (tabStatus === global.EVENT_STATUS[6]) {
                total = totalCount;
            }
            
            const calenderData: Record<string, any>[] = await this.fetchCalenderData(req, params);
            data.calender_data = calenderData || [];
            return this.res.pagination(data, total, page, limit);
        } catch (error) {
            return this.res.error(HttpStatus.BAD_REQUEST, 'ERROR.BAD_REQ', error);
        }
    }
    
    async fetchCalenderData(req: Request, params: any): Promise<any> {
        try {
            const match: Record<string, any> = {
                org_id: req['user']['org_id'],
                is_delete: 0,
                status:params.status
            };
            if (global.LOGIN_TYPE_ID_PERMISSION?.includes(req['user']['login_type_id'])) {
                const userIds = await this.sharedUserService.getUsersIds(req, params);
                match.$or = [
                    { assigned_to_user_id: { $in: userIds } },
                    { created_id: { $in: userIds } }
                ];
            }
            const uniqueDates: any[] = (
                await this.eventPlanModel.aggregate([
                    { $match: match },
                    { $group: { _id: "$event_date" } },
                    { $sort: { _id: -1 } }
                ])
            ).map(doc => doc._id);
            
            const uniqueDatesSet = new Set();
            const calendarData = uniqueDates.map(dateStr => {
                const date = toIST(dateStr,false);
                if(!uniqueDatesSet.has(date)){
                    uniqueDatesSet.add(date)
                    return {
                        event_date: date,
                        month: format(date, 'MMM'),
                        date: date.split('-')[2],
                        day: format(date, 'EEE')
                    };
                }
                return null
            }).filter(item => item !== null);;
            return calendarData || []
        } catch (error) {
            return this.res.error(HttpStatus.BAD_REQUEST, 'ERROR.BAD_REQ', error.message);
        }
    }
    
    async delete(req: Request, params: any): Promise<any> {
        try {
            let match: Record<string, any> = { _id: params._id, is_delete: 0 };
            const exist: Record<string, any> = await this.eventPlanModel.findOne(match).exec();
            if (!exist) return this.res.error(HttpStatus.NOT_FOUND, 'ERROR.NOT_FOUND');
            if (params?.is_delete && exist['is_delete'] === params?.is_delete) return this.res.error(HttpStatus.BAD_REQUEST, 'WARNING.ALREADY_DELETE');
            
            const updateObj: Record<string, any> = {
                ...req['updateObj'],
                ...params,
            };
            await this.eventPlanModel.updateOne(
                { _id: params._id },
                updateObj
            );
            return this.res.success('SUCCESS.DELETE');
        } catch (error) {
            return this.res.error(HttpStatus.BAD_REQUEST, 'ERROR.BAD_REQ', error);
        }
    }
    
    async detail(req: Request, params: any): Promise<any> {
        try {
            const match = { _id: params._id, is_delete: 0 };
            const result: Record<string, any> = await this.eventPlanModel.findOne(match).lean().exec();
            if (!result) return this.res.error(HttpStatus.NOT_FOUND, 'ERROR.NOT_FOUND');
            
            let customers: any[] = [];
            if (Array.isArray(result.customer_id) && result.customer_id.length > 0) {
                const customerIds = result.customer_id.map(toObjectId);
                customers = await this.sharedCustomerService.getCustomersByIds(req, customerIds);
                result['customers'] = customers;
            } else {
                result['customers'] = [];
            }
            
            const participantData = await this.fetchParticipantData(params._id);
            result['participant_data'] = participantData || [];
            
            const expenseData = await this.expenseService.fetchExpenseData(params._id);
            result['expense_data'] = expenseData || [];
            
            result.files = await this.getDocument(result._id, global.THUMBNAIL_IMAGE)
            
            const expenseId = (expenseData && expenseData.length > 0) ? expenseData[0].expense_id : null;
            if (expenseId) {
                result.expense_files = await this.expenseService.getDocument(expenseId, global.THUMBNAIL_IMAGE);
            } else {
                result.expense_files = [];
            }
            
            const counts = await this.calculateParticipantCounts(req, params._id, participantData);
            result['count'] = counts;
            return this.res.success('SUCCESS.FETCH', result);
        } catch (error) {
            return this.res.error(HttpStatus.BAD_REQUEST, 'ERROR.BAD_REQ', error);
        }
    }
    
    async fetchParticipantData(eventPlanId: any): Promise<Record<string, any>[]> {
        return await this.eventPlanParticipantModel.find(
            {
                event_plan_id: toObjectId(eventPlanId),
                is_delete: 0
            },
            {
                name: 1,
                mobile: 1,
                _id: 0
            }
        ).lean();
    }
    
    async calculateParticipantCounts(req: Request,
        eventPlanId: any,
        participantData: Record<string, any>[]
    ): Promise<{
        winCount: number;
        newCustomerCount: number;
        repeatCustomerCount: number;
        totalCount: number;
        successRatePercent: number;
    }> {
        const countMatch = {
            event_plan_id: toObjectId(eventPlanId),
            is_delete: 0
        };
        
        const [totalCount, newCustomerCount, repeatCustomerCount] = await Promise.all([
            this.eventPlanParticipantModel.countDocuments(countMatch),
            this.eventPlanParticipantModel.countDocuments({ ...countMatch, status: ParticipantStatus.New }),
            this.eventPlanParticipantModel.countDocuments({ ...countMatch, status: ParticipantStatus.Repeated })
        ]);
        
        let winCount = 0;
        
        if (participantData?.length) {
            const participantMobiles = participantData.map(p => p.mobile);
            const customers = await this.sharedCustomerService.getCustomersByMobileNo(req, participantMobiles);
            const customerMobiles = new Set(customers.map(c => c.mobile));
            winCount = participantData.filter(p => customerMobiles.has(p.mobile)).length;
        }
        
        let successRatePercent = calculatePercentage(winCount,totalCount);
        
        return {
            winCount,
            newCustomerCount,
            repeatCustomerCount,
            totalCount,
            successRatePercent
        };
    }
    
    async addParticipants(req: Request, params: any): Promise<any> {
        try {
            let match: Record<string, any> = {
                event_plan_id: toObjectId(params.event_plan_id),
                mobile: params.mobile,
                is_delete: 0,
                org_id: req['user']['org_id']
            };
            let exist: Record<string, any> = await this.eventPlanModel.findOne({ _id: params.event_plan_id }).exec();
            if (!exist) return this.res.error(HttpStatus.NOT_FOUND, 'ERROR.NOT_FOUND');
            const data = await this.eventPlanParticipantModel.findOne(match).exec();
            if (!data) {
                params.status = ParticipantStatus.New
            } else {
                params.status = ParticipantStatus.Repeated
            }
            
            params.event_plan_id = toObjectId(params.event_plan_id)
            const saveObj: Record<string, any> = {
                ...req['createObj'],
                ...params
            };
            const document = new this.eventPlanParticipantModel(saveObj);
            const insert = await document.save();
            if (!insert._id) return this.res.error(HttpStatus.BAD_REQUEST, 'ERROR.BAD_REQ');
            return this.res.success('SUCCESS.CREATE');
        } catch (error) {
            return this.res.error(HttpStatus.BAD_REQUEST, 'ERROR.BAD_REQ', error);
        }
    }
    
    async statusUpdate(req: Request, params: any): Promise<any> {
        try {
            const exist = await this.eventPlanModel.findOne({ _id: params._id }).exec();
            if (!exist) return this.res.error(HttpStatus.NOT_FOUND, 'ERROR.NOT_FOUND');
            
            const updateObj: Record<string, any> = {
                ...req['updateObj'],
                ...params,
            };
            await this.eventPlanModel.updateOne(
                { _id: params._id },
                updateObj
            );
            return this.res.success('SUCCESS.STATUS_UPDATE');
        } catch (error) {
            return this.res.error(HttpStatus.BAD_REQUEST, 'ERROR.BAD_REQ', error);
        }
    }
}