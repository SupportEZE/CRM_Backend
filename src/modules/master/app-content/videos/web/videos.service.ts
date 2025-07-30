import { HttpStatus, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { VideosModel } from '../models/videos.model';
import { Model, Types } from 'mongoose';
import { ResponseService } from 'src/services/response.service';
import { toObjectId } from 'src/common/utils/common.utils';

@Injectable()
export class VideosService {
  constructor(
    @InjectModel(VideosModel.name) private videosModel: Model<VideosModel>,
    private readonly res: ResponseService
  ) { }

  async create(req: Request, params: any): Promise<any> {
    try {
      let obj: Record<string, any>;

      params.youtube_url = this.convertToEmbedUrl(params.youtube_url);
      obj = {
        ...req['createObj'],
        ...params,
      };
      const document = new this.videosModel(obj);
      const insert = await document.save();
      return this.res.success('SUCCESS.CREATE', { inserted_id: insert._id });
    } catch (error) {
      return this.res.error(HttpStatus.BAD_REQUEST, 'ERROR.BAD_REQ', error);
    }
  }

  private convertToEmbedUrl(url: string): string {
    try {
      const videoIdMatch = url.match(/[?&]v=([^&]+)/);
      if (videoIdMatch && videoIdMatch[1]) {
        return `https://www.youtube.com/embed/${videoIdMatch[1]}`;
      }
      return url;
    } catch (e) {
      return url;
    }
  }

  async update(req: Request, params: any): Promise<any> {
    try {

      const updateObj = {
        ...req['updateObj'],
        ...params
      }
      const updated = await this.videosModel.updateOne({ _id: params._id }, updateObj)

      return this.res.success('SUCCESS.STATUS_UPDATE');
    } catch (error) {
      return this.res.error(HttpStatus.BAD_REQUEST, 'ERROR.BAD_REQ', error);
    }
  }


  async read(req: Request, params: any): Promise<any> {
    try {
      const data: Record<string, any>[] = await this.videosModel
        .find({ org_id: req['user']['org_id'], is_delete: 0 })
        .sort({ _id: -1 })
        .lean();
      return this.res.success('SUCCESS.FETCH', data);
    } catch (error) {
      return this.res.error(HttpStatus.BAD_REQUEST, 'ERROR.BAD_REQ', error);
    }
  }

  async delete(req: any, params: any): Promise<any> {
    try {
      const exist: Record<string, any> = await this.videosModel.findOne({ _id: params._id }).exec();
      if (!exist) return this.res.success('ERROR.NOT_FOUND');
      await this.videosModel.updateOne({ _id: params._id }, params);
      return this.res.success('SUCCESS.DELETE');
    } catch (error) {
      return this.res.error(HttpStatus.BAD_REQUEST, 'ERROR.BAD_REQ', error);
    }
  }
}
