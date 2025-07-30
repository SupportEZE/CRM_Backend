import { Controller, Post, Body, Req, UseInterceptors, UploadedFiles, Patch } from '@nestjs/common';
import { AppInvoiceService } from './app-invoice.service';
import { ReadInvoiceDto, DetailInvoiceDto, InvoiceStatusDto } from './dto/app-invoice.dto';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiBody } from '@nestjs/swagger';
import { FilesInterceptor } from '@nestjs/platform-express';
import { _IdDto } from 'src/common/dto/common.dto';

@ApiTags('App-Invoice')
@ApiBearerAuth('Authorization')
@Controller('app-invoice')
export class AppInvoiceController {
  constructor(private readonly appInvoiceService: AppInvoiceService) { }

  @Post('/read')
  @ApiOperation({ summary: 'Read Invoice data with filters and pagination' })
  @ApiBody({ type: ReadInvoiceDto })
  async read(@Req() req: any,@Body() params: ReadInvoiceDto): Promise<ReadInvoiceDto> {
    return await this.appInvoiceService.read(req, params);
  }

  @ApiOperation({ summary: 'Get Invoice details', description: 'Retrieve details of a specific Invoice by ID.' })
  @ApiBody({ type: DetailInvoiceDto })
  @Post('/detail')
  async detail(@Req() req: Request, @Body() params: DetailInvoiceDto): Promise<DetailInvoiceDto> {
    return await this.appInvoiceService.detail(req, params);
  }

  @Patch('/status')
  @ApiOperation({ summary: 'Update Invoice data' })
  @ApiBody({ type: InvoiceStatusDto })
  async status(@Req() req: any, @Body() params: InvoiceStatusDto): Promise<InvoiceStatusDto> {
    return await this.appInvoiceService.status(req, params);
  }

  @ApiOperation({ summary: 'Upload Multiple Files to Bucket.' })
  @Post('upload')
  @UseInterceptors(FilesInterceptor('files', 5))
  async uploadFiles(
    @UploadedFiles() files: Express.Multer.File[],
    @Req() req: any,
  ) {
    return await this.appInvoiceService.upload(files, req);
  }

  @Post('/get-doc')
  async getDocumentById(@Req() req: Request, @Body() params: _IdDto): Promise<_IdDto> {
    return await this.appInvoiceService.getDocumentByDocsId(req, params);
  }

}
