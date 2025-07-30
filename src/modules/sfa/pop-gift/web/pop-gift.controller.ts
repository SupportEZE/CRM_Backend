import { Body, Controller, Post, Req, Patch, UseInterceptors, UploadedFiles } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiBody, ApiOperation } from '@nestjs/swagger';
import { PopGiftService } from './pop-gift.service';
import { CreatePopGiftDto, ReadPopGiftDto, DetailPopGiftDto, CreateManageStockDto, UpdatePopGiftDto, DeletePopGiftDto } from './dto/pop-gift.dto';
import { FilesInterceptor } from '@nestjs/platform-express';
import { _IdDto } from 'src/common/dto/common.dto';

@ApiTags('Web-Pop-Gift')
@ApiBearerAuth('Authorization')
@Controller('pop-gift')
export class PopGiftController {
  constructor(private readonly popgiftService: PopGiftService) { }

  @Post('/create-pop-gift')
  @ApiOperation({ summary: 'Create an Pop and Gift', description: 'Allows users to create a new gift' })
  @ApiBody({ type: CreatePopGiftDto })
  async createPopGift(@Req() req: any, @Body() params: CreatePopGiftDto): Promise<CreatePopGiftDto> {
    return await this.popgiftService.createPopGift(req, params);
  }

  @Post('/read-pop-gift')
  @ApiOperation({ summary: 'Fetch pop gift', description: 'Retrieves pop gift list.' })
  @ApiBody({ type: ReadPopGiftDto })
  async readPopGift(@Req() req: any, @Body() params: ReadPopGiftDto): Promise<ReadPopGiftDto> {
    return await this.popgiftService.readPopGift(req, params);
  }

  @Post('/create-manage-stock')
  @ApiOperation({ summary: 'Manage an Stock', description: 'Allows users to manage stock' })
  @ApiBody({ type: CreateManageStockDto })
  async createManageStock(@Req() req: any, @Body() params: CreateManageStockDto): Promise<CreateManageStockDto> {
    return await this.popgiftService.createManageStock(req, params);
  }

  @Post('/detail-pop-gift')
  @ApiOperation({ summary: 'Detail stock audit data' })
  @ApiBody({ type: DetailPopGiftDto })
  async detailPopGift(@Req() req: any, @Body() params: DetailPopGiftDto): Promise<DetailPopGiftDto> {
    return await this.popgiftService.detailPopGift(req, params);
  }

  @ApiOperation({ summary: 'Update Pop Gift' })
  @ApiBody({ type: UpdatePopGiftDto })
  @Patch('/update-pop-gift')
  async update(@Req() req: any, @Body() params: UpdatePopGiftDto): Promise<any> {
    return await this.popgiftService.updatePopGift(req, params);
  }

  @ApiOperation({ summary: 'Delete Pop gift' })
  @ApiBody({ type: DeletePopGiftDto })
  @Patch('/delete')
  async delete(@Req() req: Request, @Body() params: DeletePopGiftDto): Promise<DeletePopGiftDto> {
    return await this.popgiftService.deletePopGift(req, params);
  }


  @ApiOperation({ summary: 'Upload Multiple Files to Bucket.' })
  @Post('upload')
  @UseInterceptors(FilesInterceptor('files', 5))
  async uploadFiles(
    @UploadedFiles() files: Express.Multer.File[],
    @Req() req: any,
  ) {
    return await this.popgiftService.upload(files, req);
  }

  @Post('/get-doc')
  async getDocumentById(@Req() req: Request, @Body() params: _IdDto): Promise<_IdDto> {
    return await this.popgiftService.getDocumentByDocsId(req, params);
  }

}
