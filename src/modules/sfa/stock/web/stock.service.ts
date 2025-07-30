import { HttpStatus, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { StockAuditModel } from '../models/stock-audit.model';
import  { Model } from 'mongoose';
import { ResponseService } from 'src/services/response.service';
import { toObjectId, commonFilters, nextSeq } from 'src/common/utils/common.utils';
import { SharedCustomerService } from 'src/modules/master/customer/shared-customer.service';
import { SharedUserService } from 'src/modules/master/user/shared-user.service';


@Injectable()
export class StockService {
    constructor(
        @InjectModel(StockAuditModel.name) private stockauditModel: Model<StockAuditModel>,
        private readonly res: ResponseService,
        private readonly sharedCustomerService: SharedCustomerService,
        private readonly sharedUserService: SharedUserService,
    ) { }
    
    async createstockAudit(req: any, params: any): Promise<any> {
        try {
            const { customer_id, customer_type_id } = params;

            const seq = {
                modelName: this.stockauditModel,
                idKey: 'audit_no',
                prefix: 'AUD'
            }

            const audit_no =  await nextSeq(req,seq)
            
            const saveObj: Record<string, any> = {
                ...req['createObj'],
                ...params,
                customer_type_id: toObjectId(customer_type_id),
                customer_id: toObjectId(customer_id),
                audit_by_id: req['user']['_id'],
                audit_by_name: req['user']['name'],
                audit_no,
            };
            
            const document = new this.stockauditModel(saveObj);
            const insert = await document.save();
            return this.res.success('SUCCESS.CREATE', { inserted_id: insert._id });
        } catch (error) {
            return this.res.error(HttpStatus.BAD_REQUEST, 'ERROR.BAD_REQ', error);
        }
    }
    
    async readstockAudit(req: Request, params: any): Promise<any> {
        try {
            let match: any = { is_delete: 0, org_id: req['user']['org_id'] };
            let sorting: Record<string, 1 | -1> = { _id: -1 };
            
            if (params?.sorting && Object.keys(params.sorting).length !== 0) sorting = params.sorting;
            
            const filters: Record<string, any> = commonFilters(params?.filters);
            match = { ...match, ...filters };
            
            if(global.LOGIN_TYPE_ID_PERMISSION?.includes(req['user']['login_type_id'])){
                const userIds = await this.sharedUserService.getUsersIds(req,params);
                match.created_id = {
                    $in : userIds
                }
            }
            
            const page: number = params?.page || global.PAGE;
            const limit: number = params?.limit || global.LIMIT;
            const skip: number = (page - 1) * limit;
            
            const pipeline = [
                { $match: match },
                { $sort: sorting },
                { $project: { created_unix_time: 0 } }
            ];
            
            const totalCountData: Record<string, any>[] = await this.stockauditModel.aggregate([
                ...pipeline,
                { $count: "totalCount" },
            ]);
            
            const total: number = totalCountData.length > 0 ? totalCountData[0].totalCount : 0;
            let result = await this.stockauditModel.find(match).skip(skip).limit(limit).sort(sorting).lean();
            
            const customerIds = result.map(r => r.customer_id).filter(Boolean);
            params.customer_ids = customerIds;
            const customerData = await this.sharedCustomerService.getCustomersByIds(req,params);
            
            const customerMap = new Map<string, string>(
                customerData.map(c => [String(c._id), c.mobile])
            );
            
            result = result.map(item => {
                const total_product_audit = Array.isArray(item.audit_report) ? item.audit_report.length : 0;
                const total_product_qty = Array.isArray(item.audit_report)
                ? item.audit_report.reduce((sum, report) => sum + (Number(report.stock) || 0), 0)
                : 0;
                
                const customerMobile = customerMap.get(String(item.customer_id)) || '';
                
                return {
                    ...item,
                    total_product_audit,
                    total_product_qty,
                    mobile_number: customerMobile,
                };
            });
            
            return this.res.pagination(result, total, page, limit);
            
        } catch (error) {
            return this.res.error(HttpStatus.BAD_REQUEST, 'ERROR.BAD_REQ', error);
        }
    }
    
    async detailstockAudit(req: Request, params: any): Promise<any> {
        try {
            params._id = toObjectId(params._id)
            const match: Record<string, any> = { org_id: req['user']['org_id'], _id: params._id, is_delete: 0 }
            
            const result: Record<string, any> = await this.stockauditModel.findOne(match).lean();
            
            return this.res.success('SUCCESS.FETCH', result);
        } catch (error) {
            return this.res.error(HttpStatus.BAD_REQUEST, 'ERROR.BAD_REQ', error)
        }
    }    
}

