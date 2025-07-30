import { _IdDto } from 'src/common/dto/common.dto';
import { SaveCommentDto } from '../comment/web/dto/comment.dto';
import {
  CreateQuotationDto,
  CartItemDto,
  UpdateQuotationItemDto,
  UpdateQuotationDto,
  ReadQuotationDto,
  DeleteQuotationDto,
  QuotationUpdateStatusDto,
  QuotationDetailDto,
} from './default/web/dto/quotation.dto';
import {
  AppCreateQuotationDto,
} from './default/app/dto/app-quotation.dto';

import {
  appOzoneCreateQuotationDto,
} from './ozone/app/dto/app-quotation.dto';

import {
  OzoneCartItemDto,
  OzoneCreateQuotationDto,
  ozoneUpdateQuotationItemDto,
  ozoneUpdateQuotationDto,
  ozoneReadQuotationDto,
  ozoneDeleteQuotationDto,
  ozoneQuotationDetailDto,
  ozoneQuotationByEnquiryDto,
} from './ozone/web/dto/ozone-quotation.dto';

export const WEB_DTO_MAP = {
  create: {
    '6': OzoneCreateQuotationDto,
    'default': CreateQuotationDto,
  },
  updates: {
    '6': OzoneCartItemDto,
    'default': CartItemDto,
  },
  updateItems: {
    '6': ozoneUpdateQuotationItemDto,
    'default': UpdateQuotationItemDto,
  },
  statusUpdate: {
    '6': ozoneUpdateQuotationDto,
    'default': UpdateQuotationDto,
  },
  read: {
    '6': ozoneReadQuotationDto,
    'default': ReadQuotationDto,
  },
  saveStage: {
    '6': ozoneDeleteQuotationDto,
    'default': DeleteQuotationDto,
  },
  detail: {
    '6': ozoneQuotationDetailDto,
    'default': QuotationDetailDto,
  },
  quotationByEnquiry: {
    '6': ozoneQuotationByEnquiryDto,
    'default': SaveCommentDto,
  },
  readComment: {
    // '6': ReadOzoneCommentsSitesDto,
    'default': QuotationUpdateStatusDto,
  },

  getDocs: {
    '6': _IdDto,
    'default': _IdDto,
  },
};

export const APP_DTO_MAP = {
  create: {
    '6': appOzoneCreateQuotationDto,
    'default': AppCreateQuotationDto,
  },
};
