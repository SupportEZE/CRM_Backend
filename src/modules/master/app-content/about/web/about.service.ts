import { HttpStatus, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { AboutModel } from '../models/about.model';
import mongoose, { Model, Types } from 'mongoose';
import { ResponseService } from 'src/services/response.service';
import { toObjectId } from 'src/common/utils/common.utils';

@Injectable()
export class AboutService {
  constructor(
    @InjectModel(AboutModel.name) private aboutModel: Model<AboutModel>,
    private readonly res: ResponseService
  ) { }


  async create(req: Request, params: any): Promise<any> {
    try {
      const exist = await this.aboutModel.findOne({ org_id: req['user']['org_id'] }).exec();
      if (exist) {
        const updateObj = {
          ...req['updateObj'],
          ...params,
        };
        await this.aboutModel.updateOne({ _id: exist._id }, updateObj);
        return this.res.success('SUCCESS.UPDATE');
      }
      else {
        const saveObj = {
          ...req['createObj'],
          ...params,
        };
        const document = new this.aboutModel(saveObj);
        await document.save();
        return this.res.success('SUCCESS.CREATE');
      }
    } catch (error) {
      return this.res.error(HttpStatus.BAD_REQUEST, 'ERROR.BAD_REQ', error);
    }
  }

  async read(req: Request, params: any): Promise<any> {
    try {
      const data = await this.aboutModel.findOne({ org_id: req['user']['org_id'] }).exec();
      return this.res.success('SUCCESS.FETCH', data);
    } catch (error) {
      return this.res.error(HttpStatus.BAD_REQUEST, 'ERROR.BAD_REQ', error);
    }
  }

}


