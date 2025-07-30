import { Body, Controller, Post, Req, Patch, Request, UseInterceptors, UploadedFiles } from '@nestjs/common';
import { BannerService } from './banner.service';
import { CreateBannerDto, DeleteBannerFileDto, UpdateBannerDto } from './dto/banner.dto';
import { FilesInterceptor } from '@nestjs/platform-express';
import {  ApiOperation } from '@nestjs/swagger';
import { _IdDto } from 'src/common/dto/common.dto';


@Controller('banner')
export class BannerController {
  constructor(
    private readonly bannerService: BannerService

  ) { }

  @Post('/create')
  async create(@Req() req: any, @Body() params: CreateBannerDto): Promise<any> {
    return await this.bannerService.create(req, params);
  }

  @Post('/update')
  async update(@Req() req: any, @Body() params: UpdateBannerDto): Promise<UpdateBannerDto> {
    return await this.bannerService.update(req, params);
  }

  @Post('/read')
  async read(@Req() req: any, @Body() params: any): Promise<any> {
    return await this.bannerService.read(req, params);
  }

  @Patch('/delete-file')
  async deleteFile(@Req() req: Request, @Body() params: DeleteBannerFileDto): Promise<DeleteBannerFileDto> {
    return await this.bannerService.deleteFile(req, params);
  }

  @ApiOperation({ summary: 'Upload Multiple Files to Bucket.' })
  @Post('upload')
  @UseInterceptors(FilesInterceptor('files', 5))
  async uploadFiles(
    @UploadedFiles() files: Express.Multer.File[],
    @Req() req: any,
  ) {
    return await this.bannerService.upload(files, req);
  }

  @Post('/get-doc')
  async getDocumentById(@Req() req: Request, @Body() params: _IdDto): Promise<_IdDto> {
    return await this.bannerService.getDocumentByDocsId(req, params);
  }

}
