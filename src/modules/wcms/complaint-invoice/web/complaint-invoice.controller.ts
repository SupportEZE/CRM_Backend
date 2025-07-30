import { Body, Controller, Patch, Post, Req } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiBody } from '@nestjs/swagger';
import { ComplaintInvoiceService } from './complaint-invoice.service';
import { CreateComplaintInvoiceDto, ReadComplaintInvoiceDto } from './dto/complaint-invoice.dto';
import { _IdDto } from 'src/common/dto/common.dto';
@ApiTags('Web-Complaint-Invoice')
@ApiBearerAuth('Authorization')
@Controller('complaint-invoice')
export class ComplaintInvoiceController {
  constructor(
    private readonly complaintInvoiceService: ComplaintInvoiceService
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