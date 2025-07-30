import { Controller, Post, Body, Req } from '@nestjs/common';
import { AppGiftGalleryService } from './app-giftgallery.service';
import { GiftGalleryService } from '../web/gift-gallery.service';
import { ApiBearerAuth, ApiTags, ApiBody, ApiOperation } from '@nestjs/swagger';
import { ReadGiftDto, CreateGiftGalleryLikeDto, GiftDetailDto } from './dto/app-gift-gallery.dto';
import { _IdDto } from 'src/common/dto/common.dto';

@ApiTags('App-Gift-Gallery')
@ApiBearerAuth('Authorization')
@Controller('app-gift-gallery')
export class AppGiftGalleryController {
  constructor(
    private readonly appgiftgalleryService: AppGiftGalleryService,
    private readonly giftgalleryService: GiftGalleryService
  ) { }

  @ApiOperation({ summary: 'Gift Gallery List Data' })
  @ApiBody({ type: ReadGiftDto })
  @Post('/read')
  async read(@Req() req: any, @Body() params: ReadGiftDto): Promise<ReadGiftDto> {
    return await this.appgiftgalleryService.read(req, params);
  }

  @ApiOperation({ summary: 'Gift Detail Data' })
  @ApiBody({ type: CreateGiftGalleryLikeDto })
  @Post('/detail')
  async detail(@Req() req: any, @Body() params: GiftDetailDto): Promise<GiftDetailDto> {
    return await this.appgiftgalleryService.detail(req, params);
  }

  @ApiOperation({ summary: 'Save Gift Gallery Likes Data' })
  @ApiBody({ type: CreateGiftGalleryLikeDto })
  @Post('/save-gift-likes')
  async saveGiftLikes(@Req() req: any, @Body() params: CreateGiftGalleryLikeDto): Promise<CreateGiftGalleryLikeDto> {
    return await this.appgiftgalleryService.saveGiftLikes(req, params);
  }

  @Post('/get-doc')
  async getDocumentById(@Req() req: Request, @Body() params: _IdDto): Promise<_IdDto> {
    return await this.giftgalleryService.getDocumentByDocsId(req, params);
  }
}
