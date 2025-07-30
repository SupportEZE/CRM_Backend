import { Injectable, HttpCode, HttpStatus } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { SpinWinModel } from '../models/spin-win-model';
import { Model } from 'mongoose';
import { ResponseService } from 'src/services/response.service';
import { calculatePercentage, toObjectId } from 'src/common/utils/common.utils';
import { CustomerModel } from 'src/modules/master/customer/default/models/customer.model';
import { AppLedgerService } from '../../ledger/app/app-ledger.service';
import { SpinWinCustomersModel } from '../models/spin-win-customer.model';

@Injectable()
export class AppSpinWinService {
  constructor(
    @InjectModel(SpinWinModel.name) private spinWinModel: Model<SpinWinModel>,
    @InjectModel(SpinWinCustomersModel.name)
    private spinWinCustomersModel: Model<SpinWinCustomersModel>,
    @InjectModel(CustomerModel.name)
    private customerModel: Model<CustomerModel>,
    private readonly res: ResponseService,
    private readonly appLedgerService: AppLedgerService,
  ) {}

  async readCustomerSpin(req: Request, params: any): Promise<any> {
    try {
      const spinData = await this.spinWinModel
        .findOne({
          customer_type_name: { $in: [req['user']['customer_type_name']] },
          status: global.STATUS[1],
          org_id: req['user']['org_id'],
        })
        .exec();

      if (!spinData) {
        return this.res.error(HttpStatus.NOT_FOUND, 'SPIN.NO_SPIN_AVAILABLE');
      }

      const lastScanData = await this.getLastScanDate(req['user']['_id']);

      let lastSpinDate: Date | null = null;
      let currentDay = 0;
      let isEligible = true;

      if (lastScanData && lastScanData.created_at) {
        lastSpinDate = new Date(lastScanData.created_at);

        const currentDate = new Date();
        const diffTime = currentDate.getTime() - lastSpinDate.getTime();
        const diffDays = Math.floor(diffTime / (1000 * 3600 * 24));

        currentDay = diffDays;
        isEligible = diffDays >= spinData.eligible_days;
      }

      const cappedDay = Math.min(currentDay, spinData.eligible_days);
      const percentage = calculatePercentage(cappedDay, spinData.eligible_days);

      const slabPoints = spinData.slab_data.map((slab) => slab.slab_point);
      const maxSlabPoint = Math.max(...slabPoints);
      const minSlabPoint = Math.min(...slabPoints);

      const recentSpins = await this.recentFiveSpins(req, params);

      const result = {
        spin_id: spinData._id,
        slab_data: spinData.slab_data,
        max_spin_point: maxSlabPoint,
        min_spin_point: minSlabPoint,
        percentage,
        current_day: currentDay,
        eligible_days: spinData.eligible_days,
        recent_spin: recentSpins,
        is_eligible: isEligible,
      };

      return this.res.success('SUCCESS.FETCH', result);
    } catch (error) {
      return this.res.error(HttpStatus.BAD_REQUEST, 'ERROR.BAD_REQ', error);
    }
  }

  async getLastScanDate(customerId: string): Promise<any> {
    const lastScan = await this.spinWinCustomersModel
      .findOne({ customer_id: customerId }, {}, { sort: { created_at: -1 } })
      .exec();

    return lastScan;
  }

  async saveSpinWin(req: any, params: any): Promise<any> {
    try {
      const spinPoint: number = params.spin_point;

      if (!spinPoint) {
        return this.res.error(HttpStatus.BAD_REQUEST, 'SPIN.POINT_MISSING');
      }

      if (req['user']['profile_status'] !== global.APPROVAL_STATUS[1]) {
        return this.res.error(HttpStatus.FORBIDDEN, 'CUSTOMER.NOT_APPROVED');
      }

      const spinData = await this.spinWinModel
        .findOne({
          _id: toObjectId(params.spin_id),
          customer_type_name: { $in: [req['user']['customer_type_name']] },
          status: global.STATUS[1],
          org_id: req['user']['org_id'],
        })
        .exec();

      if (!spinData) {
        return this.res.error(HttpStatus.NOT_FOUND, 'SPIN.NO_SPIN_AVAILABLE');
      }

      const lastScanData = await this.getLastScanDate(req['user']['_id']);
      let isEligible = true;

      if (lastScanData && lastScanData.created_at) {
        const lastSpinDate = new Date(lastScanData.created_at);
        const currentDate = new Date();
        const diffDays = Math.floor(
          (currentDate.getTime() - lastSpinDate.getTime()) / (1000 * 3600 * 24),
        );
        isEligible = diffDays >= spinData.eligible_days;

        if (!isEligible) {
          return this.res.error(HttpStatus.FORBIDDEN, 'SPIN.NOT_ELIGIBLE');
        }
      }

      const spinCustomers = {
        ...req['createObj'],
        spin_id: toObjectId(params.spin_id),
        customer_id: req['user']['_id'],
        customer_name: req['user']['customer_name'],
        points: spinPoint,
      };

      const document = new this.spinWinCustomersModel(spinCustomers);
      await document.save();

      const dateStr = new Date().toISOString().split('T')[0].replace(/-/g, '');
      const ledgerParams = {
        customer_id: req['user']['_id'],
        customer_name: req['user']['customer_name'],
        login_type_id: req['user']['login_type_id'],
        customer_type_id: toObjectId(req['user']['customer_type_id']),
        transaction_type: global.TRANSACTION_TYPE[0],
        points: spinPoint,
        remark: 'Spin & Win',
        transaction_id: `${spinData.id}-${dateStr}`,
        creation_type: global.CREATION_TYPE[8],
      };
      await this.appLedgerService.create(req, ledgerParams);
      return this.res.success('SUCCESS.CREATE');
    } catch (error) {
      return this.res.error(HttpStatus.BAD_REQUEST, 'ERROR.BAD_REQ', error);
    }
  }

  async recentFiveSpins(req: Request, params: any): Promise<any> {
    try {
      let match: any = {
        is_delete: 0,
        org_id: req['user']['org_id'],
        customer_id: req['user']['_id'],
      };
      const result: Record<string, any>[] = await this.spinWinCustomersModel
        .find(match)
        .select('created_at points')
        .sort({ created_at: -1 })
        .limit(5);
      return result;
    } catch (error) {
      return this.res.error(HttpStatus.BAD_REQUEST, 'ERROR.BAD_REQ', error);
    }
  }
}
