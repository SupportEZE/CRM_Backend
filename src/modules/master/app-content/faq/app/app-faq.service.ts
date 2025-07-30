import { HttpStatus, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { FaqModel } from '../models/faq.model';
import { Model } from 'mongoose';
import { ResponseService } from 'src/services/response.service';

@Injectable()
export class AppFaqService {
  constructor(
    @InjectModel(FaqModel.name) private faqModel: Model<FaqModel>,
    private readonly res: ResponseService
  ) { }

  async read(req: any, params: any): Promise<any> {
    try {
      const match: any = { is_delete: 0, org_id: req['user']['org_id'] };

      const page: number = Math.max(1, parseInt(params?.page, 10) || global.PAGE);
      const limit: number = Math.max(1, parseInt(params?.limit, 10) || global.LIMIT);
      const skip: number = (page - 1) * limit;

      const total = await this.faqModel.countDocuments(match);
      const faqs = await this.faqModel
        .find(match)
        .skip(skip)
        .limit(limit)
        .exec();
      return this.res.success('SUCCESS.FETCH', { total, faqs });
    } catch (error) {
      return this.res.error(HttpStatus.BAD_REQUEST, 'ERROR.BAD_REQ', error);
    }
  }

}
