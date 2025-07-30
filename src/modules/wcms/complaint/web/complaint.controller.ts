import {
  Body,
  Controller,
  Post,
  Req,
  Patch,
  UseInterceptors,
  UploadedFiles,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiBody, ApiOperation } from '@nestjs/swagger';
import { ComplaintService } from './complaint.service';
import { AppComplaintService } from '../app/app-complaint.service';
import { CommentService } from '../../../sfa/comment/web/comment.service';
import {
  CreateComplaintDto,
  ReadComplaintDto,
  AssignEngineerDto,
  GetExistComplaintDto,
  UpdateComplaintDto,
  ComplaintStatusUpdateDto,
  LocatioDto,
  RescheduleDateDto,
  SaveCommentDto,
  ReadCommentsDto,
  CreateInspectionDto,
  CustomerComplaintSummaryDto,
  ComplaintCustomerDetailDTO
} from './dto/complaint.dto';
import { FilesInterceptor } from '@nestjs/platform-express';
import { _IdDto } from 'src/common/dto/common.dto';
@ApiTags('Web-Complaint')
@ApiBearerAuth('Authorization')
@Controller('complaint')
export class ComplaintController {
  constructor(
    private readonly complaintService: ComplaintService,
    private readonly appComplaintService: AppComplaintService,
    private readonly CommentService: CommentService,
  ) {}

  @Post('/create')
  @ApiOperation({
    summary: 'Create Complaint',
    description: 'Allows users to create a complaint',
  })
  @ApiBody({ type: CreateComplaintDto })
  async complaintCreate(
    @Req() req: any,
    @Body() params: CreateComplaintDto,
  ): Promise<CreateComplaintDto> {
    return await this.complaintService.complaintCreate(req, params);
  }

  @Post('/read')
  @ApiOperation({
    summary: 'Fetch complaint data',
    description: 'Fetch complaint data',
  })
  @ApiBody({ type: ReadComplaintDto })
  async complaintRead(
    @Req() req: any,
    @Body() params: ReadComplaintDto,
  ): Promise<ReadComplaintDto> {
    return await this.complaintService.complaintRead(req, params);
  }

  @Post('/detail')
  @ApiOperation({ summary: 'Complaint Detail' })
  @ApiBody({ type: _IdDto })
  async detail(@Req() req: any, @Body() params: _IdDto): Promise<_IdDto> {
    return await this.complaintService.complaintDetail(req, params);
  }
xx
  @Patch('/reschedule-date')
  @ApiOperation({ summary: 'Update Reschedule date' })
  @ApiBody({ type: RescheduleDateDto })
  async status(
    @Req() req: any,
    @Body() params: RescheduleDateDto,
  ): Promise<RescheduleDateDto> {
    return await this.complaintService.rescheduleVisitDate(req, params);
  }

  @Patch('/assign-engineer')
  @ApiOperation({ summary: 'Assign Engineer', description: 'Assign engineer' })
  @ApiBody({ type: AssignEngineerDto })
  async assignEngineer(
    @Req() req: any,
    @Body() params: AssignEngineerDto,
  ): Promise<AssignEngineerDto> {
    return await this.complaintService.assignEngineer(req, params);
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

  @Patch('/status-update')
  @ApiOperation({
    summary: 'Update Complaint',
    description: 'Update Complaint',
  })
  @ApiBody({ type: ComplaintStatusUpdateDto })
  async statusUpdate(
    @Req() req: any,
    @Body() params: ComplaintStatusUpdateDto,
  ): Promise<ComplaintStatusUpdateDto> {
    return await this.complaintService.statusUpdate(req, params);
  }

  @ApiOperation({ summary: 'Save Lat Long' })
  @ApiBody({ type: LocatioDto })
  @Patch('/save-location')
  async saveLocation(
    @Req() req: Request,
    @Body() params: LocatioDto,
  ): Promise<LocatioDto> {
    return this.complaintService.saveLocation(req, params);
  }

  @ApiOperation({ summary: 'Upload Multiple Files to Bucket.' })
  @Post('upload')
  @UseInterceptors(FilesInterceptor('files', 5))
  async uploadFiles(
    @UploadedFiles() files: Express.Multer.File[],
    @Req() req: any,
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
  @ApiBody({ type: SaveCommentDto })
  @Post('/save-comment')
  async saveComment(
    @Req() req: any,
    @Body() params: SaveCommentDto,
  ): Promise<SaveCommentDto> {
    return this.CommentService.saveComment(req, params);
  }
  @Post('/read-comment')
  async readComments(
    @Req() req: Request,
    @Body() params: ReadCommentsDto,
  ): Promise<ReadCommentsDto> {
    return this.CommentService.readComments(req, params);
  }

  @Post('/inspection')
  @ApiOperation({ summary: 'Create Inspection' })
  @ApiBody({ type: CreateInspectionDto })
  async inspectionCreate(
    @Req() req: any,
    @Body() params: CreateInspectionDto,
  ): Promise<CreateInspectionDto> {
    return await this.complaintService.inspectionCreate(req, params);
  }

  @Post('/customer-complaint-summary')
  async complaintLatestByMobileNo(
    @Body() params: CustomerComplaintSummaryDto, 
    @Req() req: any) {
    return this.complaintService.getCustomerComplaintSummary(req, params);
  }

  @Post('customer-detail')
async getCustomerDetailFromComplaint(
  @Req() req: Request,
  @Body() params: ComplaintCustomerDetailDTO,
): Promise<any> {
  return this.complaintService.getCustomerDetailsFromComplaint(req, params);
}
}
