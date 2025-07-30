import { Body, Controller, Post, Req, UploadedFiles, UseInterceptors } from '@nestjs/common';
import { AppBrandAuditService } from './app-brand-audit.service';
import { CreateBrandAuditDto, ReadBrandAuditDto, DetailBrandAuditDto } from './dto/app-brand-audit.dto';
import { ReadBrandRequestDto, DetailBrandRequestDto, AppBrandDocsDto } from './dto/app-brand-request.dto';
import { ApiBearerAuth, ApiTags, ApiBody, ApiOperation } from '@nestjs/swagger';
import { FilesInterceptor } from '@nestjs/platform-express';
import { CreateBrandRequestDto } from '../web/dto/brand-request.dto';

@ApiTags('App-BrandAudit')
@ApiBearerAuth('Authorization')
@Controller('app-brand-audit')
export class AppBrandAuditController {
    constructor(
        private readonly appBrandAuditService: AppBrandAuditService

    ) { }

    @ApiOperation({ summary: 'Create Brand Request' })
    @ApiBody({ type: CreateBrandRequestDto })
    @Post('/create')
    async create(@Req() req: any, @Body() params: CreateBrandRequestDto): Promise<CreateBrandRequestDto> {
        return await this.appBrandAuditService.createBrandRequest(req, params);
    }
    @Post('/read')
    @ApiOperation({ summary: 'Read Brand Request' })
    @ApiBody({ type: ReadBrandRequestDto })
    async read(@Req() req: any, @Body() params: ReadBrandRequestDto): Promise<ReadBrandRequestDto> {
        return await this.appBrandAuditService.readBrandRequest(req, params);
    }

    @Post('/detail')
    @ApiOperation({ summary: 'Detail Brand Request' })
    @ApiBody({ type: DetailBrandRequestDto })
    async detail(@Req() req: any, @Body() params: DetailBrandRequestDto): Promise<DetailBrandRequestDto> {
        return await this.appBrandAuditService.detailBrandRequest(req, params);
    }


    @ApiOperation({ summary: 'Create Brand Audit' })
    @ApiBody({ type: CreateBrandAuditDto })
    @Post('/create-brand-audit')
    async createBrandAudit(@Req() req: any, @Body() params: CreateBrandAuditDto): Promise<CreateBrandAuditDto> {
        return await this.appBrandAuditService.createBrandAudit(req, params);
    }

    @ApiOperation({ summary: 'Brand Audit List Data' })
    @ApiBody({ type: ReadBrandAuditDto })
    @Post('/read-brand-audit')
    async readBrandAudit(@Req() req: any, @Body() params: ReadBrandAuditDto): Promise<ReadBrandAuditDto> {
        return await this.appBrandAuditService.readBrandAudit(req, params);
    }

    @Post('/detail-brand-audit')
    @ApiOperation({ summary: 'Detail Brand Audit' })
    @ApiBody({ type: DetailBrandAuditDto })
    async detailBrandAudit(@Req() req: any, @Body() params: DetailBrandAuditDto): Promise<DetailBrandAuditDto> {
        return await this.appBrandAuditService.detailBrandAudit(req, params);
    }

    @ApiOperation({ summary: 'Upload Multiple Files to Bucket.' })
    @Post('upload')
    @UseInterceptors(FilesInterceptor('files', 5))
    async uploadFiles(
        @UploadedFiles() files: Express.Multer.File[],
        @Req() req: any,
    ) {
        return await this.appBrandAuditService.upload(files, req);
    }

    @Post('/get-doc')
    async getDocumentById(@Req() req: Request, @Body() params: AppBrandDocsDto): Promise<AppBrandDocsDto> {
        return await this.appBrandAuditService.getDocumentByDocsId(req, params);
    }
}
