import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ResponseService } from 'src/services/response.service';
import { DB_NAMES } from 'src/config/db.constant';
import { AppVersionModel, AppVersionSchema } from './models/app-version.model';
import { AppVersionController } from './version.controller';
import { AppVersionService } from './version.service';

@Module({
  imports:
  [
    MongooseModule.forFeature(
      [
        { name: AppVersionModel.name, schema: AppVersionSchema },
      ],
      DB_NAMES().CORE_DB
    ),

  ],
  controllers:[AppVersionController],
  providers: [AppVersionService,ResponseService],
  exports:[AppVersionService]
})
export class AppVersionModule {}
