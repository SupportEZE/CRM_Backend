import { Module } from '@nestjs/common';
import { AnnouncementController } from './web/announcement.controller';
import { AnnouncementService } from './web/announcement.service';
import { MongooseModule } from '@nestjs/mongoose';
import { AnnouncementModel, AnnouncementSchema } from './models/announcement.model';
import { AnnouncementReadModel, AnnouncementReadSchema } from './models/announcement-read.model';
import { ResponseService } from 'src/services/response.service';
import { AppAnnouncementController } from './app/app-announcement.controller';
import { AppAnnouncementService } from './app/app-announcement.service';
import { AnnouncementDocsModel, AnnouncementDocsSchema } from './models/announcement-docs.model';
import { S3Service } from 'src/shared/rpc/s3.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: AnnouncementDocsModel.name, schema: AnnouncementDocsSchema },
      { name: AnnouncementModel.name, schema: AnnouncementSchema },
      { name: AnnouncementReadModel.name, schema: AnnouncementReadSchema },

    ]),
  ],
  controllers: [AnnouncementController, AppAnnouncementController],
  providers: [AnnouncementService, AppAnnouncementService, ResponseService, S3Service],
})
export class AnnouncementModule { }