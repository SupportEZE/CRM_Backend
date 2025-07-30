import { HttpStatus, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { DocumentModel } from '../models/document.model';
import { Model } from 'mongoose';
import { ResponseService } from 'src/services/response.service';
import { S3Service } from 'src/shared/rpc/s3.service';
import { LoginTypeModel } from 'src/modules/master/rbac/models/login-type.model';
import { toObjectId } from 'src/common/utils/common.utils';
import { DocumentDocsModel } from '../models/document-docs.model';

@Injectable()
export class DocumentService {
  constructor(
    @InjectModel(DocumentDocsModel.name) private documentDocsModel: Model<DocumentDocsModel>,
    @InjectModel(DocumentModel.name) private documentModel: Model<DocumentModel>,
    @InjectModel(LoginTypeModel.name) private loginTypeModel: Model<LoginTypeModel>,
    private readonly res: ResponseService,
    private readonly s3Service: S3Service,

  ) { }
  async create(req: Request, params: any): Promise<any> {
    try {
      let obj: Record<string, any>;
      obj = {
        ...req['createObj'],
        ...params,
      };
      const document = new this.documentModel(obj);
      const insert = await document.save();
      if (!insert || !insert._id) {
        return this.res.error(HttpStatus.BAD_REQUEST, 'ERROR.BAD_REQ');
      }
      return this.res.success('SUCCESS.FETCH', { inserted_id: insert._id });
    } catch (error) {
      return this.res.error(HttpStatus.BAD_REQUEST, 'ERROR.BAD_REQ', error);
    }
  }

  async update(req: Request, params: any): Promise<any> {
    try {
      const exist: Record<string, any> = await this.documentModel.findOne({ _id: params._id, is_delete: 0 }).exec();
      if (!exist) {
        return this.res.error(HttpStatus.BAD_REQUEST, 'ERROR.NOT_FOUND');
      }
      const updateObj: Record<string, any> = {
        ...req['updateObj'],
        ...params
      }
      const updatedDocument = await this.documentModel.updateOne({ _id: params._id }, updateObj)
      if (!updatedDocument) return this.res.error(HttpStatus.BAD_REQUEST, 'ERROR.UPDATE_FAILED');
      return this.res.success('SUCCESS.UPDATE');
    } catch (error) {
      return this.res.error(HttpStatus.BAD_REQUEST, 'ERROR.BAD_REQ', error);
    }
  }

  async read(req: Request, params: any): Promise<any> {
    try {
      let data: Record<string, any>[] = await this.documentModel
        .find({ is_delete: 0, org_id: req['user']['org_id'] })
        .sort({ _id: -1 })
        .lean();

      data = await Promise.all(
        data.map(async (item: any) => {
          item.files = await this.getDocument(item._id);
          return item;
        })
      );

      const allFiles = data.reduce((acc, item) => {
        return acc.concat(item.files);
      }, []);

      return this.res.success('SUCCESS.FETCH', allFiles);
    } catch (error) {
      return this.res.error(HttpStatus.BAD_REQUEST, 'ERROR.BAD_REQ', error);
    }
  }

  async deleteFile(req: Request, params: any): Promise<any> {
    try {
      params._id = toObjectId(params._id)
      const exist: Record<string, any> = await this.documentDocsModel.findOne({ _id: params._id, is_delete: 0 }).exec();

      if (!exist) return this.res.error(HttpStatus.NOT_FOUND, 'ERROR.NOT_FOUND');

      const updateObj = {
        ...req['updateObj'],
        is_delete: 1,
      };
      await this.documentDocsModel.updateOne(
        { _id: params._id },
        updateObj
      );

      await this.documentModel.updateOne(
        { _id: toObjectId(exist.row_id) },
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
      let response = await this.s3Service.uploadMultiple(files, req, this.documentDocsModel);
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
    return this.s3Service.getDocumentsByRowId(this.documentDocsModel, id, type);
  }

  async getDocumentByDocsId(req: any, params: any): Promise<any> {
    const doc = await this.s3Service.getDocumentsById(this.documentDocsModel, params._id);
    return this.res.success('SUCCESS.FETCH', doc);
  }

}
