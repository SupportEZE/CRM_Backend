import { Module } from '@nestjs/common';
import { ReferralBonusController } from './web/referral-bonus.controller';
import { ReferralBonusService } from './web/referral-bonus.service';
import { MongooseModule } from '@nestjs/mongoose';
import { ReferralBonusModel, ReferralBonusSchema } from './models/referral-bonus.model';
import { ResponseService } from 'src/services/response.service';
import { AppReferralBonusController } from './app/app-referral-bonus.controller';
import { AppReferralBonusService } from './app/app-referral-bonus.service';
import { AppLedgerService } from 'src/modules/loyalty/ledger/app/app-ledger.service';
import { LedgerModule } from 'src/modules/loyalty/ledger/ledger.module';
import { LedgerModel, LedgerSchema } from 'src/modules/loyalty/ledger/models/ledger.model';
import { InsideBannerModule } from 'src/shared/inside-banner/inside-banner.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: ReferralBonusModel.name, schema: ReferralBonusSchema },
      { name: LedgerModel.name, schema: LedgerSchema },
    ]),
    LedgerModule,
    InsideBannerModule
  ],
  controllers: [ReferralBonusController, AppReferralBonusController],
  providers: [ReferralBonusService, AppReferralBonusService, ResponseService],
  exports: [AppReferralBonusService]
})
export class ReferralBonusModule { }