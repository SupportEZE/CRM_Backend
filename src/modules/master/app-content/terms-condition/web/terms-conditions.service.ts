import { HttpStatus, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { TermsConditionsModel } from '../models/terms-conditions.model';
import { Model } from 'mongoose';
import { ResponseService } from 'src/services/response.service';

@Injectable()
export class TermsConditionsService {
  constructor(
    @InjectModel(TermsConditionsModel.name) private termsConditionsModel: Model<TermsConditionsModel>,
    private readonly res: ResponseService
  ) { }

  async create(req: Request, params: any): Promise<any> {
    try {
      const exist = await this.termsConditionsModel.findOne({ org_id: req['user']['org_id'] }).exec();
      if (exist) {
        const updateObj = {
          ...req['updateObj'],
          ...params,
        };
        await this.termsConditionsModel.updateOne({ _id: exist._id }, updateObj);
        return this.res.success('SUCCESS.UPDATE');
      }
      else {
        const saveObj = {
          ...req['createObj'],
          ...params,
        };
        const document = new this.termsConditionsModel(saveObj);
        await document.save();
        return this.res.success('SUCCESS.CREATE');
      }
    } catch (error) {
      return this.res.error(HttpStatus.BAD_REQUEST, 'ERROR.BAD_REQ', error);
    }
  }

  async read(req: Request, params: any): Promise<any> {
    try {
      const data = await this.termsConditionsModel.findOne({ org_id: req['user']['org_id'] }).exec();
      return this.res.success('SUCCESS.FETCH', data);
    } catch (error) {
      return this.res.error(HttpStatus.BAD_REQUEST, 'ERROR.BAD_REQ', error);
    }
  }

}
