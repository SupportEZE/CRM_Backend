import { HttpStatus, Injectable } from '@nestjs/common';
import { DB_NAMES } from 'src/config/db.constant';
import { ResponseService } from 'src/services/response.service';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { DropdownService } from 'src/modules/master/dropdown/web/dropdown.service';
import { S3Service } from 'src/shared/rpc/s3.service';
import { SharedUserService } from 'src/modules/master/user/shared-user.service';
import {
  EnquiryAssignedType,
  EnquiryTypeTemp,
  OzoneEnquiryModel,
  OzoneEnquiryStatus,
} from '../models/ozone-enquiry.model';
import { OzoneEnquiryStageModel } from '../models/ozone-enquiry-stage.model';
import { OzoneEnquiryDocsModel } from '../models/ozone-enquiry-docs.model';
import { SharedActivityService } from 'src/modules/sfa/activity/shared-activity.service';
import { SharedCustomerService } from 'src/modules/master/customer/shared-customer.service';
import { EnquiryStrategy } from '../../enquiry-strategy.interface';
import {
  calculatePercentage,
  commonFilters,
  tat,
  toObjectId,
  nextSeqOzone,
} from 'src/common/utils/common.utils';
import { EnquiryStatus } from '../../default/models/enquiry.model';
import { OzoneQuotationModel } from '../../../quotation/ozone/models/ozone-quotation.model';

@Injectable()
export class OzoneEnquiryService implements EnquiryStrategy {
  constructor(
    @InjectModel(OzoneEnquiryModel.name, DB_NAMES().CUSTOM_DB)
    private OzoneEnquiryModel: Model<OzoneEnquiryModel>,
    @InjectModel(OzoneEnquiryStageModel.name, DB_NAMES().CUSTOM_DB)
    private ozoneEnquiryStageModel: Model<OzoneEnquiryStageModel>,
    @InjectModel(OzoneEnquiryDocsModel.name, DB_NAMES().CUSTOM_DB)
    private ozoneEnquiryDocsModel: Model<OzoneEnquiryDocsModel>,
    @InjectModel(OzoneQuotationModel.name, DB_NAMES().CUSTOM_DB)
    private OzoneQuotationModel: Model<OzoneQuotationModel>,

    private readonly res: ResponseService,
    private readonly dropdownService: DropdownService,
    private readonly s3Service: S3Service,
    private readonly sharedUserService: SharedUserService,
    private readonly sharedActivityService: SharedActivityService,
    private readonly sharedCustomerService: SharedCustomerService,
  ) {}

