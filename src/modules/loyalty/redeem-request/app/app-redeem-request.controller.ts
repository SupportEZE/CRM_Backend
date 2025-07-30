import { Controller, Post, Body, Req } from '@nestjs/common';
import { AppRedeemRequestService } from './app-redeem-request.service';
import { CreateRedeemRequestDto, ReadRedeemRequestDto } from '../app/dto/app-redeem-request.dto';
import { ApiBearerAuth, ApiTags, ApiBody, ApiOperation } from '@nestjs/swagger';
import { _IdDto } from 'src/common/dto/common.dto';
@ApiTags('App-Redeem')
@ApiBearerAuth('Authorization')
@Controller('app-redeem')
export class AppRedeemRequestController {
  constructor(private readonly appRedeemRequestService: AppRedeemRequestService) { }


  @ApiOperation({ summary: 'Create Redeem Request.' })
  @ApiBody({ type: CreateRedeemRequestDto })
  @Post('/create')
  async create(@Req() req: any, @Body() params: CreateRedeemRequestDto): Promise<CreateRedeemRequestDto> {
    return await this.appRedeemRequestService.create(req, params);
  }

  @ApiOperation({ summary: 'Read Redeem Request.' })
  @ApiBody({ type: ReadRedeemRequestDto })
  @Post('/read')
  async read(@Req() req: any, @Body() params: ReadRedeemRequestDto): Promise<ReadRedeemRequestDto> {
    return await this.appRedeemRequestService.read(req, params);
  }

  @ApiOperation({ summary: 'Detail Redeem Request.' })
  @ApiBody({ type: _IdDto })
  @Post('/detail')
  async detail(@Req() req: any, @Body() params: _IdDto): Promise<_IdDto> {
    return await this.appRedeemRequestService.detail(req, params);
  }
}
