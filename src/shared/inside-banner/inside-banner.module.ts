import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ResponseService } from 'src/services/response.service';
import { InsideBannerController } from './inside-banner.controller';
import { InsideBannerModel, InsideBannerSchema } from './model/inside-banner.model';
import { InsideBannerService } from './inside-banner.service';

@Module({
    imports:
        [
            MongooseModule.forFeature([
                { name: InsideBannerModel.name, schema: InsideBannerSchema },
            ]),
        ],
    controllers: [InsideBannerController],
    providers: [InsideBannerService, ResponseService],
    exports: [InsideBannerService]
})
export class InsideBannerModule { }
