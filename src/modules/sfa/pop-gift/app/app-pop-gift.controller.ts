import { Body, Controller, Post, Req } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiTags,
  ApiOperation,
  ApiBody,
} from '@nestjs/swagger';
import { AppPopGiftService } from './app-pop-gift.service';
import { CustomerTypeService } from 'src/modules/master/customer-type/web/customer-type.service';
import { SharedCustomerService } from 'src/modules/master/customer/shared-customer.service';
import {
  DetailDto,
  PopGiftTransactionDto,
  ReadCustomer,
  AppReadPopGiftDto,
} from './dto/app-pop-gift.dto';

import { PopGiftService } from '../web/pop-gift.service';
import { _IdDto } from 'src/common/dto/common.dto';

export const enum AppPopGiftRoutes{
  READ='read',
  READ_DROPDOWN='read-dropdown',
  SEND_OTP='send-otp'
}

@ApiTags('App-Pop-gift')
@ApiBearerAuth('Authorization')
@Controller('app-pop-gift')
export class AppPopGiftController {
  constructor(
    private readonly appPopGiftService: AppPopGiftService,
    private readonly customerTypeService: CustomerTypeService,
    private readonly sharedCustomerService: SharedCustomerService,
    private readonly popGiftService: PopGiftService,
  ) {}
  
  @Post('/read')
  @ApiOperation({ summary: 'Read pop gift data' })
  @ApiBody({ type: AppReadPopGiftDto })
  async read(@Req() req: any, @Body() params: AppReadPopGiftDto): Promise<AppReadPopGiftDto> {
    return await this.appPopGiftService.read(req, params);
  }
  
  @Post('/detail')
  @ApiOperation({ summary: 'Get detail of a specific pop gift' })
  @ApiBody({ type: DetailDto })
  async detail(@Req() req: any, @Body() params: DetailDto): Promise<DetailDto> {
    return await this.appPopGiftService.detail(req, params);
  }
  
  @Post('/read-dropdown')
  @ApiOperation({ summary: 'Read dropdown options for pop gift' })
  @ApiBody({ type: Object }) // Replace with a DTO if needed
  async readDropdown(@Req() req: any, @Body() params: any): Promise<any> {
    return await this.appPopGiftService.read(req, params);
  }
  
  @Post('/customer-type')
  @ApiOperation({ summary: 'Get customer types for dropdown' })
  @ApiBody({ type: Object })
  async customerType(@Req() req: Request, @Body() params: any): Promise<any> {
    return await this.customerTypeService.readDropdown(req, params);
  }
  
  @Post('/customer')
  @ApiOperation({ summary: 'Get customers for dropdown' })
  @ApiBody({ type: ReadCustomer })
  async customer(@Req() req: Request, @Body() params: ReadCustomer): Promise<ReadCustomer> {
    return await this.sharedCustomerService.readDropdown(req, params);
  }
  
  @Post('/transfer-stock')
  @ApiOperation({ summary: 'Transfer stock between users' })
  @ApiBody({ type: PopGiftTransactionDto })
  async transferStock(@Req() req: Request, @Body() params: PopGiftTransactionDto): Promise<PopGiftTransactionDto> {
    return await this.appPopGiftService.transferStock(req, params);
  }
  
  @Post('/send-otp')
  @ApiOperation({ summary: 'Validate stock and send OTP for stock transfer' })
  @ApiBody({ type: PopGiftTransactionDto })
  async validateStockAndSendOtp(@Req() req: Request, @Body() params: PopGiftTransactionDto): Promise<PopGiftTransactionDto> {
    return await this.appPopGiftService.validateStockAndSendOtp(req, params);
  }
  
  @Post('/resend-otp')
  @ApiOperation({ summary: 'Resend OTP for stock transfer' })
  @ApiBody({ type: Object })
  async resendOtp(@Req() req: Request, @Body() params: any): Promise<any> {
    return await this.appPopGiftService.resendOtp(req, params);
  }
  
  @Post('/get-doc')
  async getDocumentById(@Req() req: Request, @Body() params: _IdDto): Promise<_IdDto> {
    return await this.popGiftService.getDocumentByDocsId(req, params);
  }
}
