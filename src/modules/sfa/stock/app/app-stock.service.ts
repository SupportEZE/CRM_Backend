import { HttpStatus, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { StockAuditModel } from '../models/stock-audit.model';
import { Model } from 'mongoose';
import { ResponseService } from 'src/services/response.service';
import { toObjectId, appCommonFilters, nextSeq } from 'src/common/utils/common.utils';
import { SharedCustomerService } from 'src/modules/master/customer/shared-customer.service';
@Injectable()
export class AppStockService {
  constructor(
    @InjectModel(StockAuditModel.name) private stockauditModel: Model<StockAuditModel>,
    private readonly res: ResponseService,
    private readonly sharedCustomerService: SharedCustomerService,
  ) { }
  
  async createstockAudit(req: any, params: any): Promise<any> {
    try {
      
      const { customer_id, customer_name, customer_type_id } = params;
      let match: Record<string, any> = { is_delete: 0, org_id: req['user']['org_id'], audit_by_id: req['user']['_id'], customer_name: customer_name };
      const exist: Record<string, any>[] = await this.stockauditModel.find(match).exec();
      // if (exist.length > 0) return this.res.error(HttpStatus.BAD_REQUEST, 'WARNING.ALREADY_EXIST');
      const seq = {
        modelName: this.stockauditModel,
        idKey: 'audit_no',
        prefix: 'AUD'
      }
      
      const audit_no =  await nextSeq(req,seq)
      
      if(params?.visit_activity_id) params.visit_activity_id = toObjectId(params.visit_activity_id)
        
      const saveObj: Record<string, any> = {
        ...req['createObj'],
        ...params,
        customer_id: toObjectId(customer_id),
        audit_by_id: req['user']['_id'],
        audit_by_name: req['user']['name'],
        customer_type_id: toObjectId(customer_type_id),
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
      let match: Record<string, any> = { is_delete: 0, org_id: req['user']['org_id'], audit_by_id: req['user']['_id'] };
      let sorting: Record<string, 1 | -1> = { _id: -1 };
      if (params?.filters?.search) {
        const fieldsToSearch = ["customer_name", "req_id",'customer_type_name','audit_no'];
        const searchQuery = appCommonFilters(params.filters, fieldsToSearch);
        match = { ...match, ...searchQuery };
      }
      
      const page: number = params?.page || global.PAGE;
      const limit: number = params?.limit || global.LIMIT;
      const skip: number = (page - 1) * limit;
      
      const total = await this.stockauditModel.countDocuments(match);
      let result = await this.stockauditModel.find(match)
      .skip(skip)
      .limit(limit)
      .sort(sorting)
      .lean()
      .exec();
      
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
      const audit_by_id = req['user']['_id']
      const match: Record<string, any> = { org_id: req['user']['org_id'], _id: params._id, audit_by_id: audit_by_id, is_delete: 0 }
      let data: Record<string, any> = await this.stockauditModel.findOne(match).lean();
      if (!data) {
        return this.res.error(HttpStatus.BAD_REQUEST, 'ERROR.NOT_FOUND');
      }
      
      data.total_product_audit = Array.isArray(data.audit_report) ? data.audit_report.length : 0;
      
      return this.res.success('SUCCESS.FETCH', data);
    } catch (error) {
      return this.res.error(HttpStatus.BAD_REQUEST, 'ERROR.BAD_REQ', error)
    }
  }
  
  
}

