import { HttpStatus, Injectable } from '@nestjs/common';
import { DB_NAMES } from 'src/config/db.constant';
import { ResponseService } from 'src/services/response.service';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { DropdownService } from 'src/modules/master/dropdown/web/dropdown.service';
import { S3Service } from 'src/shared/rpc/s3.service';
import { SharedUserService } from 'src/modules/master/user/shared-user.service';
import { SharedCustomerService } from 'src/modules/master/customer/shared-customer.service';
import {
  commonFilters,
  nextSeq,
  tat,
  toObjectId,
} from 'src/common/utils/common.utils';
import {
  EnquiryAssignedType,
  OzoneEnquiryModel,
  OzoneEnquiryStatus,
} from '../models/ozone-enquiry.model';
import { OzoneEnquiryStageModel } from '../models/ozone-enquiry-stage.model';
import { OzoneEnquiryDocsModel } from '../models/ozone-enquiry-docs.model';
import { SharedActivityService } from 'src/modules/sfa/activity/shared-activity.service';
import { EnquiryStrategy } from '../../enquiry-strategy.interface';
import { OzoneQuotationModel } from 'src/modules/sfa/quotation/ozone/models/ozone-quotation.model';

@Injectable()
export class AppOzoneEnquiryService implements EnquiryStrategy {
  constructor(
    @InjectModel(OzoneEnquiryModel.name, DB_NAMES().CUSTOM_DB)
    private OzoneEnquiryModel: Model<OzoneEnquiryModel>,
    @InjectModel(OzoneEnquiryStageModel.name, DB_NAMES().CUSTOM_DB)
    private ozoneEnquiryStageModel: Model<OzoneEnquiryStageModel>,
    @InjectModel(OzoneEnquiryDocsModel.name, DB_NAMES().CUSTOM_DB)
    private ozoneEnquiryDocsModel: Model<OzoneEnquiryDocsModel>,
    private readonly res: ResponseService,
    private readonly dropdownService: DropdownService,
    private readonly s3Service: S3Service,
    private readonly sharedUserService: SharedUserService,
    private readonly sharedActivityService: SharedActivityService,
    private readonly sharedCustomerService: SharedCustomerService,
    @InjectModel(OzoneQuotationModel.name, DB_NAMES().CUSTOM_DB)
    private OzoneQuotationModel: Model<OzoneQuotationModel>,
  ) {}

  // async createEnquiry(req: Request, params: any): Promise<any> {
  //     try {
  //         if (req?.url.includes(global.MODULE_ROUTES[32])) {
  //             await this.assignBasedOnMappings(req, params);
  //         }
  //         if (params?.assigned_to_id) {
  //             params.assigned_to_id = toObjectId(params.assigned_to_id);
  //             params.assigned_to_name = params.assigned_to_name;
  //             params.assigned_to_type = params.assigned_to_type;
  //         }

  //         if (params.visit_activity_id) {
  //             params.visit_activity_id = toObjectId(params.visit_activity_id);
  //         }

  //         const seq = {
  //             modelName: this.OzoneEnquiryModel,
  //             idKey: 'enquiry_id',
  //             prefix: 'ENQ',
  //         };
  //         params.enquiry_id = await nextSeq(req, seq);
  //         params.status = OzoneEnquiryStatus.ENQUIRY;

  //         const saveObj: Record<string, any> = {
  //             ...req['createObj'],
  //             ...params
  //         };
  //         const document = new this.OzoneEnquiryModel(saveObj);
  //         const insert = await document.save();
  //         if (!insert?._id) {
  //             return this.res.error(HttpStatus.BAD_REQUEST, 'ERROR.BAD_REQ');
  //         }
  //         return this.res.success('SUCCESS.CREATE', { inserted_id: insert._id });
  //     } catch (error) {
  //         return this.res.error(HttpStatus.BAD_REQUEST, 'ERROR.BAD_REQ', error);
  //     }
  // }
  async createEnquiry(req: Request, params: any): Promise<any> {
    try {
      // ✅ Add org_id from the user to the params
      const orgId: number = req['user']['org_id'];
      params.org_id = orgId;

      if (req?.url.includes(global.MODULE_ROUTES[32])) {
        await this.assignBasedOnMappings(req, params);
      }

      if (params?.assigned_to_id) {
        params.assigned_to_id = toObjectId(params.assigned_to_id);
        params.assigned_to_name = params.assigned_to_name;
        params.assigned_to_type = params.assigned_to_type;
      }

      if (params.visit_activity_id) {
        params.visit_activity_id = toObjectId(params.visit_activity_id);
      }

      const seq = {
        modelName: this.OzoneEnquiryModel,
        idKey: 'enquiry_id',
        prefix: 'ENQ',
      };
      params.enquiry_id = await nextSeq(req, seq);
      params.status = OzoneEnquiryStatus.ENQUIRY;

      const saveObj: Record<string, any> = {
        ...req['createObj'],
        ...params,
      };

      const document = new this.OzoneEnquiryModel(saveObj);
      const insert = await document.save();
      if (!insert?._id) {
        return this.res.error(HttpStatus.BAD_REQUEST, 'ERROR.BAD_REQ');
      }
      return this.res.success('SUCCESS.CREATE', { inserted_id: insert._id });
    } catch (error) {
      return this.res.error(HttpStatus.BAD_REQUEST, 'ERROR.BAD_REQ', error);
    }
  }

  private async assignBasedOnMappings(
    req: Request,
    params: any,
  ): Promise<void> {
    const customerData =
      await this.sharedCustomerService.fetchCustomerStateMapping(req, params);

    if (customerData?.length) {
      params.assigned_to_type = EnquiryAssignedType.Distributor;
      params.assigned_to_id = toObjectId(customerData.customer_id);
      params.assigned_to_name = customerData.customer_name;
      return;
    }

    const userData = await this.sharedUserService.fetchUserStateMapping(
      req,
      params,
    );
    if (userData?.length) {
      params.assigned_to_type = EnquiryAssignedType.User;
      params.assigned_to_id = toObjectId(userData.user_id);
      params.assigned_to_name = userData.user_name;
      return;
    }

    const reportingManagerList =
      await this.sharedUserService.getReportingManager(req, params);
    if (reportingManagerList?.length) {
      const reportingManager = reportingManagerList[0];
      params.assigned_to_type = EnquiryAssignedType.ReportingManager;
      params.assigned_to_id = toObjectId(reportingManager.parent_user_id);
      params.assigned_to_name = reportingManager.parent_user_name;
    }
  }

  async getAllEnquiries(req: Request, params: any): Promise<any> {
    try {
      let match: Record<string, any> = { is_delete: 0 };
      let sorting: Record<string, 1 | -1> = { _id: -1 };

      if (
        params?.sorting &&
        typeof params.sorting === 'object' &&
        Object.keys(params.sorting).length !== 0
      ) {
        sorting = params.sorting;
      }
      if (params.activeTab) {
        const activeTab = params.activeTab;
        if (!Object.values(OzoneEnquiryStatus).includes(activeTab)) {
          return this.res.error(
            HttpStatus.BAD_REQUEST,
            'Invalid status filter',
          );
        }
        match.status = activeTab;
      }
      Object.assign(match, commonFilters(params.filters));

      const statusMatch: Record<string, any> = {
        is_delete: 0,
      };

      if (req?.url.includes(global.MODULE_ROUTES[32])) {
        match.created_id = req['user']['_id'];
        statusMatch.created_id = req['user']['_id'];
      }

      const page: number = parseInt(params?.page) || global.PAGE;
      const limit: number = parseInt(params?.limit) || global.LIMIT;
      const skip: number = (page - 1) * limit;

      const mainPipeline = [{ $match: match }, { $sort: sorting }];

      const statusAggregation: any = await this.OzoneEnquiryModel.aggregate([
        { $match: statusMatch },
        {
          $group: {
            _id: '$status',
            count: { $sum: 1 },
          },
        },
      ]);

      let defaultStatusCounts: Record<string, number> = {
        Enquiry: 0,
        Lead: 0,
        Meeting: 0,
        'Showroom Visit': 0,
        'Site Visit': 0,
        Quotation: 0,
        Win: 0,
        Lost: 0,
      };
      statusAggregation.forEach((item) => {
        if (defaultStatusCounts.hasOwnProperty(item._id)) {
          defaultStatusCounts[item._id] = item.count;
        }
      });

      defaultStatusCounts = Object.fromEntries(
        Object.entries(defaultStatusCounts).map(([key, value]) => [
          key.toLowerCase().replace(/\s+/g, '_').replace('&', 'and'),
          value,
        ]),
      );

      const totalCountData: any = await this.OzoneEnquiryModel.aggregate([
        ...mainPipeline,
        { $count: 'totalCount' },
      ]);

      const total: number =
        totalCountData.length > 0 ? totalCountData[0].totalCount : 0;

      let result: Record<string, any>[] =
        await this.OzoneEnquiryModel.aggregate([
          ...mainPipeline,
          { $skip: skip },
          { $limit: limit },
        ]);

      const finalData: any = {
        result,
        tabCounts: defaultStatusCounts,
      };
      return this.res.pagination(finalData, total, page, limit);
    } catch (error) {
      return this.res.error(HttpStatus.BAD_REQUEST, 'ERROR.BAD_REQ', error);
    }
  }

  async updateEnquiry(req: Request, params: any): Promise<any> {
    try {
      const { _id } = params;
      const exist = await this.OzoneEnquiryModel.findOne({ _id }).lean();
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

      const result = await this.OzoneEnquiryModel.updateOne({ _id }, updateObj);
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
      const orgId: number = req['user']['org_id'];
      const enquiryId = toObjectId(params._id);
      const currentStageLabel = params.status;

      params.module_id = global.MODULES['Enquiry'];
      params.dropdown_name = global.DROPDOWNS[4];
      params.internalCall = true;

      const stageList = (
        await this.dropdownService.readDropdown(req, params)
      ).map((stage, index) => ({ ...stage, sequence: index + 1 }));

      const currentStage = stageList.find(
        (stage) => stage.label === currentStageLabel,
      );
      if (!currentStage) {
        return this.res.error(HttpStatus.BAD_REQUEST, 'INVALID.STAGE');
      }

      const previousStages = stageList.filter(
        (stage) => stage.sequence < currentStage.sequence,
      );
      for (const prevStage of previousStages) {
        const prevMatch = {
          is_delete: 0,
          org_id: orgId,
          enquiry_id: enquiryId,
          stage: prevStage.label,
        };

        const existingPrev = await this.ozoneEnquiryStageModel
          .findOne(prevMatch)
          .lean();
        if (!existingPrev) {
          await new this.ozoneEnquiryStageModel({
            ...req['createObj'],
            enquiry_id: enquiryId,
            org_id: orgId,
            stage: prevStage.label,
            checked: true,
          }).save();
        }
      }

      const currentMatch = {
        is_delete: 0,
        org_id: orgId,
        enquiry_id: enquiryId,
        stage: currentStageLabel,
      };

      const existingCurrent =
        await this.ozoneEnquiryStageModel.findOne(currentMatch);

      const currentStageUpdate = {
        ...req['updateObj'],
        checked: true,
      };
      if (existingCurrent) {
        await this.ozoneEnquiryStageModel.updateOne(
          { _id: existingCurrent._id },
          currentStageUpdate,
        );
      } else {
        await new this.ozoneEnquiryStageModel({
          ...req['createObj'],
          enquiry_id: enquiryId,
          org_id: orgId,
          stage: currentStageLabel,
          checked: true,
        }).save();
      }

      const updatePayload: any = {
        ...req['updateObj'],
        status: currentStageLabel,
      };

      const fieldMappings = {
        enquiry: {
          remarks: 'enquiry_remarks',
          followup: 'enquiry_followup_date',
        },
        lead: { remarks: 'lead_remarks', followup: 'lead_followup_date' },
        meeting: {
          remarks: 'meeting_remarks',
          followup: 'meeting_followup_date',
        },
        showroomvisit: {
          remarks: 'showroom_visit_remarks',
          followup: 'showroom_visit_followup_date',
        },
        sitevisit: {
          remarks: 'site_visit_remarks',
          followup: 'site_visit_followup_date',
        },
        quotation: {
          remarks: 'quotation_remarks',
          followup: 'quotation_followup_date',
        },
        lost: { remarks: 'lost_remarks', followup: 'lost_followup_date' },
      };

      const normalizedStatus = currentStageLabel
        .toLowerCase()
        .replace(/\s+/g, '');
      let statusArray = [];
      if (currentStageLabel && stageList?.length) {
        const currentStageIndex = stageList.findIndex(
          (stage) =>
            stage.label.toLowerCase().replace(/\s+/g, '') === normalizedStatus,
        );

        // Slice from current stage onwards
        if (currentStageIndex >= 0) {
          statusArray = stageList.slice(currentStageIndex);
        } else {
          statusArray = stageList;
        }
      }
      const { remarks: remarksField, followup: followupField } =
        fieldMappings[normalizedStatus] || {};

      updatePayload.status = currentStageLabel;

      if (remarksField && params.remarks) {
        updatePayload[remarksField] = params.remarks;
      }

      if (followupField && params.followup_date) {
        updatePayload[followupField] = new Date(params.followup_date);
      }

      await this.OzoneEnquiryModel.updateOne({ _id: enquiryId }, updatePayload);

      return this.res.success('SUCCESS.STATUS_UPDATE');
    } catch (error) {
      return this.res.error(HttpStatus.BAD_REQUEST, 'ERROR.BAD_REQ', error);
    }
  }

  async detail(req: Request, params: any): Promise<any> {
    try {
      const exist = await this.OzoneEnquiryModel.findOne({
        _id: params._id,
      }).exec();
      if (!exist)
        return this.res.error(HttpStatus.BAD_REQUEST, 'WARNING.NOT_EXIST');

      let match: Record<string, any> = { is_delete: 0, _id: params._id };
      let result = (await this.OzoneEnquiryModel.findOne(
        match,
      ).lean()) as Record<string, any>;
      if (result) {
        params.module_id = global.MODULES['Enquiry'];
        params.dropdown_name = global.DROPDOWNS[4];
        params.internalCall = true;

        let stages = await this.dropdownService.readDropdown(req, params);
        const existingStages = await this.ozoneEnquiryStageModel
          .find({
            enquiry_id: toObjectId(params._id),
            is_delete: 0,
          })
          .lean();

        // if (existingStages.length === 0) {
        //   result.stages = stages.map((row: any) => ({
        //     label: row.label,
        //     value: row.value,
        //   }));
        // } else {
        //   const uncheckedStages: { label: string; value: string }[] = [];

        //   for (const row of stages) {
        //     const stageExist = existingStages.find(
        //       (s) => s.stage === row.label,
        //     );
        //     const isChecked = stageExist ? !!stageExist['checked'] : false;

        //     if (!isChecked) {
        //       uncheckedStages.push({ label: row.label, value: row.value });
        //     }
        //   }
        //   result.stages = uncheckedStages.length === 0 ? [] : uncheckedStages;
        // }

        const followupKeys = {
          Lead: 'lead_followup_date',
          Meeting: 'meeting_followup_date',
          'Showroom Visit': 'showroom_visit_followup_date',
          'Site Visit': 'site_visit_followup_date',
          Quotation: 'quotation_followup_date',
          Win: 'win_date',
          Lost: 'reason',
        };

        result.stages = stages.map((stage: any) => {
          const followupKey = followupKeys[stage.label];
          const isChecked = followupKey && Boolean(result[followupKey]);
          return {
            label: stage.label,
            value: stage.value,
            checked: isChecked,
          };
        });

        let currentStageObj = null;
        const statusHistory = [];

        for (const stage of result.stages) {
          if (stage.checked) {
            statusHistory.push(stage);
            currentStageObj = stage;
          }
        }

        result.status_history = statusHistory;
        result.current_stage = currentStageObj;

        const quotationStatus = result.status;

        // 🟡 Remove old 'status'
        delete result.status;

        // 🟡 Clean up followups/remarks except current stage
        if (currentStageObj) {
          const currentKey = currentStageObj.label
            .toLowerCase()
            .replace(/ /g, '_');

          for (const key of Object.keys(result)) {
            if (
              (key.endsWith('_remarks') || key.endsWith('_followup_date')) &&
              !key.startsWith(currentKey)
            ) {
              delete result[key];
            }
          }
        }

        let latestVisit = null;
        let latestCall = null;
        latestVisit =
          await this.sharedActivityService.fetchLatestVisitForEnquiry(
            req,
            params,
          );
        if (latestVisit) {
          latestVisit = { ...latestVisit, visit_type: 'visit' };
        }

        latestVisit =
          await this.sharedActivityService.fetchLatestCallForEnquiry(
            req,
            params,
          );
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
          const tat_days = tat(
            new Date(lastActivity.activity_date),
            new Date(),
          );
          lastActivity.tat_days = tat_days;
          result.last_activity = lastActivity;
        } else {
          result.last_activity = null;
        }
        result.files = await this.getDocument(
          result._id,
          global.THUMBNAIL_IMAGE,
        );

        const quotations = await this.OzoneQuotationModel.find({
          enquiry_id: result._id.toString(),
          is_delete: 0,
        }).lean();

        result.quotations = quotations;

        // 🟡 Optional: latestStage object from remarks/followups (if needed somewhere else)
        const stageKeys = [
          { stage: 'Quotation', key: 'quotation' },
          { stage: 'Site Visit', key: 'site_visit' },
          { stage: 'Showroom Visit', key: 'showroom_visit' },
          { stage: 'Meeting', key: 'meeting' },
          { stage: 'Lead', key: 'lead' },
          { stage: 'Enquiry', key: 'enquiry' },
          { stage: 'Lost', key: 'lost' },
        ];

        let latestStage = null;
        for (const s of [...stageKeys].reverse()) {
          if (result[`${s.key}_remarks`] || result[`${s.key}_followup_date`]) {
            latestStage = s.stage;
            break;
          }
        }
        result.status = quotationStatus || 'Enquiry';
        result.current_stage = currentStageObj; // keep current_stage too
      }
      return this.res.success('SUCCESS.FETCH', result);
    } catch (error) {
      return this.res.error(HttpStatus.BAD_REQUEST, 'ERROR.BAD_REQ', error);
    }
  }

  // async detail(req: Request, params: any): Promise<any> {
  //     try {
  //         const exist = await this.OzoneEnquiryModel.findOne({ _id: params._id }).exec();
  //         if (!exist) return this.res.error(HttpStatus.BAD_REQUEST, 'WARNING.NOT_EXIST');

  //         let match: Record<string, any> = {
  //             is_delete: 0,
  //             // org_id: req['user']['org_id'],
  //             _id: params._id
  //         };

  //         let result = await this.OzoneEnquiryModel.findOne(match).lean() as Record<string, any>;
  //         if (result) {
  //             // Get all existing stages for this enquiry
  //             const existingStages = await this.ozoneEnquiryStageModel.find({
  //                 enquiry_id: toObjectId(params._id),
  //                 is_delete: 0,
  //             }).lean();

  //             // Extract checked stages as "status"
  //             const statusArray: string[] = existingStages
  //                 .filter(stage => stage.checked)
  //                 .map(stage => stage.stage);

  //             result.status = statusArray; // ✅ This is what you want

  //             // Last activity (visit or call)
  //             let latestVisit = await this.sharedActivityService.fetchLatestVisitForEnquiry(req, params);
  //             if (latestVisit) latestVisit = { ...latestVisit, visit_type: 'visit' };

  //             let latestCall = await this.sharedActivityService.fetchLatestCallForEnquiry(req, params);
  //             if (latestCall) latestCall = { ...latestCall, visit_type: 'call' };

  //             if (latestVisit || latestCall) {
  //                 let lastActivity = null;

  //                 if (!latestVisit) {
  //                     lastActivity = latestCall;
  //                 } else if (!latestCall) {
  //                     lastActivity = latestVisit;
  //                 } else {
  //                     const visitDate = new Date(latestVisit.activity_date);
  //                     const callDate = new Date(latestCall.activity_date);
  //                     lastActivity = visitDate > callDate ? latestVisit : latestCall;
  //                 }

  //                 const tat_days = tat(new Date(lastActivity.activity_date), new Date());
  //                 lastActivity.tat_days = tat_days;
  //                 result.last_activity = lastActivity;
  //             } else {
  //                 result.last_activity = null;
  //             }

  //             result.files = await this.getDocument(result._id, global.THUMBNAIL_IMAGE);
  //         }

  //         return this.res.success('SUCCESS.FETCH', result);
  //     } catch (error) {
  //         return this.res.error(HttpStatus.BAD_REQUEST, 'ERROR.BAD_REQ', error);
  //     }
  // }

  async getDocument(
    id: any,
    type:
      | typeof global.FULL_IMAGE
      | typeof global.THUMBNAIL_IMAGE
      | typeof global.BIG_THUMBNAIL_IMAGE = global.FULL_IMAGE,
  ): Promise<any> {
    return this.s3Service.getDocumentsByRowId(
      this.ozoneEnquiryDocsModel,
      id,
      type,
    );
  }

  async getDocumentByDocsId(req: any, params: any): Promise<any> {
    const doc = await this.s3Service.getDocumentsById(
      this.ozoneEnquiryDocsModel,
      params._id,
    );
    return this.res.success('SUCCESS.FETCH', doc);
  }

  async findByExistEnquiry(req: Request, params: any): Promise<any> {
    try {
      const match: Record<string, any> = {
        contact_number: params.contact_number,
        is_delete: 0,
      };
      const projection: Record<string, any> = {
        contact_number: 1,
        enquiry_id: 1,
        product_type_required: 1,
        approx_value: 1,
        status: 1,
        created_at: 1,
        _id: 0,
      };

      const result = await this.OzoneEnquiryModel.find(
        match,
        projection,
      ).lean();

      if (!result || result.length === 0) {
        return this.res.error(HttpStatus.NOT_FOUND, 'ERROR.ENQUIRY_NOT_FOUND');
      }
      return this.res.success('SUCCESS.FOUND', result);
    } catch (error) {
      return this.res.error(
        HttpStatus.INTERNAL_SERVER_ERROR,
        'ERROR.INTERNAL',
        error,
      );
    }
  }
}
