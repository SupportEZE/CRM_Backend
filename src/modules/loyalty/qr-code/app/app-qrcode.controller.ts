import { Body, Controller, Post, Req } from '@nestjs/common';
import { AppQrcodeService } from './app-qrcode.service';
import { ApiBearerAuth, ApiTags, ApiBody, ApiOperation } from '@nestjs/swagger';
import { ScanQrDto, PointHistoryDto } from './dto/app-qr-dto';


@ApiTags('App-Qrcode')
@ApiBearerAuth('Authorization')
@Controller('app-qrcode')
export class AppQrcodeController {
  constructor(private readonly appQrcodeService: AppQrcodeService) { }

  @ApiOperation({ summary: 'Scan QR' })
  @ApiBody({ type: ScanQrDto })
  @Post('/scan')
  async create(@Req() req: any, @Body() params: ScanQrDto): Promise<ScanQrDto> {
    return await this.appQrcodeService.create(req, params);
  }

  @ApiOperation({ summary: 'Point History' })
  @ApiBody({ type: PointHistoryDto })
  @Post('/point-history')
  async readScanQr(@Req() req: any, @Body() params: PointHistoryDto): Promise<PointHistoryDto> {
    return await this.appQrcodeService.readScanQr(req, params);
  }

  @ApiOperation({ summary: 'Inside Banner.' })
  @Post('/inside-banner')
  async insideBanner(@Req() req: any, @Body() params: any): Promise<any> {
    return await this.appQrcodeService.insideBanner(req, params);
  }
}
