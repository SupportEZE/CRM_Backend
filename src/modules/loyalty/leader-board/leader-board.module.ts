import { Module } from '@nestjs/common';
import { LeaderBoardController } from './web/leader-board.controller';
import { AppLeaderBoardController } from './app/app-leader-board.controller';
import { LeaderBoardService } from './web/leader-board.service';
import { AppLeaderBoardService } from './app/app-leader-board.service';
import { MongooseModule } from '@nestjs/mongoose';
import { ResponseService } from 'src/services/response.service';
import {
  LeaderBoardModel,
  LeaderBoardSchema,
} from './models/leader-board.model';
import {
  CustomerLeaderBoardModel,
  CustomerLeaderBoardSchema,
} from 'src/modules/master/customer/default/models/customer-leaderboard.model';
import {
  LeaderBoardGiftsModel,
  LeaderBoardGiftsSchema,
} from './models/leader-board-gifts.model';
import {
  LedgerModel,
  LedgerSchema,
} from 'src/modules/loyalty/ledger/models/ledger.model';
import {
  CustomerModel,
  CustomerSchema,
} from 'src/modules/master/customer/default/models/customer.model';
import {
  UserDocsModel,
  UserDocsSchema,
} from 'src/modules/master/user/models/user-docs.model';
import {
  LeaderBoardDocsModel,
  LeaderBoardDocsSchema,
} from './models/leader-board-docs.moel';
import { S3Service } from 'src/shared/rpc/s3.service';
import { CustomerModule } from 'src/modules/master/customer/customer.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: LeaderBoardModel.name, schema: LeaderBoardSchema },
      { name: LeaderBoardDocsModel.name, schema: LeaderBoardDocsSchema },
      { name: UserDocsModel.name, schema: UserDocsSchema },
      {
        name: CustomerLeaderBoardModel.name,
        schema: CustomerLeaderBoardSchema,
      },
      { name: LeaderBoardGiftsModel.name, schema: LeaderBoardGiftsSchema },
      { name: LedgerModel.name, schema: LedgerSchema },
      { name: CustomerModel.name, schema: CustomerSchema },
    ]),
    CustomerModule,
  ],
  controllers: [LeaderBoardController, AppLeaderBoardController],
  providers: [
    LeaderBoardService,
    AppLeaderBoardService,
    ResponseService,
    S3Service,
  ],
})
export class LeaderBoardModule {}
