import { Injectable } from '@nestjs/common';
import { OzoneEnquiryService } from './ozone/web/ozone-enquiry.service';
import { DefaultEnquiryService } from './default/web/default-enquiry.service';
import { CommentStrategy, EnquiryStrategy, PostalCodeStrategy } from './enquiry-strategy.interface';
import { AppOzoneEnquiryService } from './ozone/app/app-ozone-enquiry.service';
import { CommentService } from '../comment/web/comment.service';
import { AppDefaultEnquiryService } from './default/app/app-default-enquiry.service';
import { PostalCodeService } from 'src/modules/master/location-master/postal-code/web/postal-code.service';
@Injectable()
export class EnquiryStrategyFactory {
    constructor(
        private defaultEnquiryService: DefaultEnquiryService,
        private ozoneEnquiryService: OzoneEnquiryService,
        private appDefaultEnquiryService: AppDefaultEnquiryService,
        private appOzoneEnquiryService: AppOzoneEnquiryService,
        private commentService: CommentService,
        private PostalCodeService: PostalCodeService,
    ) { }
    
    getStrategy(client: string): EnquiryStrategy {
        const clientStr = String(client).trim();
        switch (clientStr) {
            case '6':  //'Ozone'
                return this.ozoneEnquiryService;
            default:
                return this.defaultEnquiryService;
        }
    }

    getAppStrategy(client: string): EnquiryStrategy {
        const clientStr = String(client).trim();
        switch (clientStr) {
            case '6':
                return this.appOzoneEnquiryService;
            default:
                return this.appDefaultEnquiryService;
        }
    }

    getCommentStrategy(client: string): CommentStrategy {
        const clientStr = String(client).trim();
        switch (clientStr) {
            case '6':
                return this.commentService;
            default:
                return this.commentService;
        }
    }
    getPostalStrategy(client: string): PostalCodeStrategy {
        const clientStr = String(client).trim();
        switch (clientStr) {
            case '6':
                return this.PostalCodeService;
            default:
                return this.PostalCodeService;
        }
    }
}
