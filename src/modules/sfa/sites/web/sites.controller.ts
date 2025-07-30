import { Body, Controller, Patch, Post, Req, Request, UploadedFiles, UseInterceptors } from '@nestjs/common';
import { SitesService } from './sites.service';
import {
  CreateSitesDto, UpdateSitesDto, ReadSitesDto, AssignUserDto, StatusUdateSitesDto,
  SaveStageDto, ActivitiesDto, SaveContactDto, UpdateContactDto, SiteReadQuotationDto, DeleteContactDto,
  SaveLocationDto, SaveCommentSitesDto, ReadCommentsSitesDto, SaveCompetitorDto
} from './dto/sites.dto';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiBody } from '@nestjs/swagger';
import { FilesInterceptor } from '@nestjs/platform-express';
import { CommentService } from '../../comment/web/comment.service';
import { _IdDto } from 'src/common/dto/common.dto';

@ApiTags('Web-Site')
@ApiBearerAuth('Authorization')
@Controller('sites')
export class SitesController {
  constructor(
    private readonly siteprojectService: SitesService,
    private readonly commentService: CommentService,

  ) { }

  @ApiOperation({ summary: 'Create Sites' })
  @ApiBody({ type: CreateSitesDto })
  @Post('/create')
  async create(@Req() req: Request, @Body() params: CreateSitesDto): Promise<CreateSitesDto> {
    return await this.siteprojectService.create(req, params);
  }

  @ApiOperation({ summary: 'Update Sites' })
  @ApiBody({ type: UpdateSitesDto })
  @Patch('/update')
  async update(@Req() req: Request, @Body() params: UpdateSitesDto): Promise<UpdateSitesDto> {
    return this.siteprojectService.update(req, params);
  }

  @ApiOperation({ summary: 'Read Sites' })
  @ApiBody({ type: ReadSitesDto })
  @Post('/read')
  async read(@Req() req: Request, @Body() params: ReadSitesDto): Promise<ReadSitesDto> {
    return this.siteprojectService.read(req, params);
  }

  @ApiOperation({ summary: 'Fetch Site Detail' })
  @ApiBody({ type: _IdDto })
  @Post('/detail')
  async detail(@Req() req: Request, @Body() params: _IdDto): Promise<_IdDto> {
    return this.siteprojectService.detail(req, params);
  }

  @ApiOperation({ summary: 'Assign User' })
  @ApiBody({ type: AssignUserDto })
  @Post('/user-assign')
  async userassign(@Req() req: Request, @Body() params: AssignUserDto): Promise<AssignUserDto> {
    return this.siteprojectService.userAssign(req, params);
  }

  @ApiOperation({ summary: 'Site Status Update' })
  @ApiBody({ type: StatusUdateSitesDto })
  @Patch('/status-update')
  async statusUpdate(@Req() req: Request, @Body() params: StatusUdateSitesDto): Promise<StatusUdateSitesDto> {
    return this.siteprojectService.statusUpdate(req, params);
  }

  @ApiOperation({ summary: 'Save Lat Long' })
  @ApiBody({ type: SaveLocationDto })
  @Patch('/save-location')
  async saveLocation(@Req() req: Request, @Body() params: SaveLocationDto): Promise<SaveLocationDto> {
    return this.siteprojectService.saveLocation(req, params);
  }

  @ApiOperation({ summary: 'Save Stages' })
  @ApiBody({ type: SaveStageDto })
  @Post('/save-stage')
  async saveStage(@Req() req: Request, @Body() params: SaveStageDto): Promise<SaveStageDto> {
    return this.siteprojectService.saveStage(req, params);
  }

  @ApiOperation({ summary: 'Save Competitor' })
  @ApiBody({ type: SaveCompetitorDto })
  @Post('/save-competitor')
  async saveCompetitor(@Req() req: Request, @Body() params: SaveCompetitorDto): Promise<SaveCompetitorDto> {
    return this.siteprojectService.saveCompetitor(req, params);
  }

  @ApiOperation({ summary: 'Read Stages' })
  @ApiBody({ type: SiteReadQuotationDto })
  @Post('/read-quotation')
  async readQuotation(@Req() req: Request, @Body() params: SiteReadQuotationDto): Promise<SiteReadQuotationDto> {
    return this.siteprojectService.readQuotation(req, params);
  }

  @ApiOperation({ summary: 'Activities' })
  @ApiBody({ type: ActivitiesDto })
  @Post('/activities')
  async activities(@Req() req: Request, @Body() params: ActivitiesDto): Promise<ActivitiesDto> {
    return this.siteprojectService.activities(req, params);
  }

  @ApiOperation({ summary: 'Save Contact' })
  @ApiBody({ type: SaveContactDto })
  @Post('/save-contact')
  async saveContact(@Req() req: Request, @Body() params: SaveContactDto): Promise<SaveContactDto> {
    return this.siteprojectService.saveContact(req, params);
  }

  @ApiOperation({ summary: 'Save Contact' })
  @ApiBody({ type: SaveContactDto })
  @Patch('/update-contact')
  async updateContact(@Req() req: Request, @Body() params: UpdateContactDto): Promise<UpdateContactDto> {
    return this.siteprojectService.updateContact(req, params);
  }

  @ApiOperation({ summary: 'Save Comment' })
  @ApiBody({ type: SaveCommentSitesDto })
  @Post('/save-comment')
  async saveComment(@Req() req: Request, @Body() params: SaveCommentSitesDto): Promise<SaveCommentSitesDto> {
    return this.commentService.saveComment(req, params);
  }

  @ApiOperation({ summary: 'Read Comment' })
  @ApiBody({ type: ReadCommentsSitesDto })
  @Post('/read-comment')
  async readComments(@Req() req: Request, @Body() params: ReadCommentsSitesDto): Promise<ReadCommentsSitesDto> {
    return this.commentService.readComments(req, params);
  }

  @ApiOperation({ summary: 'Delete Contact' })
  @ApiBody({ type: DeleteContactDto })
  @Patch('/delete-contact')
  async deleteContact(@Req() req: Request, @Body() params: DeleteContactDto): Promise<DeleteContactDto> {
    return this.siteprojectService.deleteContact(req, params);
  }


  @ApiOperation({ summary: 'Upload Multiple Files to Bucket.' })
  @Post('upload')
  @UseInterceptors(FilesInterceptor('files', 5))
  async uploadFiles(
    @UploadedFiles() files: Express.Multer.File[],
    @Req() req: any,
  ) {
    return await this.siteprojectService.upload(files, req);
  }

  @Post('/get-doc')
  async getDocumentById(@Req() req: Request, @Body() params: _IdDto): Promise<_IdDto> {
    return await this.siteprojectService.getDocumentByDocsId(req, params);
  }
}