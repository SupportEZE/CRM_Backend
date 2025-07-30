import { Module } from '@nestjs/common';
import { AppHomeController } from './app/app-home.controller';
import { HomeController } from './web/home.controller';
import { AppHomeService } from './app/app-home.service';
import { HomeService } from './web/home.service';
import { MongooseModule } from '@nestjs/mongoose';
import {
  AttendanceModel,
  AttendanceSchema,
} from '../attendance/models/attendance.model';
import { ResponseService } from 'src/services/response.service';
import {
  UserModel,
  UserSchema,
} from 'src/modules/master/user/models/user.model';
import { DateTimeService } from 'src/services/date-time.service';
import {
  BannerModel,
  BannerSchema,
} from 'src/modules/master/app-content/banner/models/banner.model';
import { LedgerModule } from 'src/modules/loyalty/ledger/ledger.module';
import { CustomerModule } from 'src/modules/master/customer/customer.module';
import {
  ChatRoomModel,
  ChatRoomSchema,
} from 'src/modules/chat/models/chat-room.model';
import {
  RedeemRequestModel,
  RedeemRequestSchema,
} from 'src/modules/loyalty/redeem-request/models/redeem-request.model';
import { ChatModel, ChatSchema } from 'src/modules/chat/models/chat.model';
import {
  UserToCustomerMappingModel,
  UserToCustomerMappingSchema,
} from 'src/modules/master/customer/default/models/user-to-customer-mapping.model';
import { BannerModule } from 'src/modules/master/app-content/banner/banner.module';
import {
  ReferralBonusModel,
  ReferralBonusSchema,
} from 'src/modules/master/referral-bonus/models/referral-bonus.model';
import { InsideBannerModule } from 'src/shared/inside-banner/inside-banner.module';
import { UserModule } from 'src/modules/master/user/user.module';
import {
  CustomerOtherDetailModel,
  CustomerOtherDetailSchema,
} from 'src/modules/master/customer/default/models/customer-other-detail.model';
import {
  UnpaidInvoiceModel,
  UnpaidInvoiceBillingSchema,
} from 'src/modules/dms/unpaid-invoice/models/unpaid-invoice.model';
import {
  InvoiceModel,
  InvoiceBillingSchema,
} from 'src/modules/dms/invoice/models/invoice.model';
import { ExpenseModule } from '../expense/expense.module';
import { LeaveModule } from '../leave/leave.module';
import { ActivityModule } from '../activity/activity.module';
import { FollowupModule } from '../followup/followup.module';
import {
  CustomerKycDetailModel,
  CustomerKycDetailSchema,
} from 'src/modules/master/customer/default/models/customer-kyc-details.model';
import { StockTransferModule } from 'src/modules/dms/stock-transfer/stock-transfer.module';
import { EnquiryModule } from '../enquiry/enquiry-module';

@Module({
  imports: [
    MongooseModule.forFeature([
      {
        name: CustomerOtherDetailModel.name,
        schema: CustomerOtherDetailSchema,
      },
      { name: UnpaidInvoiceModel.name, schema: UnpaidInvoiceBillingSchema },
      { name: InvoiceModel.name, schema: InvoiceBillingSchema },
      { name: AttendanceModel.name, schema: AttendanceSchema },
      { name: UserModel.name, schema: UserSchema },
      { name: UserModel.name, schema: UserSchema },
      { name: BannerModel.name, schema: BannerSchema },
      { name: ChatRoomModel.name, schema: ChatRoomSchema },
      { name: RedeemRequestModel.name, schema: RedeemRequestSchema },
      { name: ChatModel.name, schema: ChatSchema },
      { name: ReferralBonusModel.name, schema: ReferralBonusSchema },
      {
        name: UserToCustomerMappingModel.name,
        schema: UserToCustomerMappingSchema,
      },
      { name: CustomerKycDetailModel.name, schema: CustomerKycDetailSchema },
    ]),
    LedgerModule,
    CustomerModule,
    BannerModule,
    InsideBannerModule,
    UserModule,
    ExpenseModule,
    LeaveModule,
    ActivityModule,
    EnquiryModule,
    FollowupModule,
    StockTransferModule,
  ],
  controllers: [AppHomeController, HomeController],
  providers: [AppHomeService, HomeService, ResponseService, DateTimeService],
})
export class HomeModule {}
