import { HttpStatus, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { BonusModel } from '../models/bonus.model';
import { Model } from 'mongoose';
import { ResponseService } from 'src/services/response.service';

@Injectable()
export class AppBonusService {
    constructor(
        @InjectModel(BonusModel.name) private bonusModel: Model<BonusModel>,
        private readonly res: ResponseService
    ) { }

    async read(req: Request, params: any): Promise<any> {
        try {
            const userState = req['user']['state'];
            const userDistrict = req['user']['district'];
            let sorting: Record<string, 1 | -1> = { _id: -1 };
            const gifts = await this.bonusModel
                .find({ state: { $in: userState }, district: { $in: userDistrict }, is_delete: 0 })
                .sort(sorting)
                .exec();

            const total = gifts.length;

            return this.res.success('SUCCESS.FETCH', { total, gifts });
        } catch (error) {
            return this.res.error(HttpStatus.BAD_REQUEST, 'ERROR.BAD_REQ', error);
        }
    }
}
