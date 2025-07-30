import { INestApplication } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AttendanceModule } from 'src/modules/sfa/attendance/attendance.module';
import { FormBuilderModule } from 'src/shared/form-builder/form-builder.module';
import { TableBuilderModule } from 'src/shared/table-builder/table-builder.module';
import { CustomerModule } from 'src/modules/master/customer/customer.module';
import { ExpenseModule } from 'src/modules/sfa/expense/expense.module';
import { HomeModule } from 'src/modules/sfa/home/home.module';
import { LeaveModule } from 'src/modules/sfa/leave/leave.module';
import { AboutModule } from 'src/modules/master/app-content/about/about.module';
import { ContactModule } from 'src/modules/master/app-content/contact/contact.module';
import { DocumentModule } from 'src/modules/master/app-content/document/document.module';
import { FaqModule } from 'src/modules/master/app-content/faq/faq.module';
import { PrivacyPolicyModule } from 'src/modules/master/app-content/privacy-policy/privacy-policy.module';
import { TermsConditionsModule } from 'src/modules/master/app-content/terms-condition/terms-conditions.module';
import { VideosModule } from 'src/modules/master/app-content/videos/videos.module';
import { BannerModule } from 'src/modules/master/app-content/banner/banner.module';
import { TicketModule } from 'src/modules/master/ticket/ticket.module';
import { QrcodeModule } from 'src/modules/loyalty/qr-code/qr-code.module';
import { ProductModule } from 'src/modules/master/product/product.module';
import { GiftGalleryModule } from 'src/modules/loyalty/gift-gallery/gift-gallery.module';
import { LedgerModule } from 'src/modules/loyalty/ledger/ledger.module';
import { LanguageModule } from 'src/modules/master/language/language.module';
import { RedeemRequestModule } from 'src/modules/loyalty/redeem-request/redeem-request.module';
import { PointCategoryModule } from 'src/modules/master/point-category/point-category.module';
import { CallRequestModule } from 'src/modules/master/call-request/call-request.module';
import { SpinWinModule } from 'src/modules/loyalty/spin-win/spin-win-module';
import { SocialEngageModule } from 'src/modules/master/social-engage/social-engage.module';
import { BonusModule } from 'src/modules/loyalty/bonus/bonus.module';
import { ReferralBonusModule } from 'src/modules/master/referral-bonus/referral-bonus.module';
import { AnnouncementModule } from 'src/modules/master/announcement/announcement.module';
import { LeaderBoardModule } from 'src/modules/loyalty/leader-board/leader-board.module';
import { ActivityModule } from 'src/modules/sfa/activity/activity.module';
import { SitesModule } from 'src/modules/sfa/sites/sites.module';
import { StockModule } from 'src/modules/sfa/stock/stock.module';
import { BadgesModule } from 'src/modules/loyalty/badges/badges.module';
import { QuotationModule } from 'src/modules/sfa/quotation/quotation.module';
import { PopGiftModule } from 'src/modules/sfa/pop-gift/pop-gift.module';
import { EventPlanModule } from 'src/modules/sfa/event-plan/event-plan.module';
import { FollowupModule } from 'src/modules/sfa/followup/followup.module';
import { EnquiryModule } from 'src/modules/sfa/enquiry/enquiry-module';

export function setupSwagger(app: INestApplication, prefix: string): void {
    const config = new DocumentBuilder()
        .setTitle('EzeOne Technologies')
        .setDescription('API Documentation')
        .setVersion('1.0')
        .addBearerAuth(
            {
                type: 'http',
                scheme: 'Bearer',
                bearerFormat: 'JWT',
            },
            'Authorization'
        )
        .build();

    const document = SwaggerModule.createDocument(app, config, {
        include: [
            AttendanceModule,
            FormBuilderModule,
            TableBuilderModule,
            CustomerModule,
            ExpenseModule,
            HomeModule,
            LeaveModule,
            EnquiryModule,
            AboutModule,
            ContactModule,
            DocumentModule,
            FaqModule,
            PrivacyPolicyModule,
            TermsConditionsModule,
            VideosModule,
            BannerModule,
            TicketModule,
            QrcodeModule,
            ProductModule,
            GiftGalleryModule,
            LedgerModule,
            LanguageModule,
            RedeemRequestModule,
            PointCategoryModule,
            CallRequestModule,
            SpinWinModule,
            SocialEngageModule,
            BonusModule,
            ReferralBonusModule,
            AnnouncementModule,
            LeaderBoardModule,
            ActivityModule,
            SitesModule,
            FollowupModule,
            StockModule,
            BadgesModule,
            QuotationModule,
            PopGiftModule,
            EventPlanModule,
        ],
    });

    SwaggerModule.setup(`${prefix}/docs`, app, document);
}