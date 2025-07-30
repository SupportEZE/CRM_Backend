import { HttpStatus, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { CallRequestModel } from '../models/call-request.model';
import { Model } from 'mongoose';
import { ResponseService } from 'src/services/response.service';
import { toObjectId } from 'src/common/utils/common.utils';

@Injectable()
export class AppCallRequestService {
    constructor(
        @InjectModel(CallRequestModel.name) private callRequestModel: Model<CallRequestModel>,
        private readonly res: ResponseService
    ) { }

    async create(req: Request, params: any = {}): Promise<any> {
        try {
            const user = req['user'];
            const existingRequest = await this.callRequestModel.findOne({
                customer_id: toObjectId(user._id),
                status: global.CALL_REQUEST[1]
            });

            if (existingRequest) {
                return this.res.error(HttpStatus.CONFLICT, 'CALL.ALREADY_EXIST');
            }

            if (user.customer_name) {
                params.customer_type = user.customer_type_name;
                params.customer_name = user.customer_name;
            } else if (user.name) {
                params.customer_type = user.login_type_name;
                params.customer_name = user.name;
            } else {
                return this.res.error(HttpStatus.BAD_REQUEST, 'ERROR.BAD_REQ', 'Name missing');
            }  

            params.customer_id = user._id;
            params.customer_mobile = user.mobile;
            params.state = user?.state || null;
            params.status = global.CALL_REQUEST[1];

            const saveObj = {
                ...req['createObj'],
                ...params
            };

            const document = new this.callRequestModel(saveObj);
            await document.save();

            return this.res.success('CALL.CREATE');

        } catch (error) {
            return this.res.error(HttpStatus.BAD_REQUEST, 'ERROR.BAD_REQ', error);
        }
    }

}

