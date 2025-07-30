import { Body, Controller, Post, Req, Patch, UseInterceptors, UploadedFiles } from '@nestjs/common';
import { AnnouncementService } from './announcement.service';
import { CreateAnnouncementDto, ReadAnnouncementDto, DetailAnnouncementDto, UpdateStatusDto, DeleteAnnouncementDto } from './dto/announcement.dto';
import { ApiBearerAuth, ApiTags, ApiBody, ApiOperation } from '@nestjs/swagger';
import { FilesInterceptor } from '@nestjs/platform-express';
import { _IdDto } from 'src/common/dto/common.dto';


@ApiTags('web-announcement')
@ApiBearerAuth('Authorization')
@Controller('announcement')
export class AnnouncementController {
  constructor(private readonly announcementService: AnnouncementService) { }

  @Post('/create')
  @ApiOperation({ summary: 'Create a new announcement' })
  @ApiBody({ type: CreateAnnouncementDto })
  async create(@Req() req: any, @Body() params: CreateAnnouncementDto): Promise<CreateAnnouncementDto> {
    return await this.announcementService.create(req, params);
  }

  @Post('/read')
  @ApiOperation({ summary: 'Read all announcements with pagination and filters' })
  @ApiBody({ type: ReadAnnouncementDto })
  async read(@Req() req: any, @Body() params: ReadAnnouncementDto): Promise<ReadAnnouncementDto> {
    return await this.announcementService.read(req, params);
  }

  @Post('/detail')
  @ApiOperation({ summary: 'Get details of a specific announcement' })
  @ApiBody({ type: DetailAnnouncementDto })
  async detail(@Req() req: any, @Body() params: DetailAnnouncementDto): Promise<DetailAnnouncementDto> {
    return await this.announcementService.detail(req, params);
  }

  @Patch('/update-status')
  @ApiOperation({ summary: 'Update the status of an announcement' })
  @ApiBody({ type: UpdateStatusDto })
  async updateStatus(@Req() req: Request, @Body() params: UpdateStatusDto): Promise<UpdateStatusDto> {
    return await this.announcementService.updateStatus(req, params);
  }

  @Patch('/delete')
  @ApiOperation({ summary: 'Soft delete an announcement' })
  @ApiBody({ type: DeleteAnnouncementDto })
  async delete(@Req() req: Request, @Body() params: DeleteAnnouncementDto): Promise<DeleteAnnouncementDto> {
    return await this.announcementService.updateStatus(req, params);
  }

  @ApiOperation({ summary: 'Upload Multiple Files to Bucket.' })
  @Post('upload')
  @UseInterceptors(FilesInterceptor('files', 5))
  async uploadFiles(
    @UploadedFiles() files: Express.Multer.File[],
    @Req() req: any,
  ) {
    return await this.announcementService.upload(files, req);
  }

  @Post('/get-doc')
  async getDocumentById(@Req() req: Request, @Body() params: _IdDto): Promise<_IdDto> {
    return await this.announcementService.getDocumentByDocsId(req, params);
  }
}
