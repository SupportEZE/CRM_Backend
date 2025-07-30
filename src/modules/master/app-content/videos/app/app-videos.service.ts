import { HttpStatus, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { VideosModel } from '../models/videos.model';
import mongoose, { Model, Types } from 'mongoose';
import { ResponseService } from 'src/services/response.service';
import { toObjectId } from 'src/common/utils/common.utils';

@Injectable()
export class AppVideosService {
  constructor(
    @InjectModel(VideosModel.name) private videosModel: Model<VideosModel>,
    private readonly res: ResponseService
  ) { }

  async read(req: Request, params: any): Promise<any> {
    try {

      let match: Record<string, any> = {
        is_delete: 0,
        org_id: req['user']['org_id'],
      };

      if (req['user']['login_type_id']) match.login_type_id = req['user']['login_type_id'];
      if (req['user']['customer_type_name']) match.customer_type_name = req['user']['customer_type_name'];

      let result: Record<string, any>[] = await this.videosModel.find(match).lean();


      return this.res.success('SUCCESS.FETCH', result.length ? result : []);
    } catch (error) {
      return this.res.error(HttpStatus.BAD_REQUEST, 'ERROR.BAD_REQ', error);
    }
  }
}
