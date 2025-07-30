import { Body, Controller, Post, Req, UseInterceptors, UploadedFiles } from '@nestjs/common';
import { AppAttendanceService } from './app-attendance.service';
import { AppPunchInDto, PunchOutDto, BackgroundDataSaveDto, TimelineDataFetchDto, DetailDto, UploadDto } from './dto/app-attendance.dto';
import { FilesInterceptor } from '@nestjs/platform-express';
import { ApiBearerAuth, ApiTags, ApiBody, ApiOperation } from '@nestjs/swagger';
import { AttendanceService } from '../web/attendance.service';

@ApiTags('App-Attendance')
@ApiBearerAuth('Authorization')
@Controller('app-attendance')
export class AppAttendanceController {
    constructor(
        private readonly appAttendanceService: AppAttendanceService,
        private readonly attendanceService: AttendanceService,

    ) { }
    @ApiOperation({ summary: 'Employee Punch In' })
    @ApiBody({ type: AppPunchInDto })
    @Post('/punch-in')
    async punchIn(@Req() req: any, @Body() params: AppPunchInDto): Promise<AppPunchInDto> {
        return await this.appAttendanceService.punchIn(req, params);
    }

    @ApiOperation({ summary: 'Employee Punch Out' })
    @ApiBody({ type: PunchOutDto })
    @Post('/punch-out')
    async punchOut(@Req() req: any, @Body() params: PunchOutDto): Promise<PunchOutDto> {
        return await this.appAttendanceService.punchOut(req, params);
    }

    @ApiOperation({ summary: 'save background location data' })
    @ApiBody({ type: BackgroundDataSaveDto })
    @Post('/detail')
    async detail(@Req() req: any, @Body() params: DetailDto): Promise<DetailDto> {
        return await this.appAttendanceService.detail(req, params);
    }

    @ApiOperation({ summary: 'save background location data' })
    @ApiBody({ type: BackgroundDataSaveDto })
    @Post('/create-route')
    async createBackground(@Req() req: any, @Body() params: BackgroundDataSaveDto): Promise<BackgroundDataSaveDto> {
        return await this.appAttendanceService.createBackground(req, params);
    }

    @ApiOperation({ summary: 'fetch background timeline data' })
    @ApiBody({ type: TimelineDataFetchDto })
    @Post('/timeline')
    async timeline(@Req() req: any, @Body() params: TimelineDataFetchDto): Promise<TimelineDataFetchDto> {
        return await this.attendanceService.timeline(req, params);
    }

    @ApiOperation({ summary: 'Upload Multiple Files to Bucket.' })
    @Post('upload')
    @UseInterceptors(FilesInterceptor('files', 5))
    async uploadFiles(
        @UploadedFiles() files: Express.Multer.File[],
        @Req() req: any,
        @Body() params: UploadDto
    ) {
        return await this.attendanceService.upload(files, req, params);
    }
}
