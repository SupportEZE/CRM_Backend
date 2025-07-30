import { HttpStatus, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { CommentModel } from '../models/comment.model';
import { ResponseService } from 'src/services/response.service';
import { DropdownService } from 'src/modules/master/dropdown/web/dropdown.service';
import { toObjectId } from 'src/common/utils/common.utils';

@Injectable()
export class AppCommentService {
    constructor
        (
            @InjectModel(CommentModel.name) private commentModel: Model<CommentModel>,
            private readonly res: ResponseService,
            private readonly dropdownService: DropdownService,
        ) { }


    async saveComment(req: Request, params: any): Promise<any> {
        try {
            params.org_id = req['user']['org_id'];
            params.row_id = toObjectId(params.row_id);
            if (req?.url.includes(global.MODULE_ROUTES[9])) {
                params.module_id = global.MODULES['Site-Project']
                params.module_name = Object.keys(global.MODULES).find(key => global.MODULES[key] === global.MODULES['Site-Project']);
                params.module_type = global.MODULE_TYPE[1]
            }
            if (req?.url.includes(global.MODULE_ROUTES[10])) {
                params.module_id = global.MODULES['Enquiry']
                params.module_name = Object.keys(global.MODULES).find(key => global.MODULES[key] === global.MODULES['Enquiry']);
                params.module_type = global.MODULE_TYPE[1]
            }
            if (req?.url.includes(global.MODULE_ROUTES[1])) {
                params.module_id = global.MODULES['Ticket']
                params.module_name = Object.keys(global.MODULES).find(key => global.MODULES[key] === global.MODULES['Ticket']);
                params.module_type = global.MODULE_TYPE[1]
            }

            params.user_id = toObjectId(req['user']['_id']);
            params.user_name = req['user']['name'];
            const saveObj: Record<string, any> = {
                ...req['createObj'],
                ...params
            };
            const document = new this.commentModel(saveObj);
            await document.save();
            return this.res.success('SUCCESS.SAVE');
        } catch (error) {
            return this.res.error(HttpStatus.BAD_REQUEST, 'ERROR.BAD_REQ', error);
        }
    }

    async readComments(req: Request, params: any): Promise<any> {
        try {
            if (req?.url.includes(global.MODULE_ROUTES[9])) {
                params.module_id = global.MODULES['Site-Project']
                params.module_name = Object.keys(global.MODULES).find(key => global.MODULES[key] === global.MODULES['Site-Project']);
            }
            if (req?.url.includes(global.MODULE_ROUTES[10])) {
                params.module_id = global.MODULES['Enquiry']
                params.module_name = Object.keys(global.MODULES).find(key => global.MODULES[key] === global.MODULES['Enquiry']);
            }
            if (req?.url.includes(global.MODULE_ROUTES[11])) {
                params.module_id = global.MODULES['Ticket']
                params.module_name = Object.keys(global.MODULES).find(key => global.MODULES[key] === global.MODULES['Ticket']);
            }

            let match: Record<string, any> = {
                is_delete: 0,
                org_id: req['user']['org_id'],
                module_id: params.module_id,
                row_id: toObjectId(params.row_id)
            };

            let result: Record<string, any>[] = await this.commentModel.find(match).lean();
            return this.res.success('SUCCESS.FETCH', result.length ? result : []);
        } catch (error) {
            return this.res.error(HttpStatus.BAD_REQUEST, 'ERROR.BAD_REQ', error);
        }
    }

}