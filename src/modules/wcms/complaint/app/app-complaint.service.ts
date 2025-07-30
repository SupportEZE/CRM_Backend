import { Injectable, HttpStatus, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { ResponseService } from 'src/services/response.service';
import { ComplaintModel } from '../models/complaint.model';
import { ComplaintVisitModel } from '../models/complaint-visit.model';
import { ComplaintInspectionModel } from '../models/complaint-inspection.model';
import { ComplaintSparePartModel } from '../models/complaint-spare-part.model';
import { appCommonFilters, commonFilters, tat, toObjectId } from 'src/common/utils/common.utils';
import { COLLECTION_CONST } from 'src/config/collection.constant';
import { RedisService } from 'src/services/redis.service';
import { ActiveTab } from './dto/app-complaint.dto';
import { SharedCustomerService } from 'src/modules/master/customer/shared-customer.service';
import { ComplaintService } from '../web/complaint.service';
import { LocationService } from 'src/services/location.service';
import { SpareStockManageModel } from 'src/modules/wcms/spare-part/models/spare-stock-manage.model';
import { SparePartModel } from 'src/modules/wcms/spare-part/models/spare-part.model';
@Injectable()
export class AppComplaintService {

  constructor(
    @InjectModel(ComplaintModel.name) private complaintModel: Model<ComplaintModel>,
    @InjectModel(ComplaintInspectionModel.name) private complaintInspectionModel: Model<ComplaintInspectionModel>,
    @InjectModel(ComplaintVisitModel.name) private complaintVisitModel: Model<ComplaintVisitModel>,
    @InjectModel(ComplaintSparePartModel.name) private complaintSparePartModel: Model<ComplaintSparePartModel>,
    @InjectModel(SpareStockManageModel.name) private spareStockManageModel: Model<SpareStockManageModel>,
    @InjectModel(SparePartModel.name) private sparePartModel: Model<SparePartModel>,
    private readonly res: ResponseService,
    private readonly sharedCustomerService: SharedCustomerService,
    private readonly redisService: RedisService,
    private readonly complaintService: ComplaintService,
    private readonly locationService: LocationService,
  ) { }

  async read(req: Request, params: any): Promise<any> {
    try {
      let match: Record<string, any> = { is_delete: 0, org_id: req['user']['org_id'], service_engineer_id: toObjectId(req['user']['_id']) };
      let sorting: Record<string, 1 | -1> = { _id: -1 };
      if (params?.filters?.search) {
        const fieldsToSearch = ["customer_name", "req_id"];
        const searchQuery = appCommonFilters(params.filters, fieldsToSearch);
        match = { ...match, ...searchQuery };
      }

      if (params?.activeTab && params.activeTab !== "All") {
        match['status'] = params.activeTab;
      }

      const page: number = Math.max(1, parseInt(params?.page, 10) || global.PAGE);
      const limit: number = Math.max(1, parseInt(params?.limit, 10) || global.LIMIT);
      const skip: number = (page - 1) * limit;

      const total = await this.complaintModel.countDocuments(match);

      let result = await this.complaintModel.find(match).skip(skip).limit(limit).sort(sorting).lean();

      const allStatuses = ['Pending', 'Close', 'Cancel', 'All'];
      const tabWiseCounts = await this.complaintModel.aggregate([
        {
          $match: {
            is_delete: 0,
            org_id: req['user']['org_id'],
            service_engineer_id: req['user']['_id'],
          },
        },
        {
          $group: {
            _id: "$status",
            count: { $sum: 1 },
          },
        },
      ]);

      const rawStatusCounts = tabWiseCounts.reduce((acc, cur) => {
        acc[cur._id] = cur.count;
        return acc;
      }, {} as Record<string, number>);

      const status_counts = allStatuses.reduce((acc, status) => {
        acc[status] = rawStatusCounts[status] || 0;
        return acc;
      }, {} as Record<string, number>);

      status_counts['All'] = Object.values(status_counts).reduce((a, b) => a + b, 0);

      result = await Promise.all(
        result.map(async (item: any) => {
          const start = item.visit_date;
          const end = item.closing_date ?? new Date();

          item.tat = tat(start, end, 'd');
          item.files = await this.complaintService.getDocument(item._id, global.THUMBNAIL_IMAGE)
          return item;
        })
      );
      const data: any = { result, status_counts, };
      return this.res.pagination(data, total, page, limit);
    } catch (error) {
      return this.res.error(
        HttpStatus.BAD_REQUEST,
        'ERROR.BAD_REQ',
        error?.message || 'An error occurred while fetching the data.'
      );
    }
  }

  async rescheduleVisitDate(req: Request, params: any): Promise<any> {
    try {
      params._id = toObjectId(params._id);

      const exist = await this.complaintModel.findOne({ _id: params._id, is_delete: 0, service_engineer_id: req['user']['_id'] }).lean();
      if (!exist) return this.res.success('WARNING.NOT_EXIST');

      const updateObj = {
        ...req['updateObj'],
        visit_date: params.visit_date,
        reschedule_reason: params.reschedule_reason,
      };

      await this.complaintModel.updateOne({ _id: params._id }, updateObj);


      return this.res.success('SUCCESS.STATUS_UPDATE');
    } catch (error) {
      return this.res.error(HttpStatus.BAD_REQUEST, 'ERROR.BAD_REQ', error);
    }
  }

  async updateStatus(req: Request, params: any): Promise<any> {
    try {
      params._id = toObjectId(params._id);

      const exist = await this.complaintModel.findOne({ _id: params._id, is_delete: 0, service_engineer_id: req['user']['_id'] }).lean();
      if (!exist) return this.res.success('WARNING.NOT_EXIST');

      const updateObj = {
        ...req['updateObj'],
        status: params.status,
        reason: params.reason,
        status_updated_date: new Date
      };

      await this.complaintModel.updateOne({ _id: params._id }, updateObj);


      return this.res.success('SUCCESS.STATUS_UPDATE');
    } catch (error) {
      return this.res.error(HttpStatus.BAD_REQUEST, 'ERROR.BAD_REQ', error);
    }
  }

  async inspectionCreate(req: any, params: any): Promise<any> {
    try {
      const orgId = req['user']['org_id'];
      const { service_engineer_id, complaint_id, } = params;

      // Step 1: Check if complaint exists
      const complaint = await this.complaintModel.findOne({ is_delete: 0, org_id: orgId, _id: toObjectId(complaint_id), }).exec();

      if (!complaint) {
        return this.res.error(HttpStatus.BAD_REQUEST, 'COMPLAINT.COMPLAINT_NOT_FOUND');
      }

      // Step 2: Check if inspection already exists
      const inspectionExist = await this.complaintInspectionModel.findOne({ is_delete: 0, org_id: orgId, complaint_id: toObjectId(complaint_id), }).exec();

      if (inspectionExist) {
        return this.res.error(HttpStatus.BAD_REQUEST, 'COMPLAINT.INSPECTION_EXISTS');
      }

      // Step 3: Create new inspection
      const saveObj = {
        ...req['createObj'],
        ...params,
        complaint_id: toObjectId(complaint_id),
        service_engineer_id: toObjectId(service_engineer_id),
      };

      const document = new this.complaintInspectionModel(saveObj);
      const insert = await document.save();

      // Step 4: Update complaint model with inspection_status
      await this.complaintModel.updateOne(
        { _id: toObjectId(complaint_id) },
        {
          $set: {
            inspection_status: 'Done',
            inspection_date: new Date(),
            product_id: toObjectId(params.product_id),
            product_name: params.product_name,
            product_code: params.product_code,
          },
        }
      ).exec();

      return this.res.success('COMPLAINT.INSPECTION_CREATE', { inserted_id: insert._id });
    } catch (error) {
      return this.res.error(HttpStatus.BAD_REQUEST, 'ERROR.BAD_REQ', error);
    }
  }

  async visitStart(req: Request, params: any): Promise<any> {
    try {
      const userId = req['user']['_id'];
      const start_lat = params.start_lat;
      const start_lng = params.start_lng;

      if (!start_lat || !start_lng) {
        return this.res.error(HttpStatus.BAD_REQUEST, 'COMPLAINT.LAT_LONG');
      }

      const now = new Date();

      const visitData: Record<string, any> = {
        ...req['createObj'],
        ...params,
        visit_date: now,
        visit_start_time: now,
        complaint_id: toObjectId(params.complaint_id),
      };

      const visitDoc = new this.complaintVisitModel(visitData);
      const savedVisit = await visitDoc.save();

      // Set address 
      setImmediate(async () => {
        const start_address = await this.locationService.open_street(start_lat, start_lng);
        await this.complaintVisitModel.updateOne(
          { _id: savedVisit._id },
          { $set: { start_address } }
        );
      });

      // Update visit_flag 
      await this.complaintModel.updateOne(
        { _id: toObjectId(params.complaint_id) },
        { $set: { visit_flag: true } }
      );

      return this.res.success('COMPLAINT.STARTED');
    } catch (error) {
      return this.res.error(HttpStatus.BAD_REQUEST, 'ERROR.BAD_REQ', error);
    }
  }


  async visitEnd(req: Request, params: any): Promise<any> {
    try {
      const orgId = req['user']['org_id'];
      const { complaint_id, stop_lat, stop_lng } = params;

      if (!stop_lat || !stop_lng) {
        return this.res.error(HttpStatus.BAD_REQUEST, 'COMPLAINT.LAT_LONG');
      }

      const complaintId = toObjectId(complaint_id);
      const match: Record<string, any> = { org_id: orgId, complaint_id: complaintId, is_delete: 0, };

      const existingVisit = await this.complaintVisitModel.findOne(match);

      if (!existingVisit) {
        return this.res.error(HttpStatus.NOT_FOUND, 'ERROR.NOT_FOUND');
      }

      if (existingVisit.visit_stop_time) {
        return this.res.success('COMPLAINT.VISIT_EXIST', existingVisit);
      }

      // Update stop time and location
      existingVisit.visit_stop_time = new Date();
      existingVisit.stop_lat = stop_lat;
      existingVisit.stop_lng = stop_lng;
      await existingVisit.save();

      // Set visit_flag to false 
      await this.complaintModel.updateOne(
        { _id: complaintId },
        { $set: { visit_flag: false } }
      );

      // Set stop_address 
      setImmediate(async () => {
        try {
          const resolvedAddress = await this.locationService.open_street(stop_lat, stop_lng);
          await this.complaintVisitModel.updateOne(
            { _id: existingVisit._id },
            { $set: { stop_address: resolvedAddress } }
          );
        } catch (err) {
          console.error('Failed to fetch stop address:', err.message);
        }
      });

      return this.res.success('COMPLAINT.VISIT_ENDED');
    } catch (error) {
      return this.res.error(HttpStatus.BAD_REQUEST, 'ERROR.BAD_REQ', error);
    }
  }

  async addComplaintSpares(req: any, params: any): Promise<any> {
    try {
      const orgId = req['user']['org_id'];
      const assignedToId = req['user']['_id'];
      const assignedToName = req['user']['name'] || '';

      const { spares, complaint_id } = params;

      if (!spares || !Array.isArray(spares) || spares.length === 0) {
        return this.res.error(HttpStatus.BAD_REQUEST, 'COMPLAINT.SPARES_REQUIRED');
      }

      for (const spare of spares) {
        const productId = toObjectId(spare.product_id);

        const stock = await this.spareStockManageModel.findOne({ org_id: orgId, assigned_to_id: toObjectId(assignedToId), product_id: productId, });

        if (!stock || stock.stock_qty < spare.transaction_qty) {
          return this.res.error(HttpStatus.CONFLICT, ['INSUFFICIENT_STOCKS', { product_name: spare.product_name }]);
        }

        const updateObj = {
          ...req['updateObj'],
        };

        await this.spareStockManageModel.updateOne(
          {
            org_id: orgId,
            assigned_to_id: toObjectId(assignedToId),
            product_id: productId,
          },
          {
            $inc: { stock_qty: -spare.transaction_qty },
            $set: updateObj,
          }
        );

        const saveObj: Record<string, any> = {
          ...req['createObj'],
          ...params,
          complaint_id: toObjectId(complaint_id),
          product_id: productId,
          product_name: spare.product_name,
          transaction_qty: spare.transaction_qty,
          installattion_by_id: toObjectId(assignedToId),
          installattion_by_name: assignedToName,
        };
        const doc = new this.complaintSparePartModel(saveObj);
        await doc.save();
      }

      return this.res.success('COMPLAINT.SPARE_ADDED');
    } catch (error) {
      return this.res.error(HttpStatus.BAD_REQUEST, 'ERROR.BAD_REQ', error);
    }
  }

}
