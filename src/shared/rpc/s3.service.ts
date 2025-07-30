import { Injectable, BadRequestException } from '@nestjs/common';
import { Model } from 'mongoose';
import { RpcService } from './rpc.service';
import { toObjectId } from 'src/common/utils/common.utils';
import { getSignedUrl } from '@aws-sdk/cloudfront-signer';
import * as AWS from 'aws-sdk';
import * as sharp from 'sharp';

@Injectable()
export class S3Service {
  private readonly s3: AWS.S3;
  private readonly BUCKET_NAME = process.env.AWS_S3_BUCKET_NAME;

  constructor() {
    this.s3 = new AWS.S3({
      region: process.env.AWS_REGION,
      accessKeyId: process.env.AWS_ACCESS_KEY_ID,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    });
  }
  async uploadMultiple(files: Express.Multer.File[], req: any, model: Model<any>): Promise<any[]> {
    try {
      if (!files || files.length === 0) {
        throw new Error(`Error uploading files: Invalid File`);
      }
      const uploadResults = await Promise.all(
        files.map((file) => this.uploadFile(file, req, model))
      );
      return uploadResults;
    } catch (error) {
      throw new Error(`Error uploading files: ${error.message}`);
    }
  }

  private async uploadFile(file: Express.Multer.File, req: any, model): Promise<any> {
    try {
      const date = Date.now()
      const fileKey = this.generateFileKey(file.originalname, req, date);
      const s3UploadResult = await this.uploadToS3(file, req, fileKey);

      let thumbnailKey: string | null = null;
      let thumbnailUploadResult: any = null;
      let bigThumbnailKey: string | null = null;
      let bigThumbnailUploadResult: any = null;

      if (s3UploadResult.file_type === 'image') {
        thumbnailKey = this.generateThumbnailKey(file.originalname, req, date);
        thumbnailUploadResult = await this.createAndUploadThumbnail(file, req, thumbnailKey);

        bigThumbnailKey = this.generateBigThumbnailKey(file.originalname, req, date);
        bigThumbnailUploadResult = await this.createAndUploadBigThumbnail(file, req, bigThumbnailKey);
      }

      const docData = {
        req,
        file_path: fileKey,
        thumbnail_path: thumbnailKey,
        big_thumbnail_path: bigThumbnailKey,
        file_type: s3UploadResult.file_type,
        originalname: file.originalname,
      };

      return await this.docObj(docData, model);
    } catch (error) {
      throw new Error(`Error uploading file '${file.originalname}': ${error.message}`);
    }
  }

  private async docObj(docData: any, model): Promise<any> {
    try {
      const { req, file_path, thumbnail_path, big_thumbnail_path, file_type, originalname } = docData;

      const labels = JSON.parse(req.body.label);
      const labelData = labels.find((row: any) => row.file === originalname) || {};
      if (req?.body?.updated_id) {
        await model.updateOne({ _id: toObjectId(req.body.updated_id) }, { $set: { is_delete: 1 } });
      }
      const saveObj: Record<string, any> = {
        ...req.createObj,
        row_id: toObjectId(req.body._id),
        label: labelData.label,
        doc_no: labelData.doc_no ?? '',
        file_path: file_path ?? '',
        thumbnail_path: thumbnail_path ?? '',
        big_thumbnail_path: big_thumbnail_path ?? '',
        file_type: file_type ?? '',
      };
      const document = model(saveObj);
      const insert = await document.save();
      return saveObj;
    } catch (error) {
      throw new Error(`Error creating document object for file ${docData.originalname}: ${error.message}`);
    }
  }

  private generateFileKey(fileName: string, req: any, date: any): string {
    const orgNameSplit = req.user.org.org_name.split(' ')[0];
    const orgId = req.user.org_id;
    const safeModuleName = this.sanitizeModuleName(req.body.module_name);
    return `${orgNameSplit}-${orgId}/${safeModuleName}/${date}-${fileName}`;
  }


  private generateThumbnailKey(fileName: string, req: any, date: any): string {
    const orgNameSplit = req.user.org.org_name.split(' ')[0];
    const orgId = req.user.org_id;
    const moduleName = this.sanitizeModuleName(req.body.module_name);

    return `${orgNameSplit}-${orgId}/${moduleName}/thumbnail/${date}-${fileName}`;
  }

  private generateBigThumbnailKey(fileName: string, req: any, date: any): string {
    const orgNameSplit = req.user.org.org_name.split(' ')[0];
    const orgId = req.user.org_id;
    const moduleName = this.sanitizeModuleName(req.body.module_name);

    return `${orgNameSplit}-${orgId}/${moduleName}/big_thumbnail/${date}-${fileName}`;
  }

  private sanitizeModuleName(moduleName: string): string {
    return (moduleName || 'UnknownModule')
      .trim()
      .replace(/\s+/g, '_')
      .replace(/[\/\\]/g, '');
  }


  private async uploadToS3(file: Express.Multer.File, req: any, fileKey: any): Promise<any> {
    const uploadParams: AWS.S3.PutObjectRequest = {
      Bucket: this.BUCKET_NAME,
      Key: fileKey,
      Body: file.buffer,
      ACL: 'private',
      ContentType: file.mimetype,
    };

    try {
      if (file.mimetype.startsWith('image/')) {
        const compressedImageBuffer = await sharp(file.buffer)
          .rotate()
          .resize(1024)
          .jpeg({ quality: 80 })
          .toBuffer();

        uploadParams.Body = compressedImageBuffer;
      }

      const upload_data = await this.s3.upload(uploadParams).promise();
      const file_type = this.getFileType(file.mimetype);

      return { upload_data, file_type };
    } catch (error) {
      throw new Error(`Error uploading file to S3: ${fileKey} - ${error.message}`);
    }
  }

  private async createAndUploadThumbnail(file: Express.Multer.File, req: any, thumbnailKey: any): Promise<any> {
    const uploadParams: AWS.S3.PutObjectRequest = {
      Bucket: this.BUCKET_NAME,
      Key: thumbnailKey,
      Body: file.buffer,
      ACL: 'private',
      ContentType: file.mimetype,
    };

    try {
      const thumbnailBuffer = await sharp(file.buffer)
        .resize(50, 50)
        .toBuffer();

      uploadParams.Body = thumbnailBuffer;

      return await this.s3.upload(uploadParams).promise();
    } catch (error) {
      throw new Error(`Error uploading thumbnail for ${file.originalname}: ${error.message}`);
    }
  }

  private async createAndUploadBigThumbnail(file: Express.Multer.File, req: any, bigThumbnailKey: any): Promise<any> {

    const uploadParams: AWS.S3.PutObjectRequest = {
      Bucket: this.BUCKET_NAME,
      Key: bigThumbnailKey,
      Body: file.buffer,
      ACL: 'private',
      ContentType: file.mimetype,
    };

    try {
      const thumbnailBuffer = await sharp(file.buffer)
        .jpeg({ quality: 50 })
        .toBuffer();

      uploadParams.Body = thumbnailBuffer;

      return await this.s3.upload(uploadParams).promise();
    } catch (error) {
      throw new Error(`Error uploading thumbnail for ${file.originalname}: ${error.message}`);
    }
  }

  private getFileType(mimeType: string): string {
    if (mimeType.startsWith('image/')) return 'image';
    if (mimeType.startsWith('video/')) return 'video';
    if (mimeType === 'application/pdf') return 'pdf';
    if (mimeType.startsWith('audio/')) return 'audio';
    return 'unknown';
  }

  async getDocumentThumbnail(documents: any[]): Promise<any[]> {
    if (!documents.length) return [];
    const now = Date.now();
    return await Promise.all(
      documents.map(async (document) => {
        let expire = false;
        const expireTime = new Date(document.signed_url_expire_thumbnail ?? 0).getTime();
        if (isNaN(expireTime) || now > expireTime) {
          if (document.thumbnail_path) {
            expire = true;
            const signedUrl = await this.generateSignedUrl(document.thumbnail_path, global.THUMBNAIL_IMAGE);

            return {
              ...document,
              signed_url_thumbnail: signedUrl.signedUrl,
              signed_url_expire_thumbnail: signedUrl.dateLessThan,
              expire
            };
          }
        }
        return {
          ...document,
          signed_url_thumbnail: document.signed_url_thumbnail,
          signed_url_expire_thumbnail: document.signed_url_expire_thumbnail ?? '',
          expire
        };
      })
    );
  }

  async getDocumentBigThumbnail(documents: any[]): Promise<any[]> {
    if (!documents.length) return [];
    const now = Date.now();
    return await Promise.all(
      documents.map(async (document) => {
        let expire = false;
        const expireTime = new Date(document.signed_url_expire_big_thumbnail ?? 0).getTime();
        if (isNaN(expireTime) || now > expireTime) {
          if (document.big_thumbnail_path) {
            expire = true;
            const signedUrl = await this.generateSignedUrl(document.big_thumbnail_path, global.BIG_THUMBNAIL_IMAGE);

            return {
              ...document,
              signed_url_big_thumbnail: signedUrl.signedUrl,
              signed_url_expire_big_thumbnail: signedUrl.dateLessThan,
              expire
            };
          }
        }
        return {
          ...document,
          signed_url_big_thumbnail: document.signed_url_big_thumbnail,
          signed_url_expire_big_thumbnail: document.signed_url_expire_big_thumbnail ?? '',
          expire
        };
      })
    );
  }

  async getDocumentFullSize(documents: any[]): Promise<any[]> {
    if (!documents.length) return [];
    const now = Date.now();
    return await Promise.all(
      documents.map(async (document) => {
        let expire = false;
        const expireTime = new Date(document.signed_url_expire ?? 0).getTime();
        if (isNaN(expireTime) || now > expireTime) {
          if (document.file_path) {
            expire = true;
            const signedUrl = await this.generateSignedUrl(document.file_path, 'full');
            const response = {
              ...document,
              signed_url: signedUrl.signedUrl,
              signed_url_expire: signedUrl.dateLessThan,
              expire
            };
            return response
          }
        }
        return {
          ...document,
          signed_url: document.signed_url,
          signed_url_expire: document.signed_url_expire ?? '',
          expire
        };
      })
    );
  }

  async generateSignedUrl(file_path, type): Promise<any> {

    let expires = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
    if (type === global.THUMBNAIL_IMAGE) {
      expires = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
    } else if (type === global.THUMBNAIL_IMAGE) {
      expires = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
    }
    else {
      expires = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
    }

    const cloudfrontUrl = `${process.env.CLOUD_FRONT_URL}/${file_path}`;

    const signedUrl = getSignedUrl({
      url: cloudfrontUrl,
      keyPairId: process.env.KEY_PAIR_ID,
      privateKey: process.env.PRIVATE_KEY,
      dateLessThan: expires,
    });

    return {
      signedUrl,
      dateLessThan: expires,
    };
  }
  async getDocumentsByRowId(
    model: Model<any>,
    rowId: any,
    type: 'full' | 'thumbnail' | 'big_thumbnail',
    doc_type?: any
  ): Promise<any[]> {
    const match: any = { row_id: rowId, is_delete: 0 };
    if (doc_type) {
      match.label = doc_type;
    }
    if (Array.isArray(rowId)) {
      match['row_id'] = { $in: rowId }
    }

    const docs = await model.find(match).lean();
    return this.getDocumentData(model, docs, type);
  }


  private async getDocumentData(model: Model<any>, existingDocs: any[], type: 'full' | 'thumbnail' | 'big_thumbnail'): Promise<any[]> {
    let updatedImageDocs: any[] = [];
    let updatedOthersDocs: any[] = [];
    let output: any[] = [];

    if (type === 'full') {

      updatedImageDocs = await this.getDocumentFullSize(existingDocs);
    } else {

      const images = existingDocs.filter(doc => doc.file_type?.includes('image'));
      const others = existingDocs.filter(doc => !doc.file_type?.includes('image'));

      if (type === 'thumbnail') {
        updatedImageDocs = await this.getDocumentThumbnail(images);
      } else {
        updatedImageDocs = await this.getDocumentBigThumbnail(images);

      }
      updatedOthersDocs = await this.getDocumentFullSize(others);
    }

    const allUpdatedDocs = [...updatedImageDocs, ...updatedOthersDocs];
    const docsToUpdate = allUpdatedDocs.filter(doc => doc.expire === true);

    for (const doc of docsToUpdate) {
      const updateFields: Record<string, any> = {};

      if (type === 'full' || !doc.file_type?.includes('image')) {
        updateFields.signed_url = doc.signed_url;
        updateFields.signed_url_expire = doc.signed_url_expire;
      } else if (type === 'thumbnail') {
        updateFields.signed_url_thumbnail = doc.signed_url_thumbnail;
        updateFields.signed_url_expire_thumbnail = doc.signed_url_expire_thumbnail;
      }
      else {
        updateFields.signed_url_big_thumbnail = doc.signed_url_big_thumbnail;
        updateFields.signed_url_expire_big_thumbnail = doc.signed_url_expire_big_thumbnail;
      }

      await model.updateOne({ _id: doc._id }, { $set: updateFields });
    }

    const normalizedDocs = allUpdatedDocs.map(doc => {
      let signed_url: string;

      if (doc.file_type?.includes('image')) {
        if (type === 'thumbnail') {
          signed_url = doc.signed_url_thumbnail;
        } else if (type === 'big_thumbnail') {
          signed_url = doc.signed_url_big_thumbnail;
        } else {
          signed_url = doc.signed_url;
        }
      } else {
        signed_url = doc.signed_url;
      }

      const obj
        = {
        _id: doc._id,
        label: doc.label,
        doc_no: doc.doc_no ?? '',
        file_type: doc.file_type,
        signed_url,
        row_id: doc.row_id
      };

      output.push(obj);
      return obj;
    });

    if (existingDocs.length > 1) {
      return output
    }

    return normalizedDocs;
  }

  async getDocumentsById(model: Model<any>, docId: any): Promise<any> {
    const match = { _id: docId, is_delete: 0 };
    let isDocIdsArray: Boolean = false;
    if (Array.isArray(docId)) isDocIdsArray = true;
    if (isDocIdsArray) match['_id'] = { $in: docId }
    const docs = await model.find(match).lean();
    let doc: any;
    if (isDocIdsArray) {
      doc = await this.getDocumentData(model, docs, 'full');
    } else {
      [doc] = await this.getDocumentData(model, docs, 'full');
    }
    return doc;
  }
}
