import { Body, Controller, Patch, Post, Req, UseInterceptors, UploadedFiles } from '@nestjs/common';
import { GiftGalleryService } from './gift-gallery.service';
import { CreateGiftGalleryDto, DeleteGiftDto, ReadGiftGalleryDto, GiftGalleryDetailDto, UpdateGiftGalleryStatusDto, GiftDocsDto, ReadVoucherDto, CreateVoucherDto, DetailGiftGalleryDto } from './dto/gift-gallery.dto';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiBody } from '@nestjs/swagger';
import { FilesInterceptor } from '@nestjs/platform-express';
import { _IdDto } from 'src/common/dto/common.dto';

@ApiTags('Web-Gift-gallery')
@ApiBearerAuth('Authorization')
@Controller('gift-gallery')
export class GiftGalleryController {
  constructor(
    private readonly giftGalleryService: GiftGalleryService

  ) { }

  @ApiOperation({ summary: 'Created Gift gallery' })
  @ApiBody({ type: CreateGiftGalleryDto })
  @Post('/create')
  async create(@Req() req: Request, @Body() params: CreateGiftGalleryDto): Promise<CreateGiftGalleryDto> {
    return await this.giftGalleryService.create(req, params);
  }

  @ApiOperation({ summary: 'Gift Gallery List data' })
  @ApiBody({ type: ReadGiftGalleryDto })
  @Post('/read')
  async read(@Req() req: Request, @Body() params: ReadGiftGalleryDto): Promise<ReadGiftGalleryDto> {
    return await this.giftGalleryService.read(req, params);
  }

  @ApiOperation({ summary: 'Gift Gallery List data' })
  @ApiBody({ type: DetailGiftGalleryDto })
  @Post('/detail')
  async detail(@Req() req: Request, @Body() params: DetailGiftGalleryDto): Promise<DetailGiftGalleryDto> {
    return await this.giftGalleryService.detail(req, params);
  }


  @ApiOperation({ summary: 'Update Status Gift Galery' })
  @ApiBody({ type: UpdateGiftGalleryStatusDto })
  @Patch('/update-status')
  async updateStatus(@Req() req: Request, @Body() params: UpdateGiftGalleryStatusDto): Promise<UpdateGiftGalleryStatusDto> {
    return await this.giftGalleryService.updateStatus(req, params);
  }


  @ApiOperation({ summary: 'Delete Gift gallery' })
  @ApiBody({ type: DeleteGiftDto })
  @Patch('/delete')
  async delete(@Req() req: Request, @Body() params: DeleteGiftDto): Promise<DeleteGiftDto> {
    return await this.giftGalleryService.delete(req, params);
  }

  @ApiOperation({ summary: 'Upload Multiple Files to Bucket.' })
  @Post('upload')
  @UseInterceptors(FilesInterceptor('files', 5))
  async uploadFiles(
    @UploadedFiles() files: Express.Multer.File[],
    @Req() req: any,
  ) {
    return await this.giftGalleryService.upload(files, req);
  }

  @Post('/get-doc')
  async getDocumentById(@Req() req: Request, @Body() params: _IdDto): Promise<_IdDto> {
    return await this.giftGalleryService.getDocumentByDocsId(req, params);
  }

  @ApiOperation({ summary: 'Read Voucher' })
  @Post('/read-voucher')
  @ApiBody({ type: ReadVoucherDto })
  async readVoucher(@Req() req: Request, @Body() params: ReadVoucherDto): Promise<ReadVoucherDto> {
    return await this.giftGalleryService.readVoucher(req, params);
  }

  @ApiOperation({ summary: 'Voucher Types' })
  @Post('/voucher-types')
  async readVoucherTypes(@Req() req: Request, @Body() params: any): Promise<any> {
    return await this.giftGalleryService.readVoucherTypes(req, params);
  }
}
