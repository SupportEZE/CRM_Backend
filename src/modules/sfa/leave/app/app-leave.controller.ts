import { Body, Controller, Patch, Post, Req, Request, Param, Query, UseInterceptors, UploadedFiles } from '@nestjs/common';
import { AppLeaveService } from './app-leave.service';
import { AppCreateLeaveDto, AppUpdateLeaveStatusDto, AppDetailLeaveDto, AppReadLeaveDto, AppDeleteLeaveDto } from './dto/app-leave.dto';
import { ApiBearerAuth, ApiTags, ApiBody, ApiOperation } from '@nestjs/swagger';
import { FilesInterceptor } from '@nestjs/platform-express';
import { LeaveService } from '../web/leave.service';
import { ReadDocDto } from '../web/dto/leave.dto';

@ApiTags('App-Leave')
@ApiBearerAuth('Authorization')
@Controller('app-leave')
export class AppLeaveController {
    constructor(
        private readonly appLeaveService: AppLeaveService,
        private readonly leaveService: LeaveService,
    ) { }
    
    @ApiOperation({ summary: 'Fetch Leave Types.' })
    @Post('/leave-config')
    async getLeaveTypes(@Req() req: Request, @Body() params: any): Promise<any> {
        return await this.leaveService.getLeaveTypes(req, params);
    }
    
    @ApiOperation({ summary: 'Apply Leave.' })
    @ApiBody({ type: AppCreateLeaveDto })
    @Post('/create')
    async create(@Req() req: Request, @Body() params: AppCreateLeaveDto): Promise<AppCreateLeaveDto> {
        return await this.appLeaveService.create(req, params);
    }
    
    
    @ApiOperation({ summary: 'Leave List of user.' })
    @ApiBody({ type: AppReadLeaveDto })
    @Post('/read')
    async read(@Req() req: Request, @Body() params: AppReadLeaveDto): Promise<AppReadLeaveDto> {
        return await this.appLeaveService.read(req, params);
    }
    
    @ApiOperation({ summary: 'junior pending Leave List of user.' })
    @ApiBody({ type: AppReadLeaveDto })
    @Post('/junior-pending-leaves')
    async juniorPendingLeaves(@Req() req: Request, @Body() params: AppReadLeaveDto): Promise<AppReadLeaveDto> {
        return await this.appLeaveService.juniorPendingLeaveRead(req, params);
    }
    
    @ApiOperation({ summary: 'Fetch details of leave.' })
    @ApiBody({ type: AppDetailLeaveDto })
    @Post('/detail')
    async detail(@Req() req: Request, @Body() params: AppDetailLeaveDto): Promise<AppDetailLeaveDto> {
        return await this.appLeaveService.detail(req, params);
    }
    
    @ApiOperation({ summary: 'Update the status of leave.' })
    @ApiBody({ type: AppUpdateLeaveStatusDto })
    @Post('/update-status')
    async updateStatus(@Req() req: Request, @Body() params: AppUpdateLeaveStatusDto): Promise<AppUpdateLeaveStatusDto> {
        return this.appLeaveService.updateStatus(req, params);
    }
    
    @ApiOperation({ summary: 'Update the status of leave.' })
    @ApiBody({ type: AppDeleteLeaveDto })
    @Patch('/delete')
    async delete(@Req() req: Request, @Body() params: AppDeleteLeaveDto): Promise<AppDeleteLeaveDto> {
        return this.appLeaveService.updateStatus(req, params);
    }
    
    @ApiOperation({ summary: 'Upload Multiple Files to Bucket.' })
    @Post('upload')
    @UseInterceptors(FilesInterceptor('files', 5))
    async uploadFiles(
        @UploadedFiles() files: Express.Multer.File[],
        @Req() req: any,
    ) {
        return await this.appLeaveService.upload(files, req);
    }
    
    @Post('/get-doc')
    async getDocumentById(@Req() req: Request, @Body() params: ReadDocDto): Promise<ReadDocDto> {
        return await this.leaveService.getDocumentByDocsId(req, params);
    }
}