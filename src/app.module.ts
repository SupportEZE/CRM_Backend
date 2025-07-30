import { UserModule } from './modules/master/user/user.module';
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import appConfig, { Environment } from './config/app.config';
import databaseConfig from './config/database.config';
import { MongoConfig } from './config/database/mongo.config';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { ApilogInterceptor } from './interceptors/apilog.interceptor';
import { ApilogModule } from './shared/apilog/apilog.module';
import { CryptoInterceptor } from './interceptors/crypto.interceptor';
import { CryptoService } from './services/crypto.service';
import { Reflector } from '@nestjs/core';
import { FormBuilderModule } from './shared/form-builder/form-builder.module';
import { TranslateModule } from './shared/translate/translate.module';
import { HolidayModule } from './modules/master/holiday/holiday.module';
import { ProductModule } from './modules/master/product/product.module';
import { TableBuilderModule } from './shared/table-builder/table-builder.module';
import { CustomerModule } from './modules/master/customer/customer.module';
import { DropdownModule } from './modules/master/dropdown/dropdown.module';
import { QrcodeModule } from './modules/loyalty/qr-code/qr-code.module';
import { CustomerTypeModule } from './modules/master/customer-type/customer-type.module';
import { RbacModule } from './modules/master/rbac/rbac.module';
import { PointCategoryModule } from './modules/master/point-category/point-category.module';
import { PostalCodeModule } from './modules/master/location-master/postal-code/postal-code.module';
import { ContactModule } from './modules/master/app-content/contact/contact.module';
import { AboutModule } from './modules/master/app-content/about/about.module';
import { FaqModule } from './modules/master/app-content/faq/faq.module';
import { VideosModule } from './modules/master/app-content/videos/videos.module';
import { BannerModule } from './modules/master/app-content/banner/banner.module';
import { DocumentModule } from './modules/master/app-content/document/document.module';
import { PrivacyPolicyModule } from './modules/master/app-content/privacy-policy/privacy-policy.module';
import { TermsConditionsModule } from './modules/master/app-content/terms-condition/terms-conditions.module';
import { TicketModule } from './modules/master/ticket/ticket.module';
import { GiftGalleryModule } from './modules/loyalty/gift-gallery/gift-gallery.module';
import { BonusModule } from './modules/loyalty/bonus/bonus.module';
import { RpcModule } from './shared/rpc/rpc.module';
import { DownloaderModule } from './shared/downloader/downloader.module';
import { AttendanceModule } from './modules/sfa/attendance/attendance.module';
import { LeaveModule } from './modules/sfa/leave/leave.module';
import { HomeModule } from './modules/sfa/home/home.module';
import { ZoneMasterModule } from './modules/master/location-master/zone-master/zone-master.module';
import { BeatRouteModule } from './modules/master/location-master/beat-route/beat-route.module';
import { LogModule } from './shared/log/log.module';
import { ExpenseModule } from './modules/sfa/expense/expense.module';
import { ActivityModule } from './modules/sfa/activity/activity.module';
import { FollowupModule } from './modules/sfa/followup/followup.module';
import { SitesModule } from './modules/sfa/sites/sites.module';
import { BeatPlanModule } from './modules/sfa/beat-plan/beat-plan.module';
import { SpinWinModule } from './modules/loyalty/spin-win/spin-win-module';
import { LeaderBoardModule } from './modules/loyalty/leader-board/leader-board.module';
import { CommentModule } from './modules/sfa/comment/comment.module';
import { BadgesModule } from './modules/loyalty/badges/badges.module';
import { ChatModule } from './modules/chat/chat.module';
import { ReferralBonusModule } from './modules/master/referral-bonus/referral-bonus.module';
import { LanguageModule } from './modules/master/language/language.module';
import { LedgerModule } from './modules/loyalty/ledger/ledger.module';
import { CallRequestModule } from './modules/master/call-request/call-request.module';
import { RedeemRequestModule } from './modules/loyalty/redeem-request/redeem-request.module';
import { SocialEngageModule } from './modules/master/social-engage/social-engage.module';
import { AnnouncementModule } from './modules/master/announcement/announcement.module';
import { TargetModule } from './modules/sfa/target/target.module';
import { StockModule } from './modules/sfa/stock/stock.module';
import { PaymentModule } from './modules/sfa/payment/payment.module';
import { InvoicePaymentModule } from './modules/dms/payment/payment.module';
import { UnpaidInvoiceModule } from './modules/dms/unpaid-invoice/unpaid-invoice.module';
import { QuotationModule } from './modules/sfa/quotation/quotation.module';
import { PopGiftModule } from './modules/sfa/pop-gift/pop-gift.module';
import { OrderModule } from './modules/sfa/order/order.module';
import { EventPlanModule } from './modules/sfa/event-plan/event-plan.module';
import { BrandAuditModule } from './modules/sfa/brand-audit/brand-audit.module';
import { InvoiceModule } from './modules/dms/invoice/invoice.module';
import { StockTransferModule } from './modules/dms/stock-transfer/stock-transfer.module';
import { RedisModule } from '@nestjs-modules/ioredis';
import { AuthInterceptor } from './interceptors/auth.interceptor';
import { SecondaryOrderModule } from './modules/sfa/secondary-order/secondary-order.module';
import { DispatchModule } from './modules/wms/dispatch/dispatch.module';
import { SparePartModule } from './modules/wcms/spare-part/spare-part.module';
import { GatepassModule } from './modules/wms/gate-pass/gatepass.module';
import { ComplaintModule } from './modules/wcms/complaint/complaint.module';
import { ComplaintInvoiceModule } from './modules/wcms/complaint-invoice/complaint-invoice.module';
import { PurchaseModule } from './modules/loyalty/purchase/purchase.module';
import { EnquiryModule } from './modules/sfa/enquiry/enquiry-module';
import { AppVersionModule } from './shared/version/version.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [databaseConfig, appConfig],
      envFilePath: process.env.ENV_FILE ? [process.env.ENV_FILE] : ['.env'],
    }),
    RedisModule.forRoot({
      type: 'single',
      url: process.env.REDIS_URL,
    }),
    ...MongoConfig,
    ApilogModule,
    AppVersionModule,
    UserModule,
    FormBuilderModule,
    ProductModule,
    TranslateModule,
    HolidayModule,
    TableBuilderModule,
    CustomerModule,
    DropdownModule,
    QrcodeModule,
    CustomerTypeModule,
    RbacModule,
    PointCategoryModule,
    PostalCodeModule,
    ContactModule,
    AboutModule,
    FaqModule,
    VideosModule,
    BannerModule,
    DispatchModule,
    DocumentModule,
    PrivacyPolicyModule,
    TermsConditionsModule,
    TicketModule,
    GiftGalleryModule,
    RpcModule,
    DownloaderModule,
    AttendanceModule,
    GatepassModule,
    LeaveModule,
    BonusModule,
    HomeModule,
    ZoneMasterModule,
    BeatRouteModule,
    LogModule,
    ExpenseModule,
    EnquiryModule,
    ActivityModule,
    FollowupModule,
    BeatPlanModule,
    SpinWinModule,
    LeaderBoardModule,
    CommentModule,
    ReferralBonusModule,
    BadgesModule,
    CommentModule,
    ReferralBonusModule,
    ChatModule,
    LanguageModule,
    LedgerModule,
    CallRequestModule,
    RedeemRequestModule,
    SocialEngageModule,
    AnnouncementModule,
    TargetModule,
    StockModule,
    PaymentModule,
    InvoicePaymentModule,
    SitesModule,
    QuotationModule,
    PopGiftModule,
    OrderModule,
    EventPlanModule,
    BrandAuditModule,
    InvoiceModule,
    StockTransferModule,
    UnpaidInvoiceModule,
    SecondaryOrderModule,
    SparePartModule,
    ComplaintInvoiceModule,
    ComplaintModule,
    PurchaseModule,
  ],
  providers: [
    CryptoService,
    Reflector,
    {
      provide: APP_INTERCEPTOR,
      useClass: AuthInterceptor,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: CryptoInterceptor,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: ApilogInterceptor,
    },
  ],
})
export class AppModule {
  constructor() {
    if (process.env.NODE_ENV !== Environment.PRODUCTION) {
      const mongoose = require('mongoose');
      mongoose.set('debug', true);
    }
  }
}
