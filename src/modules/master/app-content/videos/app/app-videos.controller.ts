import { Controller, Post, Body, Req } from '@nestjs/common';
import { AppVideosService } from './app-videos.service';
import { ApiBearerAuth, ApiTags, ApiBody, ApiOperation } from '@nestjs/swagger';

@ApiTags('App-Videos')
@ApiBearerAuth('Authorization')
@Controller('app-videos')
export class AppVideosController {
  constructor(private readonly appvideosService: AppVideosService) { }

  @ApiOperation({ summary: 'Read Videos' })
  @Post('/read')
  async read(@Req() req: any, @Body() params: any): Promise<any> {
    return await this.appvideosService.read(req, params);
  }
}
