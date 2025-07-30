import { Body, Controller, Patch, Post, Req, UploadedFiles, UseInterceptors } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiBody } from '@nestjs/swagger';
import { InvoiceService } from './invoice.service';
import { CreateInvoiceDto, ReadInvoiceDto, DetailInvoiceDto, InvoiceStatusDto } from './dto/invoice.dto';
import { FilesInterceptor } from '@nestjs/platform-express';
import { _IdDto } from 'src/common/dto/common.dto';

@ApiTags('Invoice')
@ApiBearerAuth('Authorization')
@Controller('invoice')
export class InvoiceController {
  constructor(private readonly invoiceService: InvoiceService) { }

  @Post('/create')
  @ApiOperation({ summary: 'Create Invoice for a customer' })
  @ApiBody({ type: CreateInvoiceDto })
  async create(@Req() req: any, @Body() params: CreateInvoiceDto): Promise<CreateInvoiceDto> {
    return await this.invoiceService.create(req, params);
  }

  @Post('/read')
  @ApiOperation({ summary: 'Read Invoice data' })
  @ApiBody({ type: ReadInvoiceDto })
  async read(@Req() req: any, @Body() params: ReadInvoiceDto): Promise<ReadInvoiceDto> {
    return await this.invoiceService.read(req, params);
  }

  @Post('/read-graph')
  @ApiOperation({ summary: 'Invoice vs payment graph data' })
  async readGraph(@Req() req: any, @Body() params: any): Promise<any> {
    return await this.invoiceService.readGraph(req, params);
  }

  @Post('/detail')
  @ApiOperation({ summary: 'Detail Invoice data' })
  @ApiBody({ type: DetailInvoiceDto })
  async detail(@Req() req: any, @Body() params: DetailInvoiceDto): Promise<DetailInvoiceDto> {
    return await this.invoiceService.detail(req, params);
  }

  @Patch('/status')
  @ApiOperation({ summary: 'Update Invoice data' })
  @ApiBody({ type: InvoiceStatusDto })
  async status(@Req() req: any, @Body() params: InvoiceStatusDto): Promise<InvoiceStatusDto> {
    return await this.invoiceService.status(req, params);
  }

  @ApiOperation({ summary: 'Upload Multiple Files to Bucket.' })
  @Post('upload')
  @UseInterceptors(FilesInterceptor('files', 5))
  async uploadFiles(
    @UploadedFiles() files: Express.Multer.File[],
    @Req() req: any,
  ) {
    return await this.invoiceService.upload(files, req);
  }

  @Post('/get-doc')
  async getDocumentById(@Req() req: Request, @Body() params: _IdDto): Promise<_IdDto> {
    return await this.invoiceService.getDocumentByDocsId(req, params);
  }
}
