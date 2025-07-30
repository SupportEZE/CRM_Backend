import { Body, Controller, Post, Req, Patch, UseInterceptors, UploadedFiles } from '@nestjs/common';
import { BadgesService } from './badges.service';
import { CreateBadgesDto, UpdateBadgesDto, ReadBadgesDto, UpdateBadgesStatusDto ,DeleteBadgeDto } from './dto/badges.dto';
import { FilesInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiBody } from '@nestjs/swagger';
import { _IdDto } from 'src/common/dto/common.dto';

@ApiTags('Web-Badges')
@ApiBearerAuth('Authorization')
@Controller('badges')
export class BadgesController {
  constructor(
    private readonly badgesService: BadgesService

  ) { }


  @ApiOperation({ summary: 'Created Badges' })
  @ApiBody({ type: CreateBadgesDto })
  @Post('/create')
  async create(@Req() req: any, @Body() params: CreateBadgesDto): Promise<CreateBadgesDto> {
    return await this.badgesService.create(req, params);
  }

  @ApiOperation({ summary: 'Update Badges' })
  @ApiBody({ type: UpdateBadgesDto })
  @Post('/update')
  async update(@Req() req: any, @Body() params: UpdateBadgesDto): Promise<UpdateBadgesDto> {
    return await this.badgesService.update(req, params);
  }


  @ApiOperation({ summary: 'Badges List data' })
  @ApiBody({ type: CreateBadgesDto })
  @Post('/read')
  async read(@Req() req: any, @Body() params: ReadBadgesDto): Promise<ReadBadgesDto> {
    return await this.badgesService.read(req, params);
  }

  @ApiOperation({ summary: 'Badges Status Update' })
  @ApiBody({ type: UpdateBadgesStatusDto })
  @Patch('/update-status')
  async updateStatus(@Req() req: any, @Body() params: UpdateBadgesStatusDto): Promise<UpdateBadgesStatusDto> {
    return await this.badgesService.updateStatus(req, params);
  }

  @ApiOperation({ summary: 'Upload Multiple Files to Bucket.' })
  @Post('upload')
  @UseInterceptors(FilesInterceptor('files', 5))
  async uploadFiles(
    @UploadedFiles() files: Express.Multer.File[],
    @Req() req: any,
  ) {
    return await this.badgesService.upload(files, req);
  }

  @Post('/get-doc')
  async getDocumentById(@Req() req: Request, @Body() params: _IdDto): Promise<_IdDto> {
    return await this.badgesService.getDocumentByDocsId(req, params);
  }

  @ApiOperation({ summary: 'Delete Badge.' })
    @ApiBody({ type: DeleteBadgeDto })
    @Patch('/delete')
    async delete(@Req() req: Request, @Body() params: DeleteBadgeDto): Promise<DeleteBadgeDto> {
      return await this.badgesService.delete(req, params);
    }
}
