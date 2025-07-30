import { Injectable, HttpStatus } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { LanguageModel } from './models/language.model';
import { UserModel } from '../user/models/user.model';
import mongoose, { Model, Types } from 'mongoose';
import { ResponseService } from 'src/services/response.service';
import { toObjectId, commonFilters } from 'src/common/utils/common.utils';

@Injectable()
export class LanguageService {
    constructor(
        @InjectModel(LanguageModel.name) private languageModel: Model<LanguageModel>,
        @InjectModel(UserModel.name) private userModel: Model<UserModel>,
        private readonly res: ResponseService
    ) { }

    async publicLanguage(): Promise<any> {
        try {
            const language: any = await this.languageModel.find({is_delete: 0 }).select('language_label language_code').exec();
            return this.res.success('SUCCESS.FETCH', language)
        } catch (error) {
            return this.res.error(HttpStatus.BAD_REQUEST, 'ERROR.BAD_REQ', error);
        }
    }

    async publicLanguageJson(params: any): Promise<any> {
        try {
            let match = {}
            match = {
                language_code: params || global.DEFAULT_LANG
            }
            const language: any = await this.languageModel.find(match).exec();
            return this.res.success('SUCCESS.FETCH', language)
        } catch (error) {
            return this.res.error(HttpStatus.BAD_REQUEST, 'ERROR.BAD_REQ', error);
        }
    }

    async privateLanguageJson(req: Request, params: any): Promise<any> {
        try {
            let match = {}
            match = {
                language_code: params || global.DEFAULT_LANG
            }
            const language: any = await this.languageModel.find(match).exec();

            await this.create(req, params)
            return this.res.success('SUCCESS.FETCH', language)
        } catch (error) {
            return this.res.error(HttpStatus.BAD_REQUEST, 'ERROR.BAD_REQ', error);
        }
    }

    async create(req: Request, params: any): Promise<any> {
        try {
            const updateObj = {
                ...req['updateObj'],
                "language_code": params || global.DEFAULT_LANG,
            };

            await this.userModel.updateOne(
                { _id: req['user']['_id'] },
                { $set: updateObj }
            );

            return this.res.success('SUCCESS.UPDATE')
        } catch (error) {
            return this.res.error(HttpStatus.BAD_REQUEST, 'ERROR.BAD_REQ', error);
        }
    }
}
