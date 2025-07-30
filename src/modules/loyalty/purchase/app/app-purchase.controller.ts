import { Body, Controller, Post, Req, UploadedFiles, UseInterceptors } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiBody } from '@nestjs/swagger';
import { AppPurchaseService } from './app-purchase.service';
import { CreatePurchaseDto, ReadPurchaseDto } from '../web/dto/purchase.dto';
import { PurchaseService } from '../web/purchase.service';
import { _IdDto } from 'src/common/dto/common.dto';
import { FilesInterceptor } from '@nestjs/platform-express';

@ApiTags('App-Purchase')
@ApiBearerAuth('Authorization')
@Controller('app-purchase')
export class AppPurchaseController {
  constructor(
    private readonly appPurchaseService: AppPurchaseService,
    private readonly purchaseService: PurchaseService
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

