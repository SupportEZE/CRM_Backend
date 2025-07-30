import { Module } from '@nestjs/common';
import { BonusController } from './web/bonus.controller';
import { BonusService } from './web/bonus.service';
import { AppBonusController } from './app/app-bonus.controller';
import { AppBonusService } from './app/app-bonus.service';
import { MongooseModule } from '@nestjs/mongoose';
import { BonusModel, BonusSchema } from './models/bonus.model';
import { ResponseService } from 'src/services/response.service';
import { PointCategorySchema, PointCategoryModel } from 'src/modules/master/point-category/models/point-category.model';
import { BonusPointCategoryModel, BonusPointCategorySchema } from './models/bonu-point-category.model';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: BonusModel.name, schema: BonusSchema },
      { name: PointCategoryModel.name, schema: PointCategorySchema },
      { name: BonusPointCategoryModel.name, schema: BonusPointCategorySchema },

    ]),
  ],
  controllers: [BonusController, AppBonusController],
  providers: [BonusService, AppBonusService, ResponseService],
})
export class BonusModule { }
