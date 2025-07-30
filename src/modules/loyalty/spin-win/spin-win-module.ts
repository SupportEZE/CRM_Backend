import { Module } from '@nestjs/common';
import { SpinWinController } from './web/spin-win.controller';
import { SpinWinService } from './web/spin-win.service';
import { ResponseService } from 'src/services/response.service';
import { SpinWinModel, SpinWInSchema } from './models/spin-win-model';
import { MongooseModule } from '@nestjs/mongoose';
import {
  CustomerModel,
  CustomerSchema,
} from 'src/modules/master/customer/default/models/customer.model';
import { LedgerModel, LedgerSchema } from '../ledger/models/ledger.model';
import { AppSpinWinController } from './app/app-spin-win.controller';
import { AppSpinWinService } from './app/app-spin-win.service';
import { LedgerModule } from '../ledger/ledger.module';
import {
  SpinWinCustomersModel,
  SpinWInCustomersSchema,
} from './models/spin-win-customer.model';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: SpinWinCustomersModel.name, schema: SpinWInCustomersSchema },
      { name: SpinWinModel.name, schema: SpinWInSchema },
      { name: CustomerModel.name, schema: CustomerSchema },
      { name: LedgerModel.name, schema: LedgerSchema },
    ]),
    LedgerModule,
  ],
  controllers: [SpinWinController, AppSpinWinController],
  providers: [SpinWinService, ResponseService, AppSpinWinService],
  exports: [SpinWinService],
})
export class SpinWinModule {}
