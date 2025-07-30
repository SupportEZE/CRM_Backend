import { HttpStatus, Inject, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { ResponseService } from 'src/services/response.service';
import { CustomerModel } from './default/models/customer.model';
import { SharedCustomerService } from './shared-customer.service';
import { TicketService } from '../ticket/web/ticket.service';
import { QrcodeService } from 'src/modules/loyalty/qr-code/web/qr-code.service';
import { SpinWinService } from 'src/modules/loyalty/spin-win/web/spin-win.service';
import { LedgerService } from 'src/modules/loyalty/ledger/web/ledger.service';
import { CustomerService } from './default/web/customer.service';
import {
  commonSearchFilter,
  convertToUtcRange,
  toObjectId,
} from 'src/common/utils/common.utils';

@Injectable()
export class DashboardService {
  constructor(
    @InjectModel(CustomerModel.name)
    private customerModel: Model<CustomerModel>,
    private readonly res: ResponseService,
    private readonly sharedCustomerService: SharedCustomerService,
    private readonly customerService: CustomerService,
    private readonly ticketService: TicketService,
    private readonly qrCodeService: QrcodeService,
    private readonly spinWinService: SpinWinService,
    private readonly ledgerService: LedgerService,
  ) {}

  async influencerDashboard(
    req: Request,
    params: Record<string, any>,
  ): Promise<any> {
    try {
      if (!params) params = {};
      const inputId = params.customer_id || params._id || req['user']?._id;
      params.customer_id = inputId;
      params._id = toObjectId(inputId);
      params.internalCall = true;

      const [
        profile_percentage,
        referral,
        ticketCount,
        scanCount,
        spinCount,
        rankResult,
        wallet,
        // getLast15DaysPoints,
        // getLast12MonthsPoints,
        // getYearlyPointsComparison,
      ] = await Promise.all([
        this.sharedCustomerService.profilePercentage(req, params),
        this.customerService.referralDetails(req, params),
        this.ticketService.ticketCount(req, params),
        this.qrCodeService.scanCount(req, params),
        this.spinWinService.spinCount(req, params),
        this.getRank(req, params),
        this.ledgerService.wallet(req, params),
        // this.qrCodeService.getLast15DaysPoints(req, params),
        // this.ledgerService.getLast12MonthsPoints(req, params),
        // this.ledgerService.getYearlyPointsComparison(req, params),
      ]);

      const data = {
        profile_percentage,
        ticketCount,
        scanCount: scanCount?.count || 0,
        scanPoints: scanCount?.total_points || 0,
        spinCount: spinCount?.count || 0,
        referralCount: Array.isArray(referral) ? referral.length : 0,
        rankCount: rankResult?.rank || 0,
        totalEarnedPoints: wallet?.total_points || 0,

        // scanBonusPoints: scanCount?.bonus_points || 0,
        // spinPoints: spinCount?.points || 0,
        // referralList: referral || [],
      };

      return this.res.success('SUCCESS.FETCH', data);
    } catch (error: any) {
      return this.res.error(HttpStatus.BAD_REQUEST, 'ERROR.BAD_REQ', error);
    }
  }

  async getRank(req: Request, params: any): Promise<any> {
    try {
      const orgId = req['user']['org_id'];
      const customerTypeName = params.customer_type_name;
      const targetCustomerId = toObjectId(
        params.customer_id || req['user']?._id,
      );

      // 🔹 Step 1: Get all customers of same type
      const customers = await this.customerModel
        .find(
          {
            customer_type_name: customerTypeName,
            org_id: orgId,
            is_delete: 0,
          },
          { _id: 1 },
        )
        .lean();

      if (!customers.length) {
        return { rank: 0 };
      }

      const customerIds = customers.map((c) => c._id);

      // 🔹 Step 2: Ledger se ek hi query mein points ka sum
      const pointsData = await this.ledgerService.getCustomerPointsRankingData(
        req,
        { customer_ids: customerIds },
      );

      // 🔹 Step 3: Sort in descending order of total_points
      pointsData.sort((a, b) => b.total_points - a.total_points);

      // 🔹 Step 4: Find the rank of the current customer
      const rank =
        pointsData.findIndex(
          (entry) =>
            entry.customer_id.toString() === targetCustomerId.toString(),
        ) + 1;

      return { rank: rank || 0 };
    } catch (error) {
      throw new Error(error?.message || 'Error calculating rank');
    }
  }

  async influencerDashboardStatistics(
    req: Request,
    params: Record<string, any>,
  ): Promise<any> {
    try {
      if (!params) params = {};
      const inputId = params.customer_id || params._id || req['user']?._id;
      params.customer_id = inputId;
      params._id = toObjectId(inputId);
      params.internalCall = true;

      const [
        getLast15DaysPoints,
        getYearlyPointsComparison,
        // getSocialPoints,
        // getLast12MonthsPoints,
      ] = await Promise.all([
        this.qrCodeService.getLast15DaysPoints(req, params),
        this.ledgerService.getYearlyPointsComparison(req, params),
        // this.sharedCustomerService.(req, params),
        // this.ledgerService.getLast12MonthsPoints(req, params),
      ]);

      const data = {
        getLast15DaysPoints,
        getYearlyPointsComparison,
        // getLast12MonthsPoints,
      };

      return this.res.success('SUCCESS.FETCH', data);
    } catch (error: any) {
      return this.res.error(HttpStatus.BAD_REQUEST, 'ERROR.BAD_REQ', error);
    }
  }
}
