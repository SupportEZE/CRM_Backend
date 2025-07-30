import { Controller, Post, Body, Req, UseInterceptors, UploadedFiles, Patch } from '@nestjs/common';
import { AppPaymentService } from './app-payment.service';
import { AppCreatePaymentDto, AppReadPaymentDto, AppDetailPaymentDto, DeletePaymentDto, AppUpdatePaymentDto, AppPaymentDocsDto } from '../app/dto/app-payment.dto';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiBody } from '@nestjs/swagger';
import { FilesInterceptor } from '@nestjs/platform-express';

@ApiTags('App-Payment')
@ApiBearerAuth('Authorization')
@Controller('app-payment')
export class AppPaymentController {
  constructor(private readonly apppaymentService: AppPaymentService) { }

  @Post('/create')
  @ApiOperation({ summary: 'Create a payment collection entry for a customer' })
  @ApiBody({ type: AppCreatePaymentDto })
  async create(@Req() req: any, @Body() params: AppCreatePaymentDto): Promise<AppCreatePaymentDto> {
    return await this.apppaymentService.create(req, params);
  }

  @Post('/read')
  @ApiOperation({ summary: 'Read payment collection data with filters and pagination' })
  @ApiBody({ type: AppReadPaymentDto })
  async read(@Req() req: any, @Body() params: AppReadPaymentDto): Promise<AppReadPaymentDto> {
    return await this.apppaymentService.read(req, params);
  }

  @ApiOperation({ summary: 'Get payment details', description: 'Retrieve details of a specific payment by ID.' })
  @ApiBody({ type: AppDetailPaymentDto })
  @Post('/detail')
  async detail(@Req() req: Request, @Body() params: AppDetailPaymentDto): Promise<AppDetailPaymentDto> {
    return await this.apppaymentService.detail(req, params);
  }

  @ApiOperation({ summary: 'Update Payment' })
  @ApiBody({ type: AppUpdatePaymentDto })
  @Patch('/update')
  async update(@Req() req: any, @Body() params: AppUpdatePaymentDto): Promise<any> {
    return await this.apppaymentService.update(req, params);
  }

  @ApiOperation({ summary: 'Delete Payment ' })
  @ApiBody({ type: DeletePaymentDto })
  @Patch('/delete')
  async delete(@Req() req: Request, @Body() params: DeletePaymentDto): Promise<DeletePaymentDto> {
    return await this.apppaymentService.delete(req, params);
  }


  @ApiOperation({ summary: 'Upload Multiple Files to Bucket.' })
  @Post('upload')
  @UseInterceptors(FilesInterceptor('files', 5))
  async uploadFiles(
    @UploadedFiles() files: Express.Multer.File[],
    @Req() req: any,
  ) {
    return await this.apppaymentService.upload(files, req);
  }

  @Post('/get-doc')
  async getDocumentById(@Req() req: Request, @Body() params: AppPaymentDocsDto): Promise<AppPaymentDocsDto> {
    return await this.apppaymentService.getDocumentByDocsId(req, params);
  }
}
