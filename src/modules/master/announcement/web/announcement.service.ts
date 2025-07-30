import { HttpStatus, Post, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { AnnouncementModel } from '../models/announcement.model';
import { AnnouncementReadModel } from '../models/announcement-read.model';
import mongoose, { Model, Types, PipelineStage } from 'mongoose';
import { ResponseService } from 'src/services/response.service';
import { Like, toObjectId, commonFilters } from 'src/common/utils/common.utils';
import { S3Service } from 'src/shared/rpc/s3.service';
import { AnnouncementDocsModel } from '../models/announcement-docs.model';

@Injectable()
export class AnnouncementService {
    constructor(
        @InjectModel(AnnouncementModel.name) private announcementModel: Model<AnnouncementModel>,
        @InjectModel(AnnouncementDocsModel.name) private announcementDocsModel: Model<AnnouncementDocsModel>,
        @InjectModel(AnnouncementReadModel.name) private announcementReadModel: Model<AnnouncementReadModel>,
        private readonly res: ResponseService,
        private readonly s3Service: S3Service,

    ) { }

    async create(req: any, params: any): Promise<any> {
        try {

            params.customer_type_id = toObjectId(params.customer_type_id)
            const saveObj: Record<string, any> = {
                ...req['createObj'],
                ...params,
            };

            const document = new this.announcementModel(saveObj);
            const insert = await document.save();


            return this.res.success('SUCCESS.CREATE', { inserted_id: insert._id });
        } catch (error) {
            return this.res.error(HttpStatus.BAD_REQUEST, 'ERROR.BAD_REQ', error);
        }
    }

    async read(req: Request, params: any): Promise<any> {
        try {
            let match: any = { is_delete: 0, org_id: req['user']['org_id'] };
            let sorting: Record<string, 1 | -1> = { _id: -1 };

            if (params?.sorting && Object.keys(params.sorting).length !== 0) sorting = params.sorting;

            const filters: Record<string, any> = commonFilters(params?.filters);
            match = { ...match, ...filters };

            if (params?.activeTab) {
                if (params.activeTab === "Published") {
                    match['status'] = "Published";
                } else if (params.activeTab === "Unpublished") {
                    match['status'] = "Unpublished";
                }
            }

            const page: number = params?.page || global.PAGE;
            const limit: number = params?.limit || global.LIMIT;
            const skip: number = (page - 1) * limit;

            // ** Fetch counts for Published and Unpublished separately **
            const [publishedCount, unpublishedCount, total] = await Promise.all([
                this.announcementModel.countDocuments({ is_delete: 0, org_id: req['user']['org_id'], status: "Published" }),
                this.announcementModel.countDocuments({ is_delete: 0, org_id: req['user']['org_id'], status: "Unpublished" }),
                this.announcementModel.countDocuments(match),
            ]);

            let result = await this.announcementModel.find(match).skip(skip).limit(limit).sort(sorting).lean();

            const announcementIds = result.map((item: any) => item._id);

            const readCounts = await this.announcementReadModel.aggregate([
                { $match: { announcement_id: { $in: announcementIds } } },
                { $group: { _id: '$announcement_id', count: { $sum: 1 } } }
            ]);

            const resultWithReadCounts = result.map((announcement: any) => {
                const readData = readCounts.find((read: any) => read._id.toString() === announcement._id.toString());
                return { ...announcement, readCount: readData ? readData.count : 0 };
            });

            const responseData: any = {
                result: resultWithReadCounts,
                tabCount: {
                    published: publishedCount,
                    unpublished: unpublishedCount
                }
            };

            return this.res.pagination(responseData, total, page, limit);

        } catch (error) {
            return this.res.error(HttpStatus.BAD_REQUEST, 'ERROR.BAD_REQ', error);
        }
    }


    async detail(req: Request, params: any): Promise<any> {
        try {
            params._id = toObjectId(params._id)
            const match: Record<string, any> = { org_id: req['user']['org_id'], _id: params._id, is_delete: 0 }

            const result: Record<string, any> = await this.announcementModel.findOne(match).lean();
            const finalData: Record<string, any> = await this.announcementReadModel.find({ announcement_id: params._id, org_id: req['user']['org_id'] }).lean();

            result.files = await this.getDocument(result._id, global.BIG_THUMBNAIL_IMAGE)

            result.read_data = finalData
            return this.res.success('SUCCESS.FETCH', result);
        } catch (error) {
            return this.res.error(HttpStatus.BAD_REQUEST, 'ERROR.BAD_REQ', error)
        }
    }

    async updateStatus(req: Request, params: any): Promise<any> {
        try {
            params.duplicacyCheck = true;
            let exist: Record<string, any>;
            exist = await this.announcementModel.findOne({ _id: params._id, org_id: req['user']['org_id'], is_delete: 0 }).exec();
            if (!exist) return this.res.error(HttpStatus.BAD_REQUEST, 'WARNING.NOT_EXIST')

            const updateObj: Record<string, any> = {
                ...req['updateObj'],
                ...params,
            };

            await this.announcementModel.updateOne({ _id: params._id }, updateObj);
            if (params?.is_delete) return this.res.success('SUCCESS.DELETE');
            if (params?.status) return this.res.success('SUCCESS.UPDATE')

            return this.res.success('SUCCESS.UPDATE')
        } catch (error) {
            return this.res.error(HttpStatus.BAD_REQUEST, 'ERROR.BAD_REQ', error)
        }
    }
    async upload(files: Express.Multer.File[], req: any): Promise<any> {
        try {
            req.body.module_name = Object.keys(global.MODULES).find(
                key => global.MODULES[key] === global.MODULES['Announcement']
            );
            let response = await this.s3Service.uploadMultiple(files, req, this.announcementDocsModel);
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
        return this.s3Service.getDocumentsByRowId(this.announcementDocsModel, id, type);
    }

    async getDocumentByDocsId(req: any, params: any): Promise<any> {
        const doc = await this.s3Service.getDocumentsById(this.announcementDocsModel, params._id);
        return this.res.success('SUCCESS.FETCH', doc);
    }
}