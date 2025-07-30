import { Body, Controller, Post, Req, UseInterceptors, UploadedFiles, Patch } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiBody } from '@nestjs/swagger';
import { BrandAuditService } from './brand-audit.service';
import { CreateBrandRequestDto, ReadBrandRequestDto, DetailBrandRequestDto, StatusDto, BrandDocsDto } from './dto/brand-request.dto';
import { CreateBrandAuditDto, ReadBrandAuditDto, DetailBrandAuditDto } from './dto/brand-audit.dto';
import { FilesInterceptor } from '@nestjs/platform-express';
import { _IdDto } from 'src/common/dto/common.dto';

@ApiTags('Web-BrandAudit')
@ApiBearerAuth('Authorization')
@Controller('brand-audit')
export class BrandAuditController {
    constructor(
        private readonly brandAuditService: BrandAuditService
    ) { }
    
    @Post('/create')
    @ApiOperation({ summary: 'Create an Branding Request', description: 'Allows users to create a brand request' })
    @ApiBody({ type: CreateBrandRequestDto })
    async create(@Req() req: any, @Body() params: CreateBrandRequestDto): Promise<CreateBrandRequestDto> {
        return await this.brandAuditService.createBrandRequest(req, params);
    }
    
    @Post('/read')
    @ApiOperation({ summary: 'Read payment data' })
    @ApiBody({ type: ReadBrandRequestDto })
    async read(@Req() req: any, @Body() params: ReadBrandRequestDto): Promise<ReadBrandRequestDto> {
        return await this.brandAuditService.readBrandRequest(req, params);
    }
    
    @Post('/detail')
    @ApiOperation({ summary: 'Detail payment data' })
    @ApiBody({ type: DetailBrandRequestDto })
    async detail(@Req() req: any, @Body() params: DetailBrandRequestDto): Promise<DetailBrandRequestDto> {
        return await this.brandAuditService.detailBrandRequest(req, params);
    }
    
    @Post('/create-brand-audit')
    @ApiOperation({ summary: 'Create an Branding Audit', description: 'Allows users to create a audit request' })
    @ApiBody({ type: CreateBrandAuditDto })
    async createBrandAudit(@Req() req: any, @Body() params: CreateBrandAuditDto): Promise<CreateBrandAuditDto> {
        return await this.brandAuditService.createBrandAudit(req, params);
    }
    
    @Post('/read-brand-audit')
    async readBrandAudit(@Req() req: any, @Body() params: ReadBrandAuditDto): Promise<ReadBrandAuditDto> {
        return await this.brandAuditService.readBrandAudit(req, params);
    }
    
    @Post('/detail-brand-audit')
    @ApiOperation({ summary: 'Detail Brand Audit data' })
    @ApiBody({ type: DetailBrandAuditDto })
    async detailBrandAudit(@Req() req: any, @Body() params: DetailBrandAuditDto): Promise<DetailBrandAuditDto> {
        return await this.brandAuditService.detailBrandAudit(req, params);
    }
    
    @Patch('/status')
    @ApiBody({ type: StatusDto })
    async status(@Req() req: any, @Body() params: StatusDto): Promise<StatusDto> {
        return await this.brandAuditService.status(req, params);
    }
    
    @ApiOperation({ summary: 'Upload Multiple Files to Bucket.' })
    @Post('upload')
    @UseInterceptors(FilesInterceptor('files', 5))
    async uploadFiles(
        @UploadedFiles() files: Express.Multer.File[],
        @Req() req: any,
    ) {
        return await this.brandAuditService.upload(files, req);
    }
    
    @Post('/get-doc')
    async getDocumentById(@Req() req: Request, @Body() params: BrandDocsDto): Promise<BrandDocsDto> {
        return await this.brandAuditService.getDocumentByDocsId(req, params);
    }
    
    @Patch('/delete-file')
    async deleteFile(@Req() req: Request, @Body() params: _IdDto): Promise<_IdDto> {
        return await this.brandAuditService.deleteFile(req, params);
    }
}
