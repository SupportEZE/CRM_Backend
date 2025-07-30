import { Body, Controller, Patch, Post, Req, UploadedFiles, UseInterceptors } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiBody, ApiResponse } from '@nestjs/swagger';
import { PaymentService } from './payment.service';
import { CreatePaymentDto, ReadPaymentDto, DetailPaymentDto, UpdatePaymentStatusDto, PaymentDocsDto } from './dto/payment.dto';
import { FilesInterceptor } from '@nestjs/platform-express';

@ApiTags('Payment')
@ApiBearerAuth('Authorization')
@Controller('payment')
export class PaymentController {
  constructor(private readonly paymentService: PaymentService) { }

  @Post('/create')
  @ApiOperation({ summary: 'Create payment for a customer' })
  @ApiBody({ type: CreatePaymentDto })
  async create(@Req() req: any, @Body() params: CreatePaymentDto): Promise<CreatePaymentDto> {
    return await this.paymentService.create(req, params);
  }

  @Post('/read')
  @ApiOperation({ summary: 'Read payment data' })
  @ApiBody({ type: ReadPaymentDto })
  async read(@Req() req: any, @Body() params: ReadPaymentDto): Promise<ReadPaymentDto> {
    return await this.paymentService.read(req, params);
  }

  @Post('/detail')
  @ApiOperation({ summary: 'Detail payment data' })
  @ApiBody({ type: DetailPaymentDto })
  async detail(@Req() req: any, @Body() params: DetailPaymentDto): Promise<DetailPaymentDto> {
    return await this.paymentService.detail(req, params);
  }

  @Patch('/update-status')
  @ApiOperation({ summary: 'Update the status of an payment' })
  @ApiBody({ type: UpdatePaymentStatusDto })
  async updateStatus(@Req() req: Request, @Body() params: UpdatePaymentStatusDto): Promise<UpdatePaymentStatusDto> {
    return await this.paymentService.updateStatus(req, params);
  }

  @ApiOperation({ summary: 'Upload Multiple Files to Bucket.' })
  @Post('upload')
  @UseInterceptors(FilesInterceptor('files', 5))
  async uploadFiles(
    @UploadedFiles() files: Express.Multer.File[],
    @Req() req: any,
  ) {
    return await this.paymentService.upload(files, req);
  }

  @Post('/get-doc')
  async getDocumentById(@Req() req: Request, @Body() params: PaymentDocsDto): Promise<PaymentDocsDto> {
    return await this.paymentService.getDocumentByDocsId(req, params);
  }
}
