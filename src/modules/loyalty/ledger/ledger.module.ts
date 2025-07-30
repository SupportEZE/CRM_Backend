import { Module } from '@nestjs/common';
import { LedgerController } from './web/ledger.controller';
import { AppLedgerController } from './app/app-ledger.controller';
import { LedgerService } from './web/ledger.service';
import { AppLedgerService } from './app/app-ledger.service';
import { MongooseModule } from '@nestjs/mongoose';
import { LedgerModel, LedgerSchema } from './models/ledger.model';
import {
  CustomerModel,
  CustomerSchema,
} from 'src/modules/master/customer/default/models/customer.model';
import {
  LeaderBoardModel,
  LeaderBoardSchema,
} from '../leader-board/models/leader-board.model';
import {
  CustomerLeaderBoardModel,
  CustomerLeaderBoardSchema,
} from 'src/modules/master/customer/default/models/customer-leaderboard.model';
import {
  RedeemRequestModel,
  RedeemRequestSchema,
} from '../redeem-request/models/redeem-request.model';
import { ResponseService } from 'src/services/response.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: CustomerModel.name, schema: CustomerSchema },
      { name: LeaderBoardModel.name, schema: LeaderBoardSchema },
      {
        name: CustomerLeaderBoardModel.name,
        schema: CustomerLeaderBoardSchema,
      },
      { name: LedgerModel.name, schema: LedgerSchema },
      { name: RedeemRequestModel.name, schema: RedeemRequestSchema },
    ]),
  ],
  controllers: [LedgerController, AppLedgerController],
  providers: [LedgerService, AppLedgerService, ResponseService],
  exports: [LedgerService, AppLedgerService],
})
export class LedgerModule {}
