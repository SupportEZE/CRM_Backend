import { Body, Controller, Post, Req } from '@nestjs/common';
import { RedeemRequestService } from './redeem-request.service';
import { ReadRedeemDto, StatusRedeemDto, TransferRedeemDto } from './dto/redeem-request.dto';
import { ApiBearerAuth, ApiTags, ApiBody, ApiOperation } from '@nestjs/swagger';


@ApiTags('Web-Redeem')
@ApiBearerAuth('Authorization')
@Controller('redeem')
export class RedeemRequestController {
  constructor(
    private readonly redeemRequestService: RedeemRequestService

  ) { }

  @ApiOperation({ summary: 'redeem list' })
  @ApiBody({ type: ReadRedeemDto })
  @Post('/read')
  async read(@Req() req: any, @Body() params: ReadRedeemDto): Promise<ReadRedeemDto> {
    return await this.redeemRequestService.read(req, params);
  }


  @ApiOperation({ summary: 'Status change request' })
  @ApiBody({ type: StatusRedeemDto })
  @Post('/status')
  async status(@Req() req: any, @Body() params: StatusRedeemDto): Promise<StatusRedeemDto> {
    return await this.redeemRequestService.status(req, params);
  }

  @ApiOperation({ summary: 'Transfer request' })
  @ApiBody({ type: TransferRedeemDto })
  @Post('/transfer')
  async transfer(@Req() req: any, @Body() params: TransferRedeemDto): Promise<TransferRedeemDto> {
    return await this.redeemRequestService.transfer(req, params);
  }
}
