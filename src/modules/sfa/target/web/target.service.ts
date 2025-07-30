import { forwardRef, HttpStatus, Inject, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { ResponseService } from 'src/services/response.service';
import { AdditionalTarget, TargetModel } from '../models/target.model';
import { TargetMappingModel } from '../models/target-mapping.model';
import { Model } from 'mongoose';
import { toObjectId, commonFilters, buildDateRange, calculatePercentage, getFinancialYearQuarterRanges, getFinancialYearMonthRanges, analyzeMonthlyAchievements, getTargetAchievementRate, toIST, tat, targetProgressStatus, getISTDateList } from 'src/common/utils/common.utils';
import { SharedUserService } from 'src/modules/master/user/shared-user.service';
import { ActiveTabEnum, TargetTypeEnum } from './dto/target.dto';
import { AdditionalTargetArray, GlobalAchievementService } from 'src/shared/global/achievement.service';


@Injectable()
export class TargetService {
    constructor(
        @InjectModel(TargetModel.name) private targetModel: Model<TargetModel>,
        @InjectModel(TargetMappingModel.name) private targetmappingModel: Model<TargetMappingModel>,
        private readonly res: ResponseService,
        private readonly sharedUserService: SharedUserService,
        @Inject(forwardRef(() => GlobalAchievementService)) 
        private readonly globalAchievementService: GlobalAchievementService,
        
    ) { }
    
    async create(req: any, params: any): Promise<any> {
        try {
            params.org_id = req['user']['org_id'];
            
            const { start_date, end_date, title, customer_type_id, assign_to_id } = params;
            
            let match: Record<string, any> = { is_delete: 0, org_id: params.org_id, title, start_date, end_date, assign_to_id: toObjectId(assign_to_id) };
            
            const exist: Record<string, any>[] = await this.targetModel.find(match).exec();
            if (exist.length > 0) return this.res.error(HttpStatus.BAD_REQUEST, 'WARNING.ALREADY_EXIST');
            
            const saveObj: Record<string, any> = {
                ...req['createObj'],
                ...params,
                customer_type_id: toObjectId(customer_type_id),
                assign_to_id: toObjectId(assign_to_id),
            };
            
            const document = new this.targetModel(saveObj);
            const targetdata = await document.save();
            
            return this.res.success('TARGET.CREATE');
        } catch (error) {
            return this.res.error(HttpStatus.BAD_REQUEST, 'ERROR.BAD_REQ', error);
        }
    }
    async read(req: Request, params: any): Promise<any> {
        try {
            let match: any = { is_delete: 0, org_id: req['user']['org_id'] };
            let sorting: Record<string, 1 | -1> = { _id: -1 };
            
            if (params?.sorting && Object.keys(params.sorting).length !== 0) sorting = params.sorting;
            
            const filters: Record<string, any> = commonFilters(params?.filters);
            match = { ...match, ...filters };
            
            const page: number = params?.page || global.PAGE;
            const limit: number = params?.limit || global.LIMIT;
            const skip: number = (page - 1) * limit;
            
            const pipeline = [
                { $match: match },
                { $sort: sorting },
                {
                    $project: {
                        created_unix_time: 0,
                        updated_at: 0,
                    }
                }
            ];
            
            const totalCountData: Record<string, any>[] = await this.targetModel.aggregate([
                ...pipeline,
                { $count: "totalCount" },
            ]);
            
            const total: number = totalCountData.length > 0 ? totalCountData[0].totalCount : 0;
            
            const result = await this.targetModel.find(match).skip(skip).limit(limit).sort(sorting).lean();
            
            return this.res.pagination(result, total, page, limit);
            
        } catch (error) {
            return this.res.error(HttpStatus.BAD_REQUEST, 'ERROR.BAD_REQ', error);
        }
    }    
    async detail(req: Request, params: any): Promise<any> {
        try {
            const match: Record<string, any> = { org_id: req['user']['org_id'], _id: params._id, is_delete: 0 };
            
            const result: Record<string, any> = await this.targetModel.findOne(match)
            .select('-__v -is_delete')
            .lean();
            
            if (!result) return this.res.error(HttpStatus.BAD_REQUEST, 'ERROR.NOT_FOUND');
            
            const { overall_summary,additional_target,customer_achievement_summary,timeline } =  await this.detailAchievement(req,params,result)
            delete result.additional_target;
            const finalData = {
                result,
                overall_summary,
                additional_target,
                customer_achievement_summary,
                timeline
            };
            
            
            if(req.url.includes(global.MODULE_ROUTES[26]) || req.url.includes(global.MODULE_ROUTES[18])) return finalData
            
            return this.res.success('SUCCESS.FETCH', finalData);
        } catch (error) {
            return this.res.error(HttpStatus.BAD_REQUEST, 'ERROR.BAD_REQ', error);
        }
    }
    
    async update(req: any, params: any): Promise<any> {
        try {
            const { start_date, end_date, title, customer_type_id, assign_to_id, sale_value, additional_target, assign_to_name } = params;
            
            let match: Record<string, any> = {
                _id: params._id,
                org_id: req['user']['org_id'],
                is_delete: 0
                
            };
            const result: Record<string, any> = await this.targetModel.findOne(match).exec();
            if (!result) return this.res.error(HttpStatus.NOT_FOUND, 'WARNING.NOT_EXIST');
            const updateObj = {
                ...req['updateObj'],
                additional_target: additional_target,
                start_date: start_date,
                end_date: end_date,
                sale_value: sale_value,
                title: title,
                customer_type_id: toObjectId(customer_type_id),
                assign_to_id: toObjectId(assign_to_id),
                assign_to_name: assign_to_name,
            };
            await this.targetModel.updateOne(
                { _id: params._id },
                { $set: updateObj }
            );
            return this.res.success('SUCCESS.UPDATE');
        } catch (error) {
            return this.res.error(HttpStatus.BAD_REQUEST, 'ERROR.BAD_REQ', error);
        }
    }
    async delete(req: any, params: any): Promise<any> {
        try {
            params._id = toObjectId(params._id)
            let match: any = { _id: params._id, is_delete: 0 };
            const exist = await this.targetModel.findOne(match).exec();
            if (!exist) return this.res.error(HttpStatus.BAD_REQUEST, 'TARGET.NOT_FOUND');
            
            if (params?.is_delete && exist['is_delete'] === params?.is_delete) return this.res.error(HttpStatus.BAD_REQUEST, 'WARNING.ALREADY_DELETE');
            
            const updateObj = {
                ...req['updateObj'],
                is_delete: 1,
            };
            
            await this.targetModel.updateOne(
                { _id: params._id },
                { $set: updateObj }
            );
            await this.targetmappingModel.updateMany(
                { target_id: params._id },
                { $set: updateObj }
            );
            
            return this.res.success('TARGET.DELETED');
        } catch (error) {
            return this.res.error(HttpStatus.BAD_REQUEST, 'ERROR.BAD_REQ', error);
        }
        
    }
    
    async achievement(req: any, params: any): Promise<any> {
        try {
            const result:Record<string,any> = {};
            const monthlyData = await this.getAchievementByType(req,params,'month')
            const monthStats = analyzeMonthlyAchievements(monthlyData);
            result.month_stats = monthStats
            result.montly_achievement_rate =  getTargetAchievementRate(monthlyData);
            const lastThreeTargetData = await this.getAchievementByType(req,params,'last3');
            result.last_three_targets = lastThreeTargetData
            return this.res.success('SUCCESS.FETCH',result)
        } catch (error) {
            return this.res.error(HttpStatus.BAD_REQUEST, 'ERROR.BAD_REQ', error);
        }
    }
    async lastThreeTargetData(req: any, params: any): Promise<any> {
        try {
            const match:Record<string,any>={
                org_id:req['user']['org_id'],
                is_delete:0,
                assign_to_id:toObjectId(params.assign_to_id)
            }
            const projection:Record<string,any>={
                start_date:1,
                end_date:1,
            }
            let data:Record<string,any>=await this.targetModel.find(match,projection).limit(3).sort({_id:-1});      
            data = data.map((row:any)=>{
                return {
                    start_date:toIST(row.start_date,false),
                    end_date:toIST(row.end_date,false),
                }
            })
            return data;
        } catch (error) {
            return this.res.error(HttpStatus.BAD_REQUEST, 'ERROR.BAD_REQ', error);
        }
    }
    
    async getAchievementByType(req: any, params: any, type: 'quarter' | 'month' | 'last3'): Promise<any> {
        try {
            let data: any[] = [];
            if (type === 'quarter') {
                data = getFinancialYearQuarterRanges();
            } else if (type === 'month') {
                data = getFinancialYearMonthRanges();
            } else if (type === 'last3') {
                data = await this.lastThreeTargetData(req,params);
            } else {
                throw new Error('Invalid type provided');
            }            
            let customerIds:any;
            if(params.target_type ===TargetTypeEnum.CUSTOMER){
                customerIds = [params.assign_to_id]
            }else{
                params.user_id = params.assign_to_id;
                customerIds = await this.sharedUserService.getAssignJuniorsAndOwnCustomersDetail(req,params)
                customerIds = customerIds?.map((row:any)=>toObjectId(row.customer_id));
            }
            
            // Prepare all date range match conditions
            const allMatchConditions = data.map((row) => ({
                start: row.start,
                end: row.end,
                match: buildDateRange('start_date', 'end_date', row.start, row.end),
            }));
            
            
            // Fetch all targets in one go
            const allTargets = await this.targetModel.find(
                {
                    is_delete:0,
                    org_id:req['user']['org_id'],
                    assign_to_id: toObjectId(params.assign_to_id),
                    $or: allMatchConditions.map((c) => c.match),
                },
                { sale_value: 1, additional_target: 1, start_date: 1, end_date: 1 }
            ).lean();
            
            // Group targets by quarter range
            const groupedTargets = data.map((row) => {
                const rangeStart = new Date(row.start);
                const rangeEnd = new Date(row.end);
                
                const targetsInRange = allTargets.filter(t =>
                    new Date(t.start_date) >= rangeStart && new Date(t.end_date) <= rangeEnd
                );
                
                let totalTarget = 0;
                for (const target of targetsInRange) {
                    const primarySaleData = target.additional_target?.find(
                        (item: any) => item.name === AdditionalTarget.PRIMARY_SALE_TARGET
                    );
                    
                    const primarySaleTargetRaw = primarySaleData?.target_value ?? 0;
                    const primarySaleTarget = typeof primarySaleTargetRaw === 'string'
                    ? parseFloat(primarySaleTargetRaw)
                    : primarySaleTargetRaw;
                    
                    const targetSaleValue = target.sale_value ?? 0;
                    
                    totalTarget += targetSaleValue + primarySaleTarget;
                }
                
                row.target = totalTarget;
                
                return row;
            });
            
            // Calculate achievements per quarter (still sequential, but only one call per period)
            for (const row of groupedTargets) {
                
                const match = buildDateRange('start_date', 'end_date', row.start, row.end)
                
                params.customer_ids = customerIds;
                params.start = match?.start_date?.$gte;
                params.end = match?.end_date?.$lte;
                
                const actualSale = await this.globalAchievementService.getPrimarySaleAchievement(req, params);
                const saleAmount = actualSale.total_net_amount_with_tax ?? 0;
                
                row.achievement = saleAmount;
                row.achievement_per = calculatePercentage(saleAmount, row.target);
            }
            return groupedTargets;
        } catch (error) {
            return this.res.error(HttpStatus.BAD_REQUEST, 'ERROR.BAD_REQ', error);
        }
    }
    
    async assignCustomerAchievementData(req: any, params: any): Promise<any> {
        try {
            params.internalCall = true;
            params.user_id = params.assign_to_id;
            params.target_type ===TargetTypeEnum.CUSTOMER
            const data:Record<string,any>[] = await this.sharedUserService.getAssignJuniorsAndOwnCustomersDetail(req,params);
            for(let row of data){
                
                params.assign_to_id  = row.customer_id;
                const monthlyData = await this.getAchievementByType(req,params,'month')
                row.month_stats = analyzeMonthlyAchievements(monthlyData);
            }
            return this.res.success('SUCCESS.FETCH',data)
        } catch (error) {
            return this.res.error(HttpStatus.BAD_REQUEST, 'ERROR.BAD_REQ', error);
        }
    }
    
    
    // Function to update target data with achievement and progress
    async  updateTargetData(
        targets:Record<string,any>, 
        targetName:string, 
        functionName:any,
        req:Request,
        params:any
    ) {
        const targetIndex = targets?.findIndex((item:any) => item.name === targetName);
        
        if (targetIndex !== -1) {
            const targetData = targets[targetIndex];
            const targetValue = targetData?.total_target || 0;
            
            let totalAchieved:number;
            
            const achievement = await this.globalAchievementService[functionName](req,params);
            if(typeof achievement === 'object'){
                totalAchieved = achievement?.total_net_amount_with_tax
            }else{
                totalAchieved = achievement
            }
            const progress = calculatePercentage(totalAchieved, targetValue);
            
            targets[targetIndex] = {
                ...targetData,
                total_achieved: totalAchieved,
                progress,
                status:targetProgressStatus(progress)
            };
        }
    }
    
    async detailAchievement(req: any, params: any,result:Record<string,any>): Promise<any> {
        try {
            
            let additionalTargets = result.additional_target || [];
            let total_target:number = result?.sale_value || 0;
            const primarySaleData = additionalTargets?.find(
                (item: any) => item.name === AdditionalTarget.PRIMARY_SALE_TARGET
            );
            
            const primarySaleTargetRaw = primarySaleData?.target_value ?? 0;
            const primarySaleTarget = typeof primarySaleTargetRaw === 'string'
            ? parseFloat(primarySaleTargetRaw)
            : primarySaleTargetRaw;
            total_target = total_target + primarySaleTarget;
            
            const match = buildDateRange('start_date', 'end_date', toIST(result?.start_date,false), toIST(result?.end_date,false))
            
            params.user_id = result.assign_to_id;
            params.internalCall = true
            const  customerData = await this.sharedUserService.getAssignJuniorsAndOwnCustomersDetail(req,params)
            
            let customerIds = customerData?.map((row:any)=>toObjectId(row.customer_id));
            params.customer_ids = customerIds;
            params.dateMatch = match
            
            params.start = match?.start_date?.$gte;
            params.end = match?.end_date?.$lte;
            const customerAchievementData = await this.globalAchievementService.getPrimarySaleAchievement(req, params);
            
            const saleAmount = customerAchievementData.total_net_amount_with_tax ?? 0;
            const total_achieved:number = saleAmount;
            const progress = calculatePercentage(saleAmount,total_target);
            
            const day_left = tat(result?.end_date,new Date(),'d');
            
            const overall_summary = {
                total_target,
                total_achieved,
                progress,
                day_left,
                status: targetProgressStatus(progress)
            };
            
            if(!req.url.includes(global.MODULE_ROUTES[26]) || params.activeTab===ActiveTabEnum.DETAIL){
                
                const productIds = additionalTargets
                ?.filter((row:any)=>row.name===AdditionalTarget.PRODUCT)
                ?.map((row:any)=>toObjectId(row.field_value));
                
                params.product_ids = productIds
                const productAchievementData:Record<string,any>[] =  await this.globalAchievementService.getProductWiseAchievement(req,params)
                
                const gategoryNames = additionalTargets
                ?.filter((row:any)=>row.product_type===AdditionalTarget.CATEGORY)
                ?.map((row:any)=>row.field_value);
                
                delete  params.product_ids
                
                params.category_names = gategoryNames
                const categoryAchievementData:Record<string,any>[] =  await this.globalAchievementService.getCategoryWiseAchievement(req,params);     
                
                
                additionalTargets.forEach((row: any) => {
                    
                    
                    if(row.name === AdditionalTarget.PRODUCT || row.name === AdditionalTarget.CATEGORY){
                        
                        const productAchievement = productAchievementData.find(
                            (product: any) => product._id.toString() === row.field_value
                        );
                        
                        const categoryAchievement = categoryAchievementData.find(
                            (category: any) => category.category_name === row.field_value
                        );
                        row.progress = 0
                        row.total_achieved = 0
                        row.status =global.COMMON_STATUS[1];
                        if (productAchievement) {
                            if(row.input_type===global.INPUT_TYPE[1] && row.name === AdditionalTarget.PRODUCT) row.total_achieved = productAchievement.total_quantity;
                            else row.total_achieved = productAchievement.total_net_amount_with_tax;
                        }
                        if(categoryAchievement){
                            if(row.input_type===global.INPUT_TYPE[1] && row.name === AdditionalTarget.CATEGORY) row.total_achieved = categoryAchievement.total_quantity;
                            else row.total_achieved = categoryAchievement.total_net_amount_with_tax;
                        }         
                        
                        row.progress = calculatePercentage(row.total_achieved, row.target_value);
                        row.status = targetProgressStatus(row.progress);
                    }
                    
                });
                
                for (let row of AdditionalTargetArray) {
                    
                    const functionName = row.function;
                    
                    await this.updateTargetData(
                        additionalTargets,
                        row.name,
                        functionName,
                        req,
                        params
                    );
                }
            }
            
            
            let customer_achievement_summary:Record<string,any>[]=[];
            if(req.url.includes(global.MODULE_ROUTES[26]) && params.activeTab === ActiveTabEnum.OVERVIEW){
                customer_achievement_summary = await this.customerWiseAchievement(req,params,result,customerData);
            }
            
            return {
                overall_summary,
                additional_target:additionalTargets,
                customer_achievement_summary,
            }
            
        } catch (error) {
            throw error
        }
    }
    async customerWiseAchievement(
        req: any, params: any,result:Record<string,any>,
        customerData:Record<string,any>=[]
    ): Promise<any> {
        try {
            
            const targetData:Record<string,any>[]= await this.customerWiseTarget(req,params,result);
            
            const customerAchievementData = await this.globalAchievementService.getPrimarySaleAchievement(req, params,TargetTypeEnum.CUSTOMER);
            
            const enrichedCustomers = targetData.map((target: any) => {
                const total_target =target?.total_target_value || 0
                const achievement = customerAchievementData?.find(
                    (a: any) => a.customer_id.toString() === target.customer_id.toString()
                );
                const total_achieved = achievement?.total_net_amount_with_tax || 0
                const progress = calculatePercentage(total_achieved,total_target)
                const customer = customerData?.find(
                    (c: any) => c.customer_id.toString() === target.customer_id.toString()
                );
                
                return {
                    ...customer,
                    total_target,
                    total_achieved,
                    progress,
                    status:targetProgressStatus(progress)
                };
            });
            
            return enrichedCustomers
            
        } catch (error) {
            throw error
        }
    }
    
    async customerWiseTarget(req: any, params: any,result:Record<string,any>): Promise<any> {
        try {
            const {customer_ids,dateMatch} = params;
            
            const targetData: Record<string, any>[] = await this.targetModel.aggregate([
                {
                    $match: {
                        org_id: req['user']['org_id'],
                        is_delete: 0,
                        assign_to_id: { $in: customer_ids },
                        ...dateMatch
                    }
                },
                {
                    $project: {
                        customer_id: "$assign_to_id",
                        sale_value: 1,
                        additional_target: {
                            $filter: {
                                input: "$additional_target",
                                as: "target",
                                cond: { $eq: ["$$target.name", AdditionalTarget.PRIMARY_SALE_TARGET] }
                            }
                        }
                    }
                },
                {
                    $addFields: {
                        target_value: {
                            $toDouble: {
                                $ifNull: [
                                    { $arrayElemAt: ["$additional_target.target_value", 0] },
                                    "0"
                                ]
                            }
                        }
                    }
                },
                {
                    $addFields: {
                        total_target_value: { $add: ["$sale_value", "$target_value"] }
                    }
                },
                {
                    $project: {
                        customer_id: 1,
                        sale_value: 1,
                        target_value: 1,
                        total_target_value:1
                    }
                }
            ]);
            return targetData
        } catch (error) {
            throw error
        }
    }
    
}
