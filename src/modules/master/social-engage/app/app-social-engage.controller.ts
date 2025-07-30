import { Body, Controller, Post, Req, Request, Patch, UseInterceptors, UploadedFiles } from '@nestjs/common';
import { AppSocialEngageCustomerService } from './app-social-engage.service';
import { CreateRequestDto } from './dto/app-social-engage.dto';
import { ApiBearerAuth, ApiTags, ApiBody, ApiOperation } from '@nestjs/swagger';
import { FilesInterceptor } from '@nestjs/platform-express';

@ApiTags('app-social-engage')
@ApiBearerAuth('Authorization')
@Controller('app-social')
export class AppSocialEngagementController {
    constructor(private readonly appSocialEngageCustomerService: AppSocialEngageCustomerService) { }

    @ApiOperation({ summary: 'Create Request social.' })
    @ApiBody({ type: CreateRequestDto })
    @Post('/create')
    async create(@Req() req: Request, @Body() params: CreateRequestDto): Promise<CreateRequestDto> {
        return await this.appSocialEngageCustomerService.create(req, params);
    }


    @ApiOperation({ summary: 'Read Social.' })
    @Post('/read')
    async read(@Req() req: any, @Body() params: any): Promise<any> {
        return await this.appSocialEngageCustomerService.read(req, params);
    }


    @ApiOperation({ summary: 'Upload Multiple Files to Bucket.' })
    @Post('upload')
    @UseInterceptors(FilesInterceptor('files', 5))
    async uploadFiles(
        @UploadedFiles() files: Express.Multer.File[],
        @Req() req: any,
    ) {
        return await this.appSocialEngageCustomerService.upload(files, req);
    }
}
