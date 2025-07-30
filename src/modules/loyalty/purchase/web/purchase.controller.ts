import { Body, Controller, Post, Req, Patch, UseInterceptors, UploadedFiles } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiBody } from '@nestjs/swagger';
import { PurchaseService } from './purchase.service';
import { CreatePurchaseDto, ReadPurchaseDto, ReadPurchaseProductDto, StatusUpdateDto } from './dto/purchase.dto';
import { _IdDto } from 'src/common/dto/common.dto';
import { FilesInterceptor } from '@nestjs/platform-express';
import { SharedProductService } from 'src/modules/master/product/shared-product-service';
@ApiTags('Web-Purchase')
@ApiBearerAuth('Authorization')
@Controller('purchase')
export class PurchaseController {
  constructor(
    private readonly purchaseService: PurchaseService,
    private readonly sharedProductService: SharedProductService
  ) { }

  @Post('/create')
  @ApiOperation({ summary: 'Create Purchase Request' })
  @ApiBody({ type: CreatePurchaseDto })
  async create(@Req() req: any, @Body() params: CreatePurchaseDto): Promise<CreatePurchaseDto> {
    return await this.purchaseService.create(req, params);
  }

  @Post('/read')
  @ApiOperation({ summary: 'Read Purchase Request' })
  @ApiBody({ type: ReadPurchaseDto })
  async read(@Req() req: any, @Body() params: ReadPurchaseDto): Promise<ReadPurchaseDto> {
    return await this.purchaseService.read(req, params);
  }

  @Post('/detail')
  @ApiOperation({ summary: 'Detail Purchase Request' })
  @ApiBody({ type: _IdDto })
  async detail(@Req() req: any, @Body() params: _IdDto): Promise<_IdDto> {
    return await this.purchaseService.detail(req, params);
  }

  @Patch('/update-status')
  @ApiOperation({ summary: 'Update Status' })
  @ApiBody({ type: StatusUpdateDto })
  async statusUpdate(@Req() req: any, @Body() params: StatusUpdateDto): Promise<StatusUpdateDto> {
    return await this.purchaseService.statusUpdate(req, params);
  }

  @ApiOperation({ summary: 'Upload Multiple Files to Bucket.' })
  @Post('upload')
  @UseInterceptors(FilesInterceptor('files', 5))
  async uploadFiles(
    @UploadedFiles() files: Express.Multer.File[],
    @Req() req: any,
  ) {
    return await this.purchaseService.upload(files, req);
  }

  @Post('/get-doc')
  async getDocumentById(@Req() req: Request, @Body() params: _IdDto): Promise<_IdDto> {
    return await this.purchaseService.getDocumentByDocsId(req, params);
  }
}
