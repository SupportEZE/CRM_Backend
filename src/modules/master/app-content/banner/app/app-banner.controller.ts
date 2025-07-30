import { Controller, Post, Body, Req, Request } from '@nestjs/common';
import { AppBannerService } from './app-banner.service';
import { ApiBearerAuth, ApiTags, ApiBody, ApiOperation } from '@nestjs/swagger';

@ApiTags('App-Banner')
@ApiBearerAuth('Authorization')
@Controller('app-banner')
export class AppBannerController {
  constructor(private readonly appBannerService: AppBannerService) { }

  @ApiOperation({ summary: 'Read Banner' })
  @Post('/read')
  async read(@Req() req: Request, @Body() params: any): Promise<any> {
    return await this.appBannerService.read(req, params);
  }
}
