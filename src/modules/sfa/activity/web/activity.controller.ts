import { Body, Controller, Post, Req, Request } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { ActivityService } from './activity.service';
import { AnyalyticsDto, monthReadDto, NdayDto, ReadVisitDto, TodayDataDto, ActivityDocsDto } from './dto/visit-activity.dto';
import { SharedActivityService } from '../shared-activity.service';
@ApiTags('Web-Activity')
@ApiBearerAuth('Authorization')
@Controller('activity')
export class ActivityController {
    constructor(
        private readonly activityService: ActivityService,
        private readonly sharedActivityService: SharedActivityService,
    ) { }

    @Post('/read')
    async read(@Req() req: Request, @Body() params: ReadVisitDto): Promise<ReadVisitDto> {
        return await this.activityService.read(req, params);
    }

    @Post('/today-visit-data')
    async todayVisitData(@Req() req: Request, @Body() params: TodayDataDto): Promise<TodayDataDto> {
        return await this.activityService.todayVisitData(req, params);
    }

    @Post('/anyalytics')
    async getAnyalyticsData(@Req() req: Request, @Body() params: AnyalyticsDto): Promise<AnyalyticsDto> {
        return await this.activityService.getAnyalyticsData(req, params);
    }
    @Post('/n-days-data')
    async getLastNDaysData(@Req() req: Request, @Body() params: NdayDto): Promise<NdayDto> {
        return await this.activityService.getLastNDaysData(req, params);
    }
    @Post('/month-read')
    async monthRead(@Req() req: Request, @Body() params: monthReadDto): Promise<monthReadDto> {
        return await this.activityService.monthRead(req, params);
    }
    @Post('/get-doc')
    async getDocumentById(@Req() req: Request, @Body() params: ActivityDocsDto): Promise<ActivityDocsDto> {
        return await this.sharedActivityService.getDocumentByDocsId(req, params);
    }
}
