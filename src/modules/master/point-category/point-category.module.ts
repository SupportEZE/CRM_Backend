import { Module } from '@nestjs/common';
import { PointCategoryController } from './web/point-category.controller';
import { PointCategoryService } from './web/point-category.service';
import { MongooseModule } from '@nestjs/mongoose';
import { PointCategoryModel, PointCategorySchema } from './models/point-category.model';
import { PointCategoryMapModel, PointCategoryMapSchema } from './models/point-category-map.model';
import { ResponseService } from 'src/services/response.service';
import { UserModel, UserSchema } from '../user/models/user.model';

@Module({
    imports: [
        MongooseModule.forFeature([
            { name: PointCategoryModel.name, schema: PointCategorySchema },
            { name: PointCategoryMapModel.name, schema: PointCategoryMapSchema },
        ]),
    ],
    controllers: [PointCategoryController],
    providers: [PointCategoryService, ResponseService],
})
export class PointCategoryModule { }
