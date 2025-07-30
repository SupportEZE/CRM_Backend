import { Body, Controller, Post, Req, Patch, UseInterceptors, UploadedFiles } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiBody, ApiOperation } from '@nestjs/swagger';
import { SparePartService } from './spare-part.service';
import { CreateSparePartDto, ReadSparePartDto, DetailSparePartDto, CreateManageStockDto, UpdateSparePartDto, DeleteSparePartDto,ReadDropdownDto } from './dto/spare-part.dto';
import { FilesInterceptor } from '@nestjs/platform-express';
import { _IdDto } from 'src/common/dto/common.dto';
export const enum SparePartRoutes{
  READ='read',
  READ_DROPDOWN='read-dropdown',
  SEND_OTP='send-otp'
}
@ApiTags('Web-Spare-Part')
@ApiBearerAuth('Authorization')
@Controller('spare-part')
export class SparePartController {
  constructor(private readonly sparePartService: SparePartService) { }

  @Post('/create-spare-part')
  @ApiOperation({ summary: 'Create an spare part', description: 'Allows users to create a new spare part' })
  @ApiBody({ type: CreateSparePartDto })
  async create(@Req() req: any, @Body() params: CreateSparePartDto): Promise<CreateSparePartDto> {
    return await this.sparePartService.createSparePart(req, params);
  }

  @Post('/read')
  @ApiOperation({ summary: 'Fetch spare part', description: 'Retrieves spare part list.' })
  @ApiBody({ type: ReadSparePartDto })
  async read(@Req() req: any, @Body() params: ReadSparePartDto): Promise<ReadSparePartDto> {
    return await this.sparePartService.readSparePart(req, params);
  }

  @Post('/detail')
  @ApiOperation({ summary: 'Detail spare part data' })
  @ApiBody({ type: DetailSparePartDto })
  async detailSparePart(@Req() req: any, @Body() params: DetailSparePartDto): Promise<DetailSparePartDto> {
    return await this.sparePartService.detailSparePart(req, params);
  }
  @Post('/read-dropdown')
  @ApiOperation({ summary: 'Read Stock Transfer data' })
  @ApiBody({ type: ReadDropdownDto })
  async readDropdown(@Req() req: any, @Body() params: ReadDropdownDto): Promise<ReadDropdownDto> {
    return await this.sparePartService.readDropdown(req, params);
  }
  @Post('/read-dropdown-stock')
  @ApiOperation({ summary: 'Read dropdown options for spare part' })
  @ApiBody({ type: Object })
  async readDropdownStock(@Req() req: any, @Body() params: any): Promise<any> {
    return await this.sparePartService.webRead(req, params);
  }
  @ApiOperation({ summary: 'Update spare part' })
  @ApiBody({ type: UpdateSparePartDto })
  @Patch('/update-spare-part')
  async update(@Req() req: any, @Body() params: UpdateSparePartDto): Promise<any> {``
    return await this.sparePartService.updateSparePart(req, params);
  }

  @Post('/create-manage-stock')
  @ApiOperation({ summary: 'Manage an Stock', description: 'Allows users to manage stock' })
  @ApiBody({ type: CreateManageStockDto })
  async createManageStock(@Req() req: any, @Body() params: CreateManageStockDto): Promise<CreateManageStockDto> {
    return await this.sparePartService.createManageStock(req, params);
  }

  @ApiOperation({ summary: 'Delete spare part' })
  @ApiBody({ type: DeleteSparePartDto })
  @Patch('/delete')
  async delete(@Req() req: Request, @Body() params: DeleteSparePartDto): Promise<DeleteSparePartDto> {
    return await this.sparePartService.deleteSparePart(req, params);
  }


  @ApiOperation({ summary: 'Upload Multiple Files to Bucket.' })
  @Post('upload')
  @UseInterceptors(FilesInterceptor('files', 5))
  async uploadFiles(
    @UploadedFiles() files: Express.Multer.File[],
    @Req() req: any,
  ) {
    return await this.sparePartService.upload(files, req);
  }

  @Post('/get-doc')
  async getDocumentById(@Req() req: Request, @Body() params: _IdDto): Promise<_IdDto> {
    return await this.sparePartService.getDocumentByDocsId(req, params);
  }

}
