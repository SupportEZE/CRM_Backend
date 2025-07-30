import { Body, Controller, Patch, Post, Req, Request } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { AttendanceService } from './attendance.service';
import { ReadAttendanceDto, DetailAttendanceDto, ResetDto, PunchInDto, AbsentDto, AttendanceDocsDto, SingleMonthReadDto, commonDto, MapViewDto, UpdateAttendanceDto } from './dto/attendance.dto';


export const enum AttendanceRoutes {
  SINGLE_MONTH_READ = 'single-month-read',
}

@ApiTags('Web-Attendance')
@ApiBearerAuth('Authorization')
@Controller('attendance')
export class AttendanceController {
  constructor(
    private readonly attendanceService: AttendanceService
  ) { }

  @Patch('/update')
  async update(@Req() req: Request, @Body() params: UpdateAttendanceDto): Promise<UpdateAttendanceDto> {
    return await this.attendanceService.update(req, params);
  }
  @Post('/read')
  async read(@Req() req: Request, @Body() params: ReadAttendanceDto): Promise<ReadAttendanceDto> {
    return await this.attendanceService.read(req, params);
  }

  @Post('/month-read')
  async monthRead(@Req() req: Request, @Body() params: ReadAttendanceDto): Promise<ReadAttendanceDto> {
    return await this.attendanceService.monthRead(req, params);
  }

  @Post('/detail')
  async detail(@Req() req: Request, @Body() params: DetailAttendanceDto): Promise<DetailAttendanceDto> {
    return await this.attendanceService.detail(req, params);
  }
  @Post('/reset')
  async reset(@Req() req: Request, @Body() params: ResetDto): Promise<ResetDto> {
    return await this.attendanceService.reset(req, params);
  }
  @Post('/punch-in')
  async punchIn(@Req() req: Request, @Body() params: PunchInDto): Promise<PunchInDto> {
    return await this.attendanceService.punchIn(req, params);
  }

  @Post('/absent')
  async absent(@Req() req: Request, @Body() params: AbsentDto): Promise<AbsentDto> {
    return await this.attendanceService.absent(req, params);
  }

  @Post('/get-doc')
  async getDocumentById(@Req() req: Request, @Body() params: AttendanceDocsDto): Promise<AttendanceDocsDto> {
    return await this.attendanceService.getDocumentByDocsId(req, params);
  }

  @Post('/get-route')
  async getRoute(@Req() req: Request, @Body() params: commonDto): Promise<commonDto> {
    return await this.attendanceService.getRoute(req, params);
  }

  @Post('/battery-graph')
  async batteryGraph(@Req() req: Request, @Body() params: commonDto): Promise<commonDto> {
    return await this.attendanceService.batteryGraph(req, params);
  }
  @Post('/single-month-read')
  async singleUserMonthData(@Req() req: Request, @Body() params: SingleMonthReadDto): Promise<SingleMonthReadDto> {
    return await this.attendanceService.singleUserMonthData(req, params);
  }
  @Post('/timeline')
  async timeline(@Req() req: Request, @Body() params: commonDto): Promise<commonDto> {
    return await this.attendanceService.timeline(req, params);
  }
  @Post('/timeline-csv')
  async timelineCsv(@Req() req: Request, @Body() params: commonDto): Promise<commonDto> {
    return await this.attendanceService.getRoute(req, params);
  }
  @Post('/locations')
  async locations(@Req() req: Request, @Body() params: commonDto): Promise<commonDto> {
    return await this.attendanceService.timeline(req, params);
  }
  @Post('/route')
  async route(@Req() req: Request, @Body() params: commonDto): Promise<commonDto> {
    return await this.attendanceService.getRoute(req, params);
  }

  @Post('/map-view')
  async userMapView(@Req() req: Request, @Body() params: MapViewDto): Promise<MapViewDto> {
    return await this.attendanceService.userMapView(req, params);
  }



}
