import { HttpStatus, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { BadgesModel } from '../models/badges.model';
import { Model } from 'mongoose';
import { ResponseService } from 'src/services/response.service';
import { BadgesService } from '../web/badges.service';
import { BadgeDocsModel } from '../models/badge-docs.model';
import { AppLedgerService } from '../../ledger/app/app-ledger.service';

@Injectable()
export class AppBadgesService {
    constructor(
        @InjectModel(BadgesModel.name) private badgesModel: Model<BadgesModel>,
        @InjectModel(BadgeDocsModel.name) private badgeDocsModel: Model<BadgeDocsModel>,
        private readonly res: ResponseService,
        private readonly badgesService: BadgesService,
        private readonly appLedgerService: AppLedgerService

    ) { }

    async read(req: Request, params: any): Promise<any> {
        try {
            const { org_id } = req['user'];
            let sorting: Record<string, 1 | -1> = { _id: -1 };
            const page: number = params?.page || global.PAGE;
            const limit: number = params?.limit || global.LIMIT;
            const skip: number = (page - 1) * limit;

            const match: Record<string, any> = {
                is_delete: 0,
                org_id,
                status: global.STATUS[1],
                customer_type_name: { $in: req['user']['customer_type_name'] }
            };

            const results: Record<string, any>[] = await this.badgesModel
                .find(match)
                .sort(sorting)
                .skip(skip)
                .limit(limit)
                .lean();

            const processedResults = await Promise.all(
                results.map(async (item) => {
                    item.files = await this.badgesService.getDocument(item._id, global.BIG_THUMBNAIL_IMAGE);

                    const start = item.start_date
                    const end = item.end_date
                    const custom_date_range = { start, end }
                    params.custom_date_range = custom_date_range
                    params.internalCall = true
                    const wallet = await this.appLedgerService.wallet(req, params)
                    item.total_earned = wallet.total_earned
                    return item;
                })
            );

            const data: any = {
                result: processedResults,
            };
            return this.res.success('SUCCESS.FETCH', data);
        } catch (error) {
            return this.res.error(HttpStatus.BAD_REQUEST, 'ERROR.BAD_REQ', error);
        }
    }
}
