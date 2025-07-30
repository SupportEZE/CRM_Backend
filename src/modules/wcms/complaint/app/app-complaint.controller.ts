import { Body, Controller, forwardRef, Inject, Patch, Post, Req, UploadedFiles, UseInterceptors } from '@nestjs/common';
import { ApiBearerAuth, ApiTags, ApiOperation, ApiBody, } from '@nestjs/swagger';
import { AppComplaintService } from './app-complaint.service';
import { CustomerTypeService } from 'src/modules/master/customer-type/web/customer-type.service';
import { SharedCustomerService } from 'src/modules/master/customer/shared-customer.service';
import { AppActivityService } from 'src/modules/sfa/activity/app/app-activity.service';
import { ReadComplaintDto, StartVisitDto, EndVisitDto,UpdateComplaintDto,GetExistComplaintDto, RescheduleDateDto, UpdateStatusDto, CreateInspectionDto, CreateComplaintSpareDto } from './dto/app-complaint.dto';
import { ComplaintService } from '../web/complaint.service';
import { _IdDto } from 'src/common/dto/common.dto';
import { FilesInterceptor } from '@nestjs/platform-express';

@ApiTags('App-Complaint')
@ApiBearerAuth('Authorization')
@Controller('app-complaint')
export class AppComplaintController {
  constructor(
    private readonly appComplaintService: AppComplaintService,
    private readonly customerTypeService: CustomerTypeService,
    private readonly complaintService: ComplaintService,
    @Inject(forwardRef(() => SharedCustomerService))
    private readonly sharedCustomerService: SharedCustomerService,
    private readonly appActivityService: AppActivityService,
  ) {}

  @Post('/read')
  @ApiOperation({ summary: 'Read Complaint' })
  @ApiBody({ type: ReadComplaintDto })
  async read(
    @Req() req: any,
    @Body() params: ReadComplaintDto,
  ): Promise<ReadComplaintDto> {
    return await this.appComplaintService.read(req, params);
  }

  @Post('/detail')
  @ApiOperation({ summary: 'Detail Complaint' })
  @ApiBody({ type: _IdDto })
  async detail(@Req() req: any, @Body() params: _IdDto): Promise<_IdDto> {
    return await this.complaintService.complaintDetail(req, params);
  }

  @ApiOperation({ summary: 'Visit Start.' })
  @ApiBody({ type: StartVisitDto })
  @Post('/visit-start')
  async visitStart(
    @Req() req: any,
    @Body() params: StartVisitDto,
  ): Promise<StartVisitDto> {
    return await this.appComplaintService.visitStart(req, params);
  }

  @ApiOperation({ summary: 'Visit End.' })
  @ApiBody({ type: EndVisitDto })
  @Post('/visit-end')
  async visitEnd(
    @Req() req: any,
    @Body() params: EndVisitDto,
  ): Promise<EndVisitDto> {
    return await this.appComplaintService.visitEnd(req, params);
  }

  @Patch('/reschedule-date')
  @ApiOperation({ summary: 'Update Reschedule date' })
  @ApiBody({ type: RescheduleDateDto })
  async status(
    @Req() req: any,
    @Body() params: RescheduleDateDto,
  ): Promise<RescheduleDateDto> {
    return await this.appComplaintService.rescheduleVisitDate(req, params);
  }

  @Patch('/update-status')
  @ApiOperation({ summary: 'Update Status' })
  @ApiBody({ type: UpdateStatusDto })
  async updateStatus(
    @Req() req: any,
    @Body() params: UpdateStatusDto,
  ): Promise<UpdateStatusDto> {
    return await this.appComplaintService.updateStatus(req, params);
  }

  @Post('/inspection')
  @ApiOperation({ summary: 'Create Inspection' })
  @ApiBody({ type: CreateInspectionDto })
  async inspectionCreate(
    @Req() req: any,
    @Body() params: CreateInspectionDto,
  ): Promise<CreateInspectionDto> {
    return await this.appComplaintService.inspectionCreate(req, params);
  }

  @Post('/add-spare')
  @ApiOperation({ summary: 'Add Complaint Spare ' })
  @ApiBody({ type: CreateComplaintSpareDto })
  async addComplaintSpares(
    @Req() req: any,
    @Body() params: CreateComplaintSpareDto,
  ): Promise<CreateComplaintSpareDto> {
    return await this.appComplaintService.addComplaintSpares(req, params);
  }

  @ApiOperation({ summary: 'Upload Multiple Files to Bucket.' })
  @Post('upload')
  @UseInterceptors(FilesInterceptor('files', 5))
  async uploadFiles(
    @UploadedFiles() files: Express.Multer.File[],
    @Req() req: Request,
  ) {
    return await this.complaintService.upload(files, req);
  }

  @Post('/get-doc')
  async getDocumentById(
    @Req() req: Request,
    @Body() params: _IdDto,
  ): Promise<_IdDto> {
    return await this.complaintService.getDocumentByDocsId(req, params);
  }

  @Post('check-exist-complain')
  async getLatestComplaint(@Req() req, @Body() body: GetExistComplaintDto) {
    return this.complaintService.checkExistMobile(req, body.customer_mobile);
  }

  @Patch('/update-complaint')
  @ApiOperation({
    summary: 'Update Complaint',
    description: 'Update Complaint',
  })
  @ApiBody({ type: UpdateComplaintDto })
  async updateComplaint(
    @Req() req: any,
    @Body() params: UpdateComplaintDto,
  ): Promise<UpdateComplaintDto> {
    return await this.complaintService.updateComplaint(req, params);
  }
}

