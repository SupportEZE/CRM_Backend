import { Module } from '@nestjs/common';
import { AboutController } from './web/about.controller';
import { AboutService } from './web/about.service';
import { AppAboutController } from './app/app-about.controller';
import { AppAboutService } from './app/app-about.service';
import { MongooseModule } from '@nestjs/mongoose';
import { AboutModel,AboutSchema } from './models/about.model';
import { ResponseService } from 'src/services/response.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: AboutModel.name, schema: AboutSchema },
    ]),
  ],
  controllers: [AboutController,AppAboutController],
  providers: [AboutService,AppAboutService,ResponseService],
})
export class AboutModule {}
