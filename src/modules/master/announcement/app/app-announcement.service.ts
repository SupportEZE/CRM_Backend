import { HttpStatus, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { AnnouncementModel } from '../models/announcement.model';
import { AnnouncementReadModel } from '../models/announcement-read.model';
import mongoose, { Model, Types } from 'mongoose';
import { ResponseService } from 'src/services/response.service';
import { Like, toObjectId, commonFilters } from 'src/common/utils/common.utils';
import { S3Service } from 'src/shared/rpc/s3.service';
import { AnnouncementDocsModel } from '../models/announcement-docs.model';
import { AnnouncementService } from '../web/announcement.service';


@Injectable()
export class AppAnnouncementService {
    constructor(
        @InjectModel(AnnouncementModel.name) private announcementModel: Model<AnnouncementModel>,
        @InjectModel(AnnouncementDocsModel.name) private announcementDocsModel: Model<AnnouncementDocsModel>,
        @InjectModel(AnnouncementReadModel.name) private announcementreadModel: Model<AnnouncementReadModel>,

        private readonly res: ResponseService,
        private readonly announcementService: AnnouncementService,

    ) { }

    async read(req: Request, params: any): Promise<any> {
        try {
            let match: any = {
                is_delete: 0,
                org_id: req['user']['org_id'],
                status: 'Published',
                state: req['user']['state'],
                login_type_id: req['user']['login_type_id'],
            };

            if (req['user']['login_type_id'] !== global.LOGIN_TYPE_ID['FIELD_USER']) {
                match.customer_type_id = toObjectId(req['user']['customer_type_id']);
            }

            const sorting: Record<string, 1 | -1> = { _id: -1 };
            const page: number = Math.max(1, parseInt(params?.page, 10) || global.PAGE);
            const limit: number = Math.max(1, parseInt(params?.limit, 10) || global.LIMIT);
            const skip: number = (page - 1) * limit;

            const [announcements, total] = await Promise.all([
                this.announcementModel.find(match).sort(sorting).skip(skip).limit(limit).lean(),
                this.announcementModel.countDocuments(match),
            ]);

            console.info('announcements', announcements)
            const announcementIds = announcements.map(a => a._id);

            const readEntries = await this.announcementreadModel.find({
                customer_id: req['user']['_id'],
                announcement_id: { $in: announcementIds },
                is_read: true,
            }).lean();

            const readSet = new Set(readEntries.map(entry => entry.announcement_id.toString()));

            const result = await Promise.all(
                announcements.map(async (announcement) => {
                    const allFiles = await this.announcementService.getDocument(
                        announcement._id,
                        global.BIG_THUMBNAIL_IMAGE
                    );

                    const imageFiles = allFiles
                        .filter(file => file.file_type?.includes('image'))
                        .map(({ _id, ...rest }) => rest);

                    return {
                        ...announcement,
                        is_read: readSet.has(announcement._id.toString()),
                        files: imageFiles,
                    };
                })
            );

            return this.res.pagination(result, total, page, limit);

        } catch (error) {
            return this.res.error(HttpStatus.BAD_REQUEST, 'ERROR.BAD_REQ', error);
        }
    }


    async detail(req: Request, params: any): Promise<any> {
        try {
            params._id = toObjectId(params._id);

            const match: Record<string, any> = { org_id: req['user']['org_id'], _id: params._id, is_delete: 0, };
            const data: Record<string, any> = await this.announcementModel.findOne(match).lean();
            if (!data) {
                return this.res.error(HttpStatus.NOT_FOUND, 'Announcement not found');
            }

            let read = await this.announcementreadModel.findOne({
                customer_id: req['user']['_id'],
                announcement_id: toObjectId(params._id),
            });

            if (!read) {
                const saveObj: Record<string, any> = {
                    ...req['createObj'],
                    org_id: req['user']['org_id'],
                    customer_id: req['user']['_id'],
                    announcement_id: params._id,
                    customer_name: req['user']['customer_name'] || req['user']['name'],
                    is_read: true,
                };
                const document = new this.announcementreadModel(saveObj);
                await document.save();
            } else if (!read.is_read) {
                if (read.is_read === false) {
                    await this.announcementreadModel.updateOne(
                        { _id: read._id },
                        { $set: { is_read: true, updated_at: new Date() } }
                    );
                }
            }
            data.files = await this.announcementService.getDocument(data._id, global.BIG_THUMBNAIL_IMAGE);
            return this.res.success('SUCCESS.FETCH', data);
        } catch (error) {
            return this.res.error(HttpStatus.BAD_REQUEST, 'ERROR.BAD_REQ', error);
        }
    }

}

