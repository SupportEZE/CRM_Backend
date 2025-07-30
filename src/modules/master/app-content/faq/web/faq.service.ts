import { HttpStatus, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { FaqModel } from '../models/faq.model';
import mongoose, { Model, Types } from 'mongoose';
import { ResponseService } from 'src/services/response.service';
import { toObjectId } from 'src/common/utils/common.utils';

@Injectable()
export class FaqService {
  constructor(
    @InjectModel(FaqModel.name) private faqModel: Model<FaqModel>,
    private readonly res: ResponseService
  ) { }

  async create(req: any, params: any): Promise<any> {
    try {
      const saveObj = {
        ...req['createObj'],
        ...params,
      };

      const document = new this.faqModel(saveObj);
      await document.save();

      return this.res.success('SUCCESS.CREATE');
    } catch (error) {
      return this.res.error(HttpStatus.BAD_REQUEST, 'ERROR.BAD_REQ', error);
    }
  }


  async update(req: any, params: any): Promise<any> {
    try {
      const exist = await this.faqModel.findOne({ _id: params._id }).exec();
      if (!exist) return this.res.success('SUCCESS.NOT_EXIST');

      const updateObj = {
        ...req['updateObj'],
        ...params,
      };

      await this.faqModel.updateOne({ _id: params._id }, updateObj);
      return this.res.success('SUCCESS.UPDATE');
    } catch (error) {
      return this.res.error(HttpStatus.BAD_REQUEST, 'ERROR.BAD_REQ', error);
    }
  }


  async read(req: Request, params: any): Promise<any> {
    try {
      let sorting: Record<string, 1 | -1> = { _id: -1 };
      const data = await this.faqModel.find
        ({ org_id: req['user']['org_id'] }).sort(sorting).exec();
      return this.res.success('SUCCESS.FETCH', data);
    } catch (error) {
      return this.res.error(HttpStatus.BAD_REQUEST, 'ERROR.BAD_REQ', error);
    }
  }

  async delete(req: any, params: any): Promise<any> {
    try {
      const exist = await this.faqModel.findOne({ _id: params._id }).exec();
      if (!exist) return this.res.success('SUCCESS.NOT_EXIST');

      await this.faqModel.deleteOne({ _id: exist._id });
      return this.res.success('SUCCESS.DELETE');
    } catch (error) {
      return this.res.error(HttpStatus.BAD_REQUEST, 'ERROR.BAD_REQ', error);
    }
  }


}
