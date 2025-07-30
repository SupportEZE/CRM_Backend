import { HttpStatus, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { BeatPlanModel } from '../models/beat-plan.model';
import { ResponseService } from 'src/services/response.service';
import { CustomerModel } from 'src/modules/master/customer/default/models/customer.model';
import { CustomerOtherDetailModel } from 'src/modules/master/customer/default/models/customer-other-detail.model';
import { BeatRouteModel } from 'src/modules/master/location-master/beat-route/models/beat-route.model';
import { VisitActivityModel } from '../../activity/models/visit-activity.model';
import { convertToUtcRange, toObjectId } from 'src/common/utils/common.utils';
import { CustomerService } from 'src/modules/master/customer/default/web/customer.service';
import { SharedCustomerService } from 'src/modules/master/customer/shared-customer.service';
import { log } from 'console';

@Injectable()
export class AppBeatPlanService {
  constructor(
    @InjectModel(BeatPlanModel.name)
    private beatPlanModel: Model<BeatPlanModel>,
    @InjectModel(CustomerModel.name)
    private customerModel: Model<CustomerModel>,
    @InjectModel(CustomerOtherDetailModel.name)
    private customerOtherDetailModel: Model<CustomerOtherDetailModel>,
    @InjectModel(BeatRouteModel.name)
    private beatRouteModel: Model<BeatRouteModel>,
    @InjectModel(VisitActivityModel.name)
    private visitActivityModel: Model<VisitActivityModel>,
    private readonly res: ResponseService,
    private readonly customerService: CustomerService,
    private readonly sharedCustomerService: SharedCustomerService,
  ) {}

  async read(req: Request, params: any): Promise<any> {
    try {
      const userId = toObjectId(req['user']['_id']);
      const orgId = req['user']['org_id'];

      const common: Record<string, any> = { is_delete: 0, org_id: orgId };
      const { start, end } = convertToUtcRange(params?.date ?? new Date());

      /* ───────────────── Beat‑plan for today ───────────────── */
      const todaysPlan: Record<string, any>[] = await this.beatPlanModel
        .find({
          ...common,
          user_id: userId,
          date: { $gte: start, $lt: end },
        })
        .lean();

      if (!todaysPlan.length) {
        return this.res.error(HttpStatus.BAD_REQUEST, 'ERROR.NOT_FOUND');
      }

      const beatRouteCodes = todaysPlan.map((b) => b.beat_code);

      /* ───────────────── Beat‑routes & customer‑ids ───────────────── */
      const beatRoutes: Record<string, any>[] = await this.beatRouteModel
        .find({ ...common, beat_route_code: { $in: beatRouteCodes } })
        .select('_id')
        .lean();
      const beatRouteIds = beatRoutes.map((r) => r._id);

      const customerMappings = await this.customerOtherDetailModel
        .find({
          ...common,
          beat_code_id: { $in: beatRouteIds },
          created_at: { $lte: end },
        })
        .select('customer_id')
        .lean();
      const customerIds = customerMappings.map((c) => c.customer_id);

      /* ───────────────── Customer details ───────────────── */
      const customers = await this.customerModel
        .find({
          _id: { $in: customerIds },
          ...common,
          created_at: { $lte: end },
        })
        .select(
          '_id created_id created_name customer_type_id customer_type_name customer_name mobile pincode country state district address status profile_status',
        )
        .lean();

      if (!customers.length) {
        return this.res.success('SUCCESS.FETCH', {
          beat_plan: todaysPlan,
          totalCount: 0,
          visitCount: 0,
          pendingCount: 0,
          visitPercent: 0,
          customerDetails: [],
        });
      }

      /* ───────────────── Batch‑fetch visits ───────────────── */
      const visitDocs = await this.visitActivityModel
        .find({
          customer_id: { $in: customerIds },
          ...common,
          created_at: { $lte: end },
          user_id: userId,
        })
        .select('customer_id')
        .lean();

      const visitedSet = new Set(
        visitDocs.map((v) => v.customer_id.toString()),
      );

      /* ───────────────── Parallel enrichment per customer ───────────────── */
      const thumbLabel = (global as any).FILES_LABEL?.[0] ?? 'thumbnail';

      await Promise.all(
        customers.map(async (c: any) => {
          c.visit_status = visitedSet.has(c._id.toString())
            ? 'Visited'
            : 'Pending';
          const files = await this.sharedCustomerService.getDocument(
            c._id,
            global.THUMBNAIL_IMAGE,
          );
          c.files = files?.find((f: any) => f.label === thumbLabel) ?? null;
        }),
      );

      /* ───────────────── Stats ───────────────── */
      const totalCount = customerIds.length;
      const visitCount = visitedSet.size;
      const pendingCount = totalCount - visitCount;
      const visitPercent = totalCount ? (visitCount / totalCount) * 100 : 0;

      return this.res.success('SUCCESS.FETCH', {
        beat_plan: todaysPlan,
        totalCount,
        visitCount,
        pendingCount,
        visitPercent,
        customerDetails: customers,
      });
    } catch (err: any) {
      return this.res.error(HttpStatus.BAD_REQUEST, 'ERROR.BAD_REQ', err);
    }
  }
}
