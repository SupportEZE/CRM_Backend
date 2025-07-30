import { Controller, Post, Body, Req, Patch, UseInterceptors, UploadedFiles } from '@nestjs/common';
import { DocumentService } from './document.service';
import { CreateDocumentDto, DeleteDocumentFileDto, UpdateDocumentDto } from './dto/document.dto';
import { FilesInterceptor } from '@nestjs/platform-express';
import { ApiOperation } from '@nestjs/swagger';
import { _IdDto } from 'src/common/dto/common.dto';

@Controller('document')
export class DocumentController {
  constructor(private readonly documentService: DocumentService) { }

  @Post('/create')
  async create(@Req() req: Request, @Body() params: CreateDocumentDto): Promise<any> {
    return await this.documentService.create(req, params);
  }

  @Post('/update')
  async update(@Req() req: Request, @Body() params: UpdateDocumentDto): Promise<any> {
    return await this.documentService.update(req, params);
  }

  @Post('/read')
  async read(@Req() req: Request, @Body() params: any): Promise<any> {
    return await this.documentService.read(req, params);
  }

  @Patch('/delete-file')
  async deleteFile(@Req() req: Request, @Body() params: DeleteDocumentFileDto): Promise<DeleteDocumentFileDto> {
    return await this.documentService.deleteFile(req, params);
  }

  @ApiOperation({ summary: 'Upload Multiple Files to Bucket.' })
  @Post('upload')
  @UseInterceptors(FilesInterceptor('files', 5))
  async uploadFiles(
    @UploadedFiles() files: Express.Multer.File[],
    @Req() req: any,
  ) {
    return await this.documentService.upload(files, req);
  }

  @Post('/get-doc')
  async getDocumentById(@Req() req: Request, @Body() params: _IdDto): Promise<_IdDto> {
    return await this.documentService.getDocumentByDocsId(req, params);
  }

}
