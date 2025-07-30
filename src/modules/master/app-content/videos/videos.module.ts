import { Module } from '@nestjs/common';
import { VideosController } from './web/videos.controller';
import { VideosService } from './web/videos.service';
import { AppVideosController } from './app/app-videos.controller';
import { AppVideosService } from './app/app-videos.service';
import { MongooseModule } from '@nestjs/mongoose';
import { VideosModel, VideosSchema } from './models/videos.model';
import { ResponseService } from 'src/services/response.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: VideosModel.name, schema: VideosSchema },
    ]),
  ],
  controllers: [VideosController, AppVideosController],
  providers: [VideosService, AppVideosService, ResponseService],
})
export class VideosModule { }