  async createEnquiry(req: Request, params: any): Promise<any> {
    try {
      const moduleRoute = global.MODULE_ROUTES?.[32];
      if (req?.url && moduleRoute && req.url.includes(moduleRoute)) {
        await this.assignBasedOnMappings(req, params);
      }

      if (
        params?.assigned_to_id &&
        params?.assigned_to_name &&
        params?.assigned_to_type
      ) {
        params.assigned_to = [
          {
            assigned_to_id: toObjectId(params.assigned_to_id),
            assigned_to_name: params.assigned_to_name,
            assigned_to_type: params.assigned_to_type,
            assigned_to_date: new Date(),
          },
        ];
        delete params.assigned_to_id;
        delete params.assigned_to_name;
        delete params.assigned_to_type;
      }

      if (params.visit_activity_id) {
        params.visit_activity_id = toObjectId(params.visit_activity_id);
      }

      const seq = {
        modelName: this.OzoneEnquiryModel,
        idKey: 'enquiry_id',
        prefix: 'ENQ',
      };
      params.enquiry_id = await nextSeqOzone(req, seq);
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

  async getAllEnquiries(req: any, params: any): Promise<any> {
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
      if (params?.activeTab) {
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

      const statusMatch: Record<string, any> = { is_delete: 0 };

      if (req?.url.includes(global.MODULE_ROUTES[32])) {
        match['assigned_to.assigned_to_id'] = req['user']['_id'];
        statusMatch['assigned_to.assigned_to_id'] = req['user']['_id'];
      }

      if (
        global.LOGIN_TYPE_ID_PERMISSION?.includes(req['user']['login_type_id'])
      ) {
        const userIds = await this.sharedUserService.getUsersIds(req, params);
        match.$or = [
          { 'assigned_to.assigned_to_id': { $in: userIds } },
          { created_id: { $in: userIds } },
        ];
        statusMatch.$or = [
          { 'assigned_to.assigned_to_id': { $in: userIds } },
          { created_id: { $in: userIds } },
        ];
      }

      const page: number = parseInt(params?.page) || global.PAGE;
      const limit: number = parseInt(params?.limit) || global.LIMIT;
      const skip: number = (page - 1) * limit;
      const mainPipeline: any[] = [
        { $match: match },
        { $sort: sorting },
        { $skip: skip },
        { $limit: limit },
        {
          $lookup: {
            from: 'crm_ozone_quotation',
            let: { enquiryId: '$_id' },
            pipeline: [
              {
                $match: {
                  $expr: {
                    $eq: ['$enquiry_id', { $toString: '$$enquiryId' }],
                  },
                },
              },
              {
                $project: {
                  quotation_id: 1,
                  enquiry_id: 1,
                  created_name: 1,
                  total_item: { $size: '$cart_item' },
                  total_qty: {
                    $sum: {
                      $map: {
                        input: '$cart_item',
                        as: 'item',
                        in: '$$item.qty',
                      },
                    },
                  },
                  total_amount: 1,
                },
              },
            ],
            as: 'quotation_info',
          },
        },
      ];

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
        { $match: match },
        { $count: 'totalCount' },
      ]);
      const total: number =
        totalCountData.length > 0 ? totalCountData[0].totalCount : 0;

      const result = await this.OzoneEnquiryModel.aggregate(mainPipeline);

      const finalData: any = {
        result,
        tabCounts: defaultStatusCounts,
      };
      return this.res.pagination(finalData, total, page, limit);
    } catch (error) {
      return this.res.error(HttpStatus.BAD_REQUEST, 'ERROR.BAD_REQ', error);
    }
  }

  async getAssignedEnquiries(req: any, params: any): Promise<any> {
    try {
      let match: Record<string, any> = { is_delete: 0 };
      let sorting: Record<string, 1 | -1> = { _id: -1 };
      const statusMatch: Record<string, any> = { is_delete: 0 };

      const projection: any = {
        _id: 1,
        enquiry_id: 1,
        quotation_number: 1,
        created_at: 1,
      };

      if (
        global.LOGIN_TYPE_ID_PERMISSION?.includes(req['user']['login_type_id'])
      ) {
        const userIds = await this.sharedUserService.getUsersIds(req, params);
        match.$or = [
          { 'assigned_to.assigned_to_id': { $in: userIds } },
          { created_id: { $in: userIds } },
        ];
        statusMatch.$or = [
          { 'assigned_to.assigned_to_id': { $in: userIds } },
          { created_id: { $in: userIds } },
        ];
      }
      const result = await this.OzoneEnquiryModel.find(
        match,
        projection,
      ).exec();

      return result;
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

      if (
        params?.assigned_to_id &&
        params?.assigned_to_name &&
        params?.assigned_to_type
      ) {
        const newAssignee = {
          assigned_to_id: toObjectId(params.assigned_to_id),
          assigned_to_name: params.assigned_to_name,
          assigned_to_type: params.assigned_to_type,
          assigned_to_date: new Date(),
        };

        if (!Array.isArray(params.assigned_to)) {
          params.assigned_to = [];
        }
        params.assigned_to.push(newAssignee);
        delete params.assigned_to_id;
        delete params.assigned_to_name;
        delete params.assigned_to_type;
      }

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

  async enquiryQuotationStatusUpdate(req: Request, params: any): Promise<any> {
    try {
      const enquiryId = toObjectId(params.enquiry_id);
      const currentStatus = params.status?.trim();
      const reason = params.reason || '';
      const winDate = params.status == OzoneEnquiryStatus.WIN ? new Date() : '';

      const updateObj: Record<string, any> = {
        ...req['updateObj'],
        status: currentStatus,
        reason: reason,
        ...(winDate && { win_date: winDate }),
      };

      const result = await this.OzoneEnquiryModel.updateOne(
        { _id: enquiryId },
        updateObj,
      );
    } catch (error) {
      return this.res.error(HttpStatus.BAD_REQUEST, 'ERROR.BAD_REQ', error);
    }
  }

  async getEnquiryDistributor(req: Request, params: any): Promise<any> {
    try {
      const enquiry = await this.OzoneEnquiryModel.findOne(
        { _id: params.enquiryId, is_delete: 0 },
        { assigned_to: 1 },
      );

      let distributorId = null;

      if (enquiry?.assigned_to?.length) {
        const distributor = enquiry.assigned_to.find(
          (a) => a.assigned_to_type === 'Distributor',
        );

        if (distributor) {
          distributorId = distributor.assigned_to_id;
        }
      }

      return distributorId;
    } catch (error) {
      return this.res.error(HttpStatus.BAD_REQUEST, 'ERROR.BAD_REQ', error);
    }
  }

  async statusUpdate(req: Request, params: any): Promise<any> {
    try {
      const enquiryId = toObjectId(params._id);
      const currentStageLabel = params.status?.trim();

      const updatePayload: any = {
        ...req['updateObj'],
        reason: params.reason || '',
        technical_designation: params.technical_designation,
      };

      if (params?.assigned_to_id) {
        const newAssignee = {
          assigned_to_id: toObjectId(params.assigned_to_id),
          assigned_to_name: params.assigned_to_name,
          assigned_to_type: params.assigned_to_type,
          assigned_to_date: new Date(),
        };
        updatePayload.$push = { assigned_to: newAssignee };
      }

      if (params?.platform) updatePayload.platform = params.platform;
      if (params?.app_id) updatePayload.app_id = params.app_id;
      console.log(currentStageLabel);

      if (currentStageLabel) {
        if (
          currentStageLabel === 'Quotation' &&
          params.created_by_type === 'technical'
        ) {
          await this.OzoneEnquiryModel.updateOne(
            { _id: enquiryId },
            updatePayload,
          );
          return this.res.success(
            'SUCCESS.STATUS_UPDATE_SKIPPED_FOR_TECHNICAL',
          );
        }

        Object.assign(params, {
          module_id: global.MODULES['Enquiry'],
          dropdown_name: global.DROPDOWNS[4],
          internalCall: true,
        });

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
        await Promise.all(
          previousStages.map(async (prevStage) => {
            const exists = await this.ozoneEnquiryStageModel
              .findOne({
                is_delete: 0,
                enquiry_id: enquiryId,
                stage: prevStage.label,
              })
              .lean();

            if (!exists) {
              await new this.ozoneEnquiryStageModel({
                ...req['createObj'],
                enquiry_id: enquiryId,
                stage: prevStage.label,
                checked: true,
              }).save();
            }
          }),
        );

        const currentStageMatch = {
          is_delete: 0,
          enquiry_id: enquiryId,
          stage: currentStageLabel,
        };

        const existingCurrent =
          await this.ozoneEnquiryStageModel.findOne(currentStageMatch);
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
            stage: currentStageLabel,
            checked: true,
          }).save();
        }

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
              stage.label.toLowerCase().replace(/\s+/g, '') ===
              normalizedStatus,
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

      const match: Record<string, any> = { is_delete: 0, _id: params._id };
      let result = (await this.OzoneEnquiryModel.findOne(
        match,
      ).lean()) as Record<string, any>;

      if (result) {
        params.module_id = global.MODULES['Enquiry'];
        params.dropdown_name = global.DROPDOWNS[4];
        params.internalCall = true;

        const stages = await this.dropdownService.readDropdown(req, params);
        const existingStages = await this.ozoneEnquiryStageModel
          .find({
            enquiry_id: toObjectId(params._id),
            is_delete: 0,
          })
          .lean();

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

        // 🟡 Extract current_stage and status_history
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

        // 🟡 Last activity logic
        let latestVisit =
          await this.sharedActivityService.fetchLatestVisitForEnquiry(
            req,
            params,
          );
        let latestCall =
          await this.sharedActivityService.fetchLatestCallForEnquiry(
            req,
            params,
          );

        if (latestVisit) latestVisit = { ...latestVisit, visit_type: 'visit' };
        if (latestCall) latestCall = { ...latestCall, visit_type: 'call' };

        if (latestVisit || latestCall) {
          let lastActivity = null;

          if (!latestVisit) lastActivity = latestCall;
          else if (!latestCall) lastActivity = latestVisit;
          else {
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

        customer_name: 1,
        customer_type: 1,
        company_name: 1,
        alternate_mobile_no: 1,
        email: 1,
        pincode: 1,
        city: 1,
        state: 1,
        country: 1,
        address: 1,
        site_pincode: 1,
        site_city: 1,
        site_state: 1,
        site_country: 1,
      };

      const enquiries = await this.OzoneEnquiryModel.find(match, projection)
        .sort({ created_at: -1 })
        .lean();

      if (!enquiries.length) {
        return this.res.success('SUCCESS.FOUND', []);
      }

      const latest = enquiries[0];
      const personalDetails: Record<string, any> = {
        contact_number: latest.contact_number,
        customer_name: latest.customer_name,
        customer_type: latest.customer_type,
        company_name: latest.company_name,
        alternate_mobile_no: latest.alternate_mobile_no,
        email: latest.email,
        pincode: latest.pincode,
        city: latest.city,
        state: latest.state,
        country: latest.country,
        address: latest.address,
        site_pincode: latest.site_pincode,
        site_city: latest.site_city,
        site_state: latest.site_state,
        site_country: latest.site_country,
      };

      const data = enquiries.map((item) => {
        const {
          customer_name,
          customer_type,
          company_name,
          alternate_mobile_no,
          email,
          pincode,
          city,
          state,
          country,
          address,
          site_pincode,
          site_city,
          site_state,
          site_country,
          contact_number,
          ...rest
        } = item;
        return rest;
      });

      return this.res.success('SUCCESS.FOUND', {
        personal_details: personalDetails,
        data: data,
      });
    } catch (error) {
      return this.res.error(
        HttpStatus.INTERNAL_SERVER_ERROR,
        'ERROR.INTERNAL',
        error,
      );
    }
  }

  async enquiryDashboard(req: Request, params: any): Promise<any> {
    try {
      const matchBase = {
        is_delete: 0,
        $or: [
          { assigned_to_id: req['user']['_id'] },
          { created_id: req['user']['_id'] },
        ],
        org_id: req['user']['org_id'],
      };

      const [result] = await this.OzoneEnquiryModel.aggregate([
        { $match: matchBase },
        {
          $group: {
            _id: null,
            total: { $sum: 1 },
            win: {
              $sum: {
                $cond: [{ $eq: ['$status', EnquiryStatus.WIN] }, 1, 0],
              },
            },
            last_win_updated_at: {
              $max: {
                $cond: [
                  { $eq: ['$status', EnquiryStatus.WIN] },
                  '$updated_at',
                  null,
                ],
              },
            },
          },
        },
      ]);
      const total = result?.total || 0;
      const win = result?.win || 0;
      const lastUpdatedAt = result?.last_win_updated_at;
      let tatOf = '0 days';
      if (lastUpdatedAt) tatOf = tat(lastUpdatedAt, new Date());
      return {
        total,
        win,
        progress: calculatePercentage(win, total),
        tat: tatOf,
      };
    } catch (error) {
      throw error;
    }
  }

  async fetchAssignedUsers(req: Request, params: any): Promise<any> {
    try {
      if (!params.district || params.district.trim() === '') {
        return this.res.error(HttpStatus.BAD_REQUEST, 'ERROR.CITY_REQUIRED');
      }

      const data: { assigned_to_id: string; assigned_to_name: string }[] = [];
      params.district = params.district.toUpperCase();
      let resolvedType:
        | EnquiryTypeTemp.Distributor
        | EnquiryAssignedType.User
        | null = null;

      /**
       * Helper function to fetch and format data
       */
      const fetchAndPush = async (
        type: EnquiryTypeTemp.Distributor | EnquiryAssignedType.User,
      ): Promise<boolean> => {
        let result: any[] = [];

        if (type === EnquiryTypeTemp.Distributor) {
          result = await this.sharedCustomerService.fetchCustomerStateMapping(
            req,
            params,
          );
          if (result?.length) {
            for (const r of result) {
              data.push({
                assigned_to_id: r.customer_id,
                assigned_to_name: r.customer_name,
              });
            }
            resolvedType = EnquiryTypeTemp.Distributor;
            return true;
          }
        } else if (type === EnquiryAssignedType.User) {
          result = await this.sharedUserService.fetchUserStateMapping(
            req,
            params,
          );
          if (result?.length) {
            for (const r of result) {
              data.push({
                assigned_to_id: r.user_id,
                assigned_to_name: r.user_name,
              });
            }
            resolvedType = EnquiryAssignedType.User;
            return true;
          }
        }

        return false;
      };

      if (!params.assigned_to_type) {
        // Priority: Distributor → User

        const hasDistributor = await fetchAndPush(EnquiryTypeTemp.Distributor);
        if (!hasDistributor) {
          await fetchAndPush(EnquiryAssignedType.User);
        }
      } else if (
        params.assigned_to_type === EnquiryAssignedType.Distributor ||
        params.assigned_to_type === EnquiryTypeTemp.Distributor
      ) {
        await fetchAndPush(EnquiryTypeTemp.Distributor);
      } else if (params.assigned_to_type === EnquiryAssignedType.User) {
        await fetchAndPush(EnquiryAssignedType.User);
      }

      // Fallback to reporting manager if no data found
      if (
        data.length === 0 &&
        !global.SYSTEM_USER_LOGIN_TYPES.includes(req['user']['login_type_id'])
      ) {
        const managers = await this.sharedUserService.getReportingManager(
          req,
          params,
        );
        if (managers?.length) {
          for (const manager of managers) {
            data.push({
              assigned_to_id: manager.parent_user_id,
              assigned_to_name: manager.parent_user_name,
            });
          }
          resolvedType = EnquiryAssignedType.User;
        }
      }

      return this.res.success('SUCCESS.FETCH', {
        assigned_to_type: resolvedType,
        data,
      });
    } catch (error) {
      return this.res.error(
        HttpStatus.INTERNAL_SERVER_ERROR,
        'ERROR.FETCH_FAILED',
        error,
      );
    }
  }

  async upload(files: Express.Multer.File[], req: any): Promise<any> {
    try {
      req.body.module_name = Object.keys(global.MODULES).find(
        (key) => global.MODULES[key] === global.MODULES['Enquiry'],
      );
      let response = await this.s3Service.uploadMultiple(
        files,
        req,
        this.ozoneEnquiryDocsModel,
      );
      return this.res.success('SUCCESS.CREATE', response);
    } catch (error) {
      return this.res.error(
        HttpStatus.BAD_REQUEST,
        'Error uploading files to S3',
        error?.message || error,
      );
    }
  }
}
