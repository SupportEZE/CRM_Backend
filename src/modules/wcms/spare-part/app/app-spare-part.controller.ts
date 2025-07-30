import { Body, Controller, Post, Req } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiTags,
  ApiOperation,
  ApiBody,
} from '@nestjs/swagger';
import { AppSparePartService } from './app-spare-part.service';
import { CustomerTypeService } from 'src/modules/master/customer-type/web/customer-type.service';
import { SharedCustomerService } from 'src/modules/master/customer/shared-customer.service';
import { DetailDto, SparePartTransactionDto, ReadCustomer, AppReadSparePartDto,} from './dto/app-spare-part.dto';

export const enum AppSparePartRoutes{
  READ='read',
  READ_DROPDOWN='read-dropdown',
  SEND_OTP='send-otp'
}

@ApiTags('App-Spare-Part')
@ApiBearerAuth('Authorization')
@Controller('app-spare-part')
export class AppSparePartController {
  constructor(
    private readonly appSparePartService: AppSparePartService,
    private readonly customerTypeService: CustomerTypeService,
    private readonly sharedCustomerService: SharedCustomerService,
  ) {}

  @Post('/read')
  @ApiOperation({ summary: 'Read spare part data' })
  @ApiBody({ type: AppReadSparePartDto })
  async read(@Req() req: any, @Body() params: AppReadSparePartDto): Promise<AppReadSparePartDto> {
    return await this.appSparePartService.read(req, params);
  }

  @Post('/detail')
  @ApiOperation({ summary: 'Get detail of a specific spare part' })
  @ApiBody({ type: DetailDto })
  async detail(@Req() req: any, @Body() params: DetailDto): Promise<DetailDto> {
    return await this.appSparePartService.detail(req, params);
  }

  @Post('/read-dropdown')
  @ApiOperation({ summary: 'Read dropdown options for spare part' })
  @ApiBody({ type: Object })
  async readDropdown(@Req() req: any, @Body() params: any): Promise<any> {
    return await this.appSparePartService.read(req, params);
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
  @ApiBody({ type: SparePartTransactionDto })
  async transferStock(@Req() req: Request, @Body() params: SparePartTransactionDto): Promise<SparePartTransactionDto> {
    return await this.appSparePartService.transferStock(req, params);
  }

  @Post('/send-otp')
  @ApiOperation({ summary: 'Validate stock and send OTP for stock transfer' })
  @ApiBody({ type: SparePartTransactionDto })
  async validateStockAndSendOtp(@Req() req: Request, @Body() params: SparePartTransactionDto): Promise<SparePartTransactionDto> {
    return await this.appSparePartService.validateStockAndSendOtp(req, params);
  }

  @Post('/resend-otp')
  @ApiOperation({ summary: 'Resend OTP for stock transfer' })
  @ApiBody({ type: Object })
  async resendOtp(@Req() req: Request, @Body() params: any): Promise<any> {
    return await this.appSparePartService.resendOtp(req, params);
  }
}
