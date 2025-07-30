import { Body, Controller, Post, Req, Request, Patch } from '@nestjs/common';
import { SocialEngageService } from './social-engage.service';
import { CreateDto, ReadPendingRequestDto, RequestStatusDto, UpdateDto, ReadPerformanceDto, SocialDocsDto } from './dto/social-engage.dto';
import { ApiBearerAuth, ApiTags, ApiBody, ApiOperation } from '@nestjs/swagger';
@ApiTags('web-social')
@ApiBearerAuth('Authorization')
@Controller('web-social')
export class SocialEngageController {
    constructor(
        private readonly socialEngageService: SocialEngageService,
    ) { }

    @ApiOperation({ summary: 'default Platform.' })
    @Post('/default-platforms')
    async defaultPlatforms(@Req() req: any, @Body() params: any): Promise<any> {
        return await this.socialEngageService.defaultPlatforms(req, params);
    }

    @ApiOperation({ summary: 'Create Platform.' })
    @ApiBody({ type: CreateDto })
    @Post('/create')
    async create(@Req() req: any, @Body() params: CreateDto): Promise<CreateDto> {
        return await this.socialEngageService.create(req, params);
    }

    @ApiOperation({ summary: 'List social accounts.' })
    @Post('/read')
    async read(@Req() req: any, @Body() params: any): Promise<any> {
        return await this.socialEngageService.read(req, params);
    }

    @ApiOperation({ summary: 'Update Status to approve or reject.' })
    @ApiBody({ type: UpdateDto })
    @Patch('/update')
    async update(@Req() req: any, @Body() params: UpdateDto): Promise<UpdateDto> {
        return await this.socialEngageService.update(req, params);
    }

    @ApiOperation({ summary: 'Update Status to approve or reject.' })
    @ApiBody({ type: RequestStatusDto })
    @Post('/request-status-change')
    async requestStatusChange(@Req() req: any, @Body() params: RequestStatusDto): Promise<RequestStatusDto> {
        return await this.socialEngageService.requestStatusChange(req, params);
    }

    @ApiOperation({ summary: 'list pending request.' })
    @ApiBody({ type: ReadPendingRequestDto })
    @Post('/read-request')
    async pendingRequest(@Req() req: any, @Body() params: ReadPendingRequestDto): Promise<ReadPendingRequestDto> {
        return await this.socialEngageService.pendingRequest(req, params);
    }

    @ApiOperation({ summary: 'list performace of customers.' })
    @ApiBody({ type: ReadPerformanceDto })
    @Post('/read-performance')
    async performace(@Req() req: any, @Body() params: ReadPerformanceDto): Promise<ReadPerformanceDto> {
        return await this.socialEngageService.performace(req, params);
    }

    @Post('/get-doc')
    async getDocumentById(@Req() req: Request, @Body() params: SocialDocsDto): Promise<SocialDocsDto> {
        return await this.socialEngageService.getDocument(params._id);
    }
}
