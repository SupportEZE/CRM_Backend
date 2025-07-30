import { Injectable, HttpStatus } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { ResponseService } from 'src/services/response.service';
import { Lts } from 'src/shared/translate/translate.service';
import { toObjectId } from 'src/common/utils/common.utils';
import { SocialEngageCustomersModel } from '../models/social-engage-customer.model';
import { SocialEngageModel } from '../models/social-engage.model';
import { S3Service } from 'src/shared/rpc/s3.service';
import { SocialEngageDocsModel } from '../models/social-engage-docs.model';
import { InsideBannerService } from 'src/shared/inside-banner/inside-banner.service';

@Injectable()
export class AppSocialEngageCustomerService {
    constructor(
        @InjectModel(SocialEngageCustomersModel.name) private socialEngageCustomersModel: Model<SocialEngageCustomersModel>,
        @InjectModel(SocialEngageDocsModel.name) private socialEngageDocsModel: Model<SocialEngageDocsModel>,
        @InjectModel(SocialEngageModel.name) private socialEngageModel: Model<SocialEngageModel>,
        private readonly res: ResponseService,
        private readonly s3Service: S3Service,
        private readonly insideBannerService: InsideBannerService,
        private readonly lts: Lts
    ) { }

    async create(req: Request, params: any): Promise<any> {
        try {
            const exist = await this.socialEngageCustomersModel.findOne({
                social_engage_id: toObjectId(params.social_engage_id),
                customer_id: req['user']['_id'],
                status: {$ne: 'Reject'},
            }).exec();

            if (exist) {
                return this.res.error(HttpStatus.BAD_REQUEST, 'ERROR.BAD_REQ', 'Already Requested.');
            }

            let points = 0
            const social = await this.socialEngageModel.findOne({
                _id: toObjectId(params.social_engage_id),
            }).exec();

            if (social) {
                points = social.points
            }

            const saveObj = {
                ...req['createObj'],
                social_engage_id: toObjectId(params.social_engage_id),
                title: social.title,
                app_icon: social.app_icon,
                web_icon: social.web_icon,
                app_text_color: social.app_text_color,
                web_text_color: social.web_text_color,
                customer_id: req['user']['_id'],
                customer_name: req['user']['customer_name'],
                customer_type_name: req['user']['customer_type_name'],
                customer_mobile: req['user']['mobile'],
                customer_state: req['user']['state'],
                points: points,
                status: global.APPROVAL_STATUS[0]

            };

            const document = new this.socialEngageCustomersModel(saveObj);
            const insert = await document.save();

            const response = {
                inserted_id: insert._id,
                module_id: global.MODULES['Social Engagement'],
                module_name: Object.keys(global.MODULES).find(key => global.MODULES[key] === 20),
            }
            return this.res.success('SUCCESS.CREATE', response);
        } catch (error) {
            return this.res.error(HttpStatus.BAD_REQUEST, 'ERROR.BAD_REQ', error?.message || 'An unexpected error occurred.');
        }
    }

    async read(req: Request, params: any): Promise<any> {
        try {
            let match: Record<string, any> = { is_delete: 0, org_id: req['user']['org_id'], status: global.STATUS[1] };

            const result = await this.socialEngageModel.find(match)
                .exec();

            for (const socialEngage of result) {
                const userRequest = await this.socialEngageCustomersModel.findOne({
                    customer_id: req['user']['_id'],
                    social_engage_id: socialEngage._id,
                    status: { $ne: global.STATUS[2] }
                }).exec();
                socialEngage.request = userRequest ?? null;
            }
            params.banner_name = global.INSIDE_BANNER[5]
            const inside_banner = await this.insideBannerService.read(req, params);
            return this.res.success('SUCCESS.FETCH', { result, inside_banner });

        } catch (error) {
            return this.res.error(HttpStatus.BAD_REQUEST, 'ERROR.BAD_REQ', error?.message || 'An error occurred while fetching the data.');
        }
    }

    async upload(files: Express.Multer.File[], req: any): Promise<any> {
        try {
            req.body.module_name = Object.keys(global.MODULES).find(
                key => global.MODULES[key] === global.MODULES['Ticket']
            );
            let response = await this.s3Service.uploadMultiple(files, req, this.socialEngageDocsModel);
            return this.res.success('SUCCESS.CREATE', response);
        } catch (error) {
            return this.res.error(HttpStatus.BAD_REQUEST, 'Error uploading files to S3', error?.message || error
            );
        }
    }
}
