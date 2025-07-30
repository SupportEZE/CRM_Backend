import { HttpStatus,Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { PrivacyPolicyModel } from '../models/privacy-policy.model';
import { Model } from 'mongoose';
import { ResponseService } from 'src/services/response.service';

@Injectable()
export class AppPrivacyPolicyService {
  constructor(
    @InjectModel(PrivacyPolicyModel.name) private privacyPolicyModel: Model<PrivacyPolicyModel>,
    private readonly res: ResponseService
  ) {}

  async read(req: Request, params: any): Promise<any> {
    try {
      const data = await this.privacyPolicyModel.findOne({ org_id:req['user']['org_id'] }).exec();
      return this.res.success('SUCCESS.FETCH',data);
    } catch (error) {
      return this.res.error(HttpStatus.BAD_REQUEST, 'ERROR.BAD_REQ',error);
    }
  }
}
