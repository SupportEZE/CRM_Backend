import { Injectable } from '@nestjs/common';
import { OzoneQuotationService } from './ozone/web/ozone-quotation.service';
import { QuotationService } from './default/web/quotation.service';
import { QuotationStrategy } from './quotation-strategy.interface';
import { OzoneAppQuotationService } from './ozone/app/app-ozone-quotation.service';
import { CommentService } from '../comment/web/comment.service';
import { AppQuotationService } from './default/app/app-quotation.service';
import { Request } from 'express-serve-static-core';
@Injectable()
export class QuotationStrategyFactory {
  constructor(
    private defaultQuotationService: QuotationService,
    private OzoneQuotationService: OzoneQuotationService,
    private AppDefaultQuotationService: AppQuotationService,
    private OzoneAppQuotationService: OzoneAppQuotationService,
  ) {}

  getStrategy(client: string): QuotationStrategy {
    const clientStr = String(client).trim();

    switch (clientStr) {
      case '6': //'Ozone'
        return this.OzoneQuotationService;
      default:
        return this.defaultQuotationService;
    }
  }

  getAppStrategy(client: string): QuotationStrategy {
    const clientStr = String(client).trim();
    switch (clientStr) {
      // case 'Ezeone Technologies Dev':
      case '6':
        return this.OzoneAppQuotationService;
      default:
        return this.AppDefaultQuotationService;
    }
  }
}
