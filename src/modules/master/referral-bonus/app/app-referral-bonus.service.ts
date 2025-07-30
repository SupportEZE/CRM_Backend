import { HttpStatus, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { ReferralBonusModel } from '../models/referral-bonus.model';
import { Model } from 'mongoose';
import { ResponseService } from 'src/services/response.service';
import { InsideBannerService } from 'src/shared/inside-banner/inside-banner.service';
import { toObjectId } from 'src/common/utils/common.utils';

@Injectable()
export class AppReferralBonusService {
  constructor(
    @InjectModel(ReferralBonusModel.name) private referralBonusModel: Model<ReferralBonusModel>,
    private readonly res: ResponseService,
    private readonly insideBannerService: InsideBannerService
  ) { }

  async read(req: Request, params: any): Promise<any> {
    try {
      let match: any = {
        is_delete: 0,
        org_id: req['user']['org_id'],
        customer_type_id: { $in: [(req['user']['customer_type_id'])] }
      };
      let sorting: Record<string, 1 | -1> = { _id: -1 };

      const result = await this.referralBonusModel.find(match)
        .sort(sorting)
        .lean();


      const modifiedResult = result.map((row: any) => {
        return {
          ...row,
          user_working_flow: global.BONUS_TYPES_USER_FLOW[row.bonus_type],
        };
      });

      params.banner_name = global.INSIDE_BANNER[1]
      const inside_banner = await this.insideBannerService.read(req, params);

      return this.res.success('SUCCESS.FETCH', { data: modifiedResult, banner: inside_banner });

    } catch (error) {
      return this.res.error(HttpStatus.BAD_REQUEST, 'ERROR.BAD_REQ', error);
    }
  }

}

