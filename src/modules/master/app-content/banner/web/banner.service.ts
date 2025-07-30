import { HttpStatus, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { BannerModel } from '../models/banner.model';
import { Model, Types } from 'mongoose';
import { ResponseService } from 'src/services/response.service';
import { toObjectId } from 'src/common/utils/common.utils';
import { BannerDocsModel } from '../models/banner-docs.model';
import { S3Service } from 'src/shared/rpc/s3.service';
@Injectable()
export class BannerService {
  constructor(
    @InjectModel(BannerModel.name) private bannerModel: Model<BannerModel>,
    @InjectModel(BannerDocsModel.name) private bannerDocsModel: Model<BannerDocsModel>,
    private readonly res: ResponseService,
    private readonly s3Service: S3Service
  ) { }

  async create(req: Request, params: any): Promise<any> {
    try {
      if (Array.isArray(params.customer_type_id)) {
        params.customer_type_id = params.customer_type_id.map(toObjectId);
      }

      const saveObj: Record<string, any> = {
        ...req['createObj'],
        ...params,
      };

      const document = new this.bannerModel(saveObj);
      const insert = await document.save();
      return this.res.success('SUCCESS.CREATE', { inserted_id: insert._id });
    } catch (error) {
      return this.res.error(HttpStatus.BAD_REQUEST, 'ERROR.BAD_REQ', error);
    }
  }

  async update(req: Request, params: any): Promise<any> {
    try {
      const exist: Record<string, any> = await this.bannerModel.findOne({ _id: params._id, is_delete: 0 }).exec();
      if (!exist) {
        return this.res.error(HttpStatus.BAD_REQUEST, 'ERROR.NOT_FOUND');
      }

      const updateObj: Record<string, any> = {
        ...req['updateObj'],
        ...params
      }
      const updated = await this.bannerModel.updateOne({ _id: params._id }, updateObj)

      if (!updated) {
        return this.res.error(HttpStatus.NOT_FOUND, 'ERROR.NOT_FOUND');
      }
      return this.res.success('SUCCESS.UPDATE');
    } catch (error) {
      return this.res.error(HttpStatus.BAD_REQUEST, 'ERROR.BAD_REQ', error);
    }
  }

  async read(req: Request, params: any): Promise<any> {
    try {
      const projection: Record<string, any> = {
        _id: 1,
        login_type_id: 1,
        login_type_name: 1,
        customer_type_id: 1,
        customer_type_name: 1,
        country: 1
      };

      let data: Record<string, any>[] = await this.bannerModel
        .find({ org_id: req['user']['org_id'] }, projection)
        .sort({ _id: -1 })
        .lean();

      data = await Promise.all(
        data.map(async (item: any) => {
          const files = await this.getDocument(item._id, global.BIG_THUMBNAIL_IMAGE);
          item.files = files.map((file: any) => ({
            ...file,
            country: item.country
          }));
          return item;
        })
      );

      const allFiles = data.reduce((acc, item) => {
        return acc.concat(item.files);
      }, []);

      return this.res.success('BANNER.FETCH', allFiles);
    } catch (error) {
      return this.res.error(HttpStatus.BAD_REQUEST, 'ERROR.BAD_REQ', error);
    }
  }

  async deleteFile(req: Request, params: any): Promise<any> {
    try {
      params._id = toObjectId(params._id)
      const exist: Record<string, any> = await this.bannerDocsModel.findOne({ _id: params._id, is_delete: 0 }).exec();

      if (!exist) return this.res.error(HttpStatus.NOT_FOUND, 'ERROR.NOT_FOUND');

      const updateObj = {
        ...req['updateObj'],
        is_delete: 1,
      };
      await this.bannerDocsModel.updateOne(
        { _id: params._id },
        updateObj
      );

      return this.res.success('SUCCESS.FILE_DELETE');
    } catch (error) {
      return this.res.error(HttpStatus.BAD_REQUEST, 'ERROR.BAD_REQ', error);
    }
  }

  async upload(files: Express.Multer.File[], req: any): Promise<any> {
    try {
      req.body.module_name = Object.keys(global.SUB_MODULES).find(
        key => global.SUB_MODULES[key] === global.SUB_MODULES['Content Master']
      );
      let response = await this.s3Service.uploadMultiple(files, req, this.bannerDocsModel);
      return this.res.success('SUCCESS.CREATE', response);
    } catch (error) {
      return this.res.error(HttpStatus.BAD_REQUEST, 'Error uploading files to S3', error?.message || error
      );
    }
  }

  async getDocument(
    id: any,
    type: typeof global.FULL_IMAGE | typeof global.THUMBNAIL_IMAGE | typeof global.BIG_THUMBNAIL_IMAGE = global.FULL_IMAGE
  ): Promise<any> {
    return this.s3Service.getDocumentsByRowId(this.bannerDocsModel, id, type);
  }

  async getDocumentByDocsId(req: any, params: any): Promise<any> {
    const doc = await this.s3Service.getDocumentsById(this.bannerDocsModel, params._id);
    return this.res.success('SUCCESS.FETCH', doc);
  }

}


