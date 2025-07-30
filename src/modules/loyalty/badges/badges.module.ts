import { Module } from '@nestjs/common';
import { BadgesController } from './web/badges.controller';
import { BadgesService } from './web/badges.service';
import { AppBadgesController } from './app/app-badges.controller';
import { AppBadgesService } from './app/app-badges.service';
import { MongooseModule } from '@nestjs/mongoose';
import { BadgesModel, BadgesSchema } from './models/badges.model';
import { ResponseService } from 'src/services/response.service';
import { BadgeDocsModel, BadgeDocsSchema } from './models/badge-docs.model';
import { S3Service } from 'src/shared/rpc/s3.service';
import { LedgerModule } from '../ledger/ledger.module';



@Module({
  imports: [
    MongooseModule.forFeature([
      { name: BadgesModel.name, schema: BadgesSchema },
      { name: BadgeDocsModel.name, schema: BadgeDocsSchema },
    ]),
    LedgerModule
  ],
  controllers: [BadgesController, AppBadgesController],
  providers: [BadgesService, AppBadgesService, ResponseService, S3Service],
})
export class BadgesModule { }
