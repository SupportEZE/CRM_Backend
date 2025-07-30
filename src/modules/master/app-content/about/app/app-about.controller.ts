import { Controller, Post, Body, Req, Request } from '@nestjs/common';
import { AppAboutService } from './app-about.service';
import { ApiBearerAuth, ApiTags, ApiBody, ApiOperation } from '@nestjs/swagger';

@ApiTags('App-About')
@ApiBearerAuth('Authorization')
@Controller('app-about')
export class AppAboutController {
  constructor(private readonly appaboutService: AppAboutService) { }

  @ApiOperation({ summary: 'Read About' })
  @Post('/read')
  async read(@Req() req: Request, @Body() params: any): Promise<any> {
    return await this.appaboutService.read(req, params);
  }
}