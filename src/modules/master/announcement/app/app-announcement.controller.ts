import { Controller, Post, Body, Req, Request } from '@nestjs/common';
import { AppAnnouncementService } from './app-announcement.service';
import { AnnouncementService } from '../web/announcement.service';
import { ApiBearerAuth, ApiTags, ApiBody, ApiOperation } from '@nestjs/swagger';
import { DetailAnnouncementDto, ReadAnnouncementDto } from '../web/dto/announcement.dto';
import { _IdDto } from 'src/common/dto/common.dto';

@ApiTags('App-Announcement')
@ApiBearerAuth('Authorization')
@Controller('app-announcement')
export class AppAnnouncementController {
  constructor(
    private readonly appannouncementService: AppAnnouncementService,
    private readonly announcementService: AnnouncementService,

  ) { }

  @ApiOperation({ summary: 'Get announcements', description: 'Retrieve a list of announcements based on filters.' })
  @ApiBody({ type: ReadAnnouncementDto })
  @Post('/read')
  async read(@Req() req: Request, @Body() params: ReadAnnouncementDto): Promise<ReadAnnouncementDto> {
    return await this.appannouncementService.read(req, params);
  }

  @ApiOperation({ summary: 'Get announcement details', description: 'Retrieve details of a specific announcement by ID.' })
  @ApiBody({ type: DetailAnnouncementDto })
  @Post('/detail')
  async detail(@Req() req: Request, @Body() params: DetailAnnouncementDto): Promise<DetailAnnouncementDto> {
    return await this.appannouncementService.detail(req, params);
  }

  @Post('/get-doc')
  async getDocumentById(@Req() req: Request, @Body() params: _IdDto): Promise<_IdDto> {
    return await this.announcementService.getDocumentByDocsId(req, params);
  }


}
