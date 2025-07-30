import { HttpStatus, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { TermsConditionsModel } from '../models/terms-conditions.model';
import { Model } from 'mongoose';
import { OrgModel } from 'src/modules/master/org/models/org.model';
import { ResponseService } from 'src/services/response.service';

@Injectable()
export class AppTermsConditionsService {
  constructor(
    @InjectModel(TermsConditionsModel.name) private termsConditionsModel: Model<TermsConditionsModel>,
    @InjectModel(OrgModel.name) private orgModel: Model<OrgModel>,
    private readonly res: ResponseService
  ) { }

  async read(req: Request, params: any): Promise<any> {
    try {
      const org = await this.orgModel.findOne({ app_id: params.app_id }).exec();
      const data = await this.termsConditionsModel.findOne({ org_id: org.org_id }).exec();
      return this.res.success('SUCCESS.FETCH', data);
    } catch (error) {
      console.error('Error in read method:', error);
      return this.res.error(HttpStatus.BAD_REQUEST, 'ERROR.BAD_REQ', error);
    }
  }
}
