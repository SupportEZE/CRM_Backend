import { Injectable, HttpStatus, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { ResponseService } from 'src/services/response.service';
import { TargetModel } from '../models/target.model';
import { TargetService } from '../web/target.service';
import { buildDateRange, calculatePercentage, getISTDateList, targetProgressStatus, tat, toIST, toObjectId } from 'src/common/utils/common.utils';
import { SharedUserService } from 'src/modules/master/user/shared-user.service';
import { GlobalAchievementService } from 'src/shared/global/achievement.service';
import { ActiveTabEnum } from '../web/dto/target.dto';

@Injectable()
export class AppTargetService {
    constructor(
        @InjectModel(TargetModel.name) private targetModel: Model<TargetModel>,
        private readonly res: ResponseService,
        private readonly targetService: TargetService,
        private readonly sharedUserService: SharedUserService,
        private readonly globalAchievementService: GlobalAchievementService,
        
    ) { }
    
    async read(req: any, params: any): Promise<any> {
        try {
          
            const match:Record<string,any> ={
                is_delete:0,
                org_id:req['user']['org_id'],
                assign_to_id:req['user']['_id']
            }
            let data:Record<string,any> = await this.targetModel.findOne(match,{_id:1}).sort({_id:-1}); 
            if(!data?._id)  return this.res.success('SUCCESS.FETCH', data); 
            data = await this.targetService.detail(req,{...params,_id:data._id});
            
            if(params.activeTab===ActiveTabEnum.TIMELINE){

                const {total_target,total_achieved} = data.overall_summary;
                const {start_date,end_date} = data.result;
                
                const getTargetAnalytics = this.getTargetAnalytics(
                    total_target,
                    total_achieved,
                    start_date,
                    end_date
                    
                );
                
                const dateWiseAchievement:Record<string,any>[] = await this.targetDateWiseTimeline(req,
                {
                    start : data?.result?.start_date,
                    end   : data?.result?.end_date,
                    total_target : data?.overall_summary?.total_target
                    
                },data?.result);
                data.date_wise_achievement = dateWiseAchievement
                data.target_analytics = getTargetAnalytics;
            }
            if(params?.internalCall) return data
            return this.res.success('SUCCESS.FETCH', data);
        } catch (error) {
            return this.res.error(HttpStatus.BAD_REQUEST, 'ERROR.BAD_REQ', error);
            
        }
    }
    async targetDateWiseTimeline(req: any, params: any,result:Record<string,any>): Promise<any> {
        try {
            const {start,end,total_target} = params
            const data:Record<string,any>[]  = getISTDateList(toIST(start,false),toIST(end,false));
            
            params.user_id = result.assign_to_id;
            params.internalCall = true
            const  customerData = await this.sharedUserService.getAssignJuniorsAndOwnCustomersDetail(req,params)
            
            let customerIds = customerData?.map((row:any)=>toObjectId(row.customer_id));
            params.customer_ids = customerIds;    
            
            for(let row of data){
                const match = buildDateRange('start_date', 'end_date', row.date, row.date)
                
                params.start = match?.start_date?.$gte;
                params.end = match?.end_date?.$lte;
                const customerAchievementData = await this.globalAchievementService.getPrimarySaleAchievement(req, params);
                
                const saleAmount = customerAchievementData.total_net_amount_with_tax ?? 0;
                const total_achieved = saleAmount;
                const progress = calculatePercentage(saleAmount,total_target);
                row.total_target = total_target 
                row.total_achieved = total_achieved
                row.progress = progress;
                row.status = targetProgressStatus(progress)
                row.day_left = tat(row.date,new Date(),'d')?.split(' ')?.[0] || 0;
            }
            return data;
        } catch (error) {
            throw error
        }
    }
    private getTargetAnalytics(
        total_target: number,
        total_achieved: number,
        start_date: Date,
        end_date: Date,
        today: Date = new Date()
    ) {
        const msPerDay = 1000 * 60 * 60 * 24;
        
        const total_days = Math.ceil((end_date.getTime() - start_date.getTime()) / msPerDay) + 1;
        
        const raw_days_passed = Math.floor((today.getTime() - start_date.getTime()) / msPerDay);
        const days_passed = Math.min(Math.max(raw_days_passed + 1, 1), total_days);
        
        const days_remaining = Math.max(total_days - days_passed, 0);
        
        let average_rate = Number((total_achieved / Math.max(days_passed, 1)).toFixed(2));
        const required_rate = Number(((total_target - total_achieved) / Math.max(days_remaining, 1)).toFixed(2));
        const prediction = calculatePercentage(100,required_rate)
        
        return {
            average_rate,
            required_rate,
            prediction,
            days_passed,
            days_remaining,
            total_days
        };
    }
    
}