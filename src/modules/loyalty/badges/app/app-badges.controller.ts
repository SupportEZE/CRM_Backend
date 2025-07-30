import { Controller, Post, Body, Req } from '@nestjs/common';
import { AppBadgesService } from './app-badges.service';
import { AppReadBadgesDto, AppBadgesDocsDto } from '../app/dto/app-badges.dto';
import { BadgesService } from '../web/badges.service';
import { ApiBearerAuth, ApiTags, ApiBody, ApiOperation } from '@nestjs/swagger';


@ApiTags('App-Badges')
@ApiBearerAuth('Authorization')
@Controller('app-badges')
export class AppBadgesController {
  constructor(
    private readonly appbadgesService: AppBadgesService,
    private readonly badgesService: BadgesService,

  ) { }

  @ApiOperation({ summary: 'Read App Badges.' })
  @ApiBody({ type: AppReadBadgesDto })
  @Post('/read')
  async read(@Req() req: any, @Body() params: AppReadBadgesDto): Promise<AppReadBadgesDto> {
    return await this.appbadgesService.read(req, params);
  }

  @Post('/get-doc')
  async getDocumentById(@Req() req: Request, @Body() params: AppBadgesDocsDto): Promise<AppBadgesDocsDto> {
    return await this.badgesService.getDocumentByDocsId(req, params);
  }
}
