import { Body, Controller, Patch, Post, Req, UploadedFiles, UseInterceptors } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiBody, ApiResponse } from '@nestjs/swagger';
import { UnpaidInvoiceService } from './unpaid-invoice.service';
import { ReadUnpaidInvoiceDto } from './dto/unpaid-invoice.dto';
import { FilesInterceptor } from '@nestjs/platform-express';

@ApiTags('Invoice')
@ApiBearerAuth('Authorization')
@Controller('unpaid-invoice')
export class UnpaidInvoiceController {
  constructor(private readonly unpaidInvoiceService: UnpaidInvoiceService) { }

  @Post('/read')
  @ApiOperation({ summary: 'Read Unpaid Invoice data' })
  @ApiBody({ type: ReadUnpaidInvoiceDto })
  async read(@Req() req: any, @Body() params: ReadUnpaidInvoiceDto): Promise<ReadUnpaidInvoiceDto> {
    return await this.unpaidInvoiceService.read(req, params);
  }

}
