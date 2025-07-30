import { HttpStatus, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { ResponseService } from 'src/services/response.service';
import { InsideBannerModel } from './model/inside-banner.model';

@Injectable()
export class InsideBannerService {
    constructor
        (
            @InjectModel(InsideBannerModel.name) private insideBannerModel: Model<InsideBannerModel>,
            private readonly res: ResponseService,
        ) { }

    async read(req: Request, params: any): Promise<any> {
        try {
            const { banner_name } = params;
            const orgId = req['user']?.['org_id'] || 0;
            const langCode = req['headers']['accept-language'] || 'en';

            if (!banner_name) {
                return ('WARNING.NOT_FOUND');
            }

            let banner = await this.insideBannerModel
                .findOne({ org_id: orgId, banner_name })
                .lean();

            if (!banner) {
                banner = await this.insideBannerModel
                    .findOne({ org_id: 0, banner_name })
                    .lean();
            }

            if (!banner) {
                return ('WARNING.NOT_FOUND');
            }

            const languageData = banner.banner_details?.[langCode];

            if (!languageData) {
                return ('WARNING.LANGUAGE_NOT_FOUND');
            }

            return {
                ...languageData,
                banner_url: banner.banner_url,
            }

        } catch (error) {
            throw error
        }
    }

}
