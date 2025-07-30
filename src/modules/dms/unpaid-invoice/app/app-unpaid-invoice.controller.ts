import { Controller, Post, Body, Req, UseInterceptors, UploadedFiles, Patch } from '@nestjs/common';
import { AppUnpaidInvoiceService } from './app-unpaid-invoice.service';
import { ReadUnpaidInvoiceDto } from './dto/app-unpaid-invoice.dto';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiResponse, ApiBody } from '@nestjs/swagger';

@ApiTags('App-Invoice')
@ApiBearerAuth('Authorization')
@Controller('app-unpaid-invoice')
export class AppUnpaidInvoiceController {
  constructor(private readonly appUnpaidInvoiceService: AppUnpaidInvoiceService) { }

  @Post('/read')
  @ApiOperation({ summary: 'Read unpaid Invoices' })
  @ApiBody({ type: ReadUnpaidInvoiceDto })
  async read(@Req() req: any, @Body() params: ReadUnpaidInvoiceDto): Promise<ReadUnpaidInvoiceDto> {
    return await this.appUnpaidInvoiceService.read(req, params);
  }
}
