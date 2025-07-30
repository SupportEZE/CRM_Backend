import { Body, Controller, Post, Req, Request, UseInterceptors, UploadedFiles, Patch, Delete, Param } from '@nestjs/common';
import { AppSitesService } from './app-sites.service';
import {
  AppCreateSitesDto, AppUpdateSitesDto, AppReadSitesDto, AppStatusUpdateSitesDto, AppSaveStageDto, ActivitiesDto,
  UpdateContactDto, AppDeleteContactDto, SaveContactDto
} from './dto/app-sites.dto';
import { ApiBearerAuth, ApiTags, ApiBody, ApiOperation } from '@nestjs/swagger';
import { FilesInterceptor } from '@nestjs/platform-express';
import { SitesService } from '../web/sites.service';
import { DropdownService } from 'src/modules/master/dropdown/web/dropdown.service';
import { ReadOptionDropdownDto } from 'src/modules/master/dropdown/web/dto/option.dto';
import { ReadCommentsSitesDto, SiteReadQuotationDto, SaveCommentSitesDto, SaveCompetitorDto, SaveLocationDto, AssignUserDto, DeleteMultipleFilesDto } from '../web/dto/sites.dto';
import { AppCommentService } from '../../comment/app/app-comment.service';
import { _IdDto } from 'src/common/dto/common.dto';

@ApiTags('App-Sites')
@ApiBearerAuth('Authorization')
@Controller('app-siteproject')
export class AppSitesController {
  constructor(
    private readonly appSitesService: AppSitesService,
    private readonly sitesService: SitesService,
    private dropdownService: DropdownService,
    private appCommentService: AppCommentService,

  ) { }

  @ApiOperation({ summary: 'Create Sites' })
  @ApiBody({ type: AppCreateSitesDto })
  @Post('/create')
  async create(@Req() req: any, @Body() params: AppCreateSitesDto): Promise<AppCreateSitesDto> {
    return await this.sitesService.create(req, params);
  }

  @ApiOperation({ summary: 'Update Sites' })
  @ApiBody({ type: AppUpdateSitesDto })
  @Post('/update')
  async update(@Req() req: any, @Body() params: AppUpdateSitesDto): Promise<AppUpdateSitesDto> {
    return this.sitesService.update(req, params);
  }

  @ApiOperation({ summary: 'Read Sites' })
  @ApiBody({ type: AppReadSitesDto })
  @Post('/read')
  async read(@Req() req: any, @Body() params: AppReadSitesDto): Promise<AppReadSitesDto> {
    return this.appSitesService.read(req, params);
  }

  @ApiOperation({ summary: 'Detail Sites' })
  @ApiBody({ type: _IdDto })
  @Post('/detail')
  async detail(@Req() req: any, @Body() params: _IdDto): Promise<_IdDto> {
    return this.appSitesService.detail(req, params);
  }

  @ApiOperation({ summary: 'Sites Status Update' })
  @ApiBody({ type: AppStatusUpdateSitesDto })
  @Patch('/status-update')
  async statusUpdate(@Req() req: any, @Body() params: AppStatusUpdateSitesDto): Promise<AppStatusUpdateSitesDto> {
    return this.appSitesService.statusUpdate(req, params);
  }

  @ApiOperation({ summary: 'Save Stage' })
  @ApiBody({ type: AppSaveStageDto })
  @Post('/save-stage')
  async saveStage(@Req() req: Request, @Body() params: AppSaveStageDto): Promise<AppSaveStageDto> {
    return this.appSitesService.saveStage(req, params);
  }

  @ApiOperation({ summary: 'Save Comment' })
  @ApiBody({ type: SaveCommentSitesDto })
  @Post('/save-comment')
  async saveComment(@Req() req: Request, @Body() params: SaveCommentSitesDto): Promise<SaveCommentSitesDto> {
    return this.appCommentService.saveComment(req, params);
  }

  @ApiOperation({ summary: 'Read Comment' })
  @ApiBody({ type: ReadCommentsSitesDto })
  @Post('/read-comment')
  async readComments(@Req() req: Request, @Body() params: ReadCommentsSitesDto): Promise<ReadCommentsSitesDto> {
    return this.appCommentService.readComments(req, params);
  }

  @ApiOperation({ summary: 'Read Activities' })
  @ApiBody({ type: ActivitiesDto })
  @Post('/activities')
  async activities(@Req() req: Request, @Body() params: ActivitiesDto): Promise<ActivitiesDto> {
    return this.appSitesService.activities(req, params);
  }

  @ApiOperation({ summary: 'Save Contact' })
  @ApiBody({ type: SaveContactDto })
  @Post('/save-contact')
  async saveContact(@Req() req: Request, @Body() params: SaveContactDto): Promise<SaveContactDto> {
    return this.appSitesService.saveContact(req, params);
  }

  @ApiOperation({ summary: 'Update Contact' })
  @ApiBody({ type: UpdateContactDto })
  @Patch('/update-contact')
  async updateContact(@Req() req: Request, @Body() params: UpdateContactDto): Promise<UpdateContactDto> {
    return this.appSitesService.updateContact(req, params);
  }

  @ApiOperation({ summary: 'Delete Contact' })
  @ApiBody({ type: AppDeleteContactDto })
  @Patch('/delete-contact')
  async deleteContact(@Req() req: Request, @Body() params: AppDeleteContactDto): Promise<AppDeleteContactDto> {
    return this.sitesService.deleteContact(req, params);
  }

  @ApiOperation({ summary: 'User Assign Sites' })
  @ApiBody({ type: AssignUserDto })
  @Post('/user-assign')
  async userassign(@Req() req: any, @Body() params: AssignUserDto): Promise<AssignUserDto> {
    return this.appSitesService.userAssign(req, params);
  }

  @Post('/read-dropdown')
  async readDropdown(@Req() req: Request, @Body() params: ReadOptionDropdownDto): Promise<ReadOptionDropdownDto> {
    return await this.dropdownService.readDropdown(req, params);
  }

  @ApiOperation({ summary: 'Save Competitor' })
  @ApiBody({ type: SaveCompetitorDto })
  @Post('/save-competitor')
  async saveCompetitor(@Req() req: Request, @Body() params: SaveCompetitorDto): Promise<SaveCompetitorDto> {
    return this.sitesService.saveCompetitor(req, params);
  }

  @ApiOperation({ summary: 'Read Stages' })
  @ApiBody({ type: SiteReadQuotationDto })
  @Post('/read-quotation')
  async readQuotation(@Req() req: Request, @Body() params: SiteReadQuotationDto): Promise<SiteReadQuotationDto> {
    return this.sitesService.readQuotation(req, params);
  }

  @ApiOperation({ summary: 'Upload Multiple Files to Bucket.' })
  @Post('upload')
  @UseInterceptors(FilesInterceptor('files', 5))
  async uploadFiles(
    @UploadedFiles() files: Express.Multer.File[],
    @Req() req: any,
  ) {
    return await this.sitesService.upload(files, req);
  }

  @ApiOperation({ summary: 'Delete uploaded file by ID' })
  @Patch('/delete')
  async deleteFile(@Body() body: DeleteMultipleFilesDto) {
    return await this.sitesService.deleteFile(body.ids);
  }

  @Post('/get-doc')
  async getDocumentById(@Req() req: Request, @Body() params: _IdDto): Promise<_IdDto> {
    return await this.sitesService.getDocumentByDocsId(req, params);
  }

  @ApiOperation({ summary: 'Save Lat Long' })
  @ApiBody({ type: SaveLocationDto })
  @Patch('/save-location')
  async saveLocation(@Req() req: Request, @Body() params: SaveLocationDto): Promise<SaveLocationDto> {
    return this.sitesService.saveLocation(req, params);
  }

}