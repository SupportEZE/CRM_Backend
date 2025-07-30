import { Body, Controller, Patch, Post, Req, Request } from '@nestjs/common';
import { ApiBearerAuth, ApiBody, ApiOperation, ApiTags } from '@nestjs/swagger';
import { AppComplaintInvoiceService } from './app-complaint-invoice.service';
import { CreateComplaintInvoiceDto, ReadComplaintInvoiceDto } from '../web/dto/complaint-invoice.dto';
import { ComplaintInvoiceService } from '../web/complaint-invoice.service';
import { _IdDto } from 'src/common/dto/common.dto';
@ApiTags('App-Complaint-Invoice')
@ApiBearerAuth('Authorization')
@Controller('app-complaint-invoice')
export class AppComplaintInvoiceController {
  constructor(
    private readonly appComplaintInvoiceService: AppComplaintInvoiceService,
    private readonly complaintInvoiceService: ComplaintInvoiceService,

  ) { }
  @ApiOperation({ summary: 'Create Complaint Invoice' })
  @ApiBody({ type: CreateComplaintInvoiceDto })
  @Post('/create')
  async create(@Req() req: Request, @Body() params: CreateComplaintInvoiceDto): Promise<CreateComplaintInvoiceDto> {
    return await this.complaintInvoiceService.create(req, params);
  }

  @ApiOperation({ summary: 'Read Complaint Invoice' })
  @ApiBody({ type: ReadComplaintInvoiceDto })
  @Post('/read')
  async read(@Req() req: Request, @Body() params: ReadComplaintInvoiceDto): Promise<ReadComplaintInvoiceDto> {
    return await this.complaintInvoiceService.read(req, params);
  }

  @ApiOperation({ summary: 'Detail Complaint Invoice' })
  @ApiBody({ type: _IdDto })
  @Post('/detail')
  async detail(@Req() req: Request, @Body() params: _IdDto): Promise<_IdDto> {
    return await this.complaintInvoiceService.detail(req, params);
  }
}