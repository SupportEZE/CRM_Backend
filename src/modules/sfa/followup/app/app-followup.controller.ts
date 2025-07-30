import { Body, Controller, Post, Req } from '@nestjs/common';
import { AppFollowupService } from './app-followup.service';
import { AppCreateFollowupDto, AppUpdateFollowupDto, AppReadFollowupDto, AppDetailFollowupDto, AppStatusUdateFollowupDto, AppDeleteFollowupDto, FollowupAppAssignUserDto, followupForList, assignUserList } from './dto/app-followup.dto';
import { ApiBearerAuth, ApiTags, ApiBody, ApiOperation } from '@nestjs/swagger';

@ApiTags('App-Followup')
@ApiBearerAuth('Authorization')
@Controller('app-followup')
export class AppFollowupController {
  constructor(private readonly appFollowupService: AppFollowupService) { }

  @ApiOperation({ summary: 'Create Followup' })
  @ApiBody({ type: AppCreateFollowupDto })
  @Post('/create')
  async create(@Req() req: any, @Body() params: AppCreateFollowupDto): Promise<AppCreateFollowupDto> {
    return await this.appFollowupService.create(req, params);
  }

  @ApiOperation({ summary: 'Update Followup' })
  @ApiBody({ type: AppUpdateFollowupDto })
  @Post('/update')
  async update(@Req() req: any, @Body() params: AppUpdateFollowupDto): Promise<AppUpdateFollowupDto> {
    return this.appFollowupService.update(req, params);
  }

  @ApiOperation({ summary: 'Read Followup' })
  @ApiBody({ type: AppReadFollowupDto })
  @Post('/read')
  async read(@Req() req: any, @Body() params: AppReadFollowupDto): Promise<AppReadFollowupDto> {
    return this.appFollowupService.read(req, params);
  }

  @ApiOperation({ summary: 'Detail Followup' })
  @ApiBody({ type: AppDetailFollowupDto })
  @Post('/detail')
  async detail(@Req() req: any, @Body() params: AppDetailFollowupDto): Promise<AppDetailFollowupDto> {
    return this.appFollowupService.detail(req, params);
  }

  @ApiOperation({ summary: 'Delete Followup' })
  @ApiBody({ type: AppDeleteFollowupDto })
  @Post('/delete')
  async delete(@Req() req: any, @Body() params: AppDeleteFollowupDto): Promise<AppDeleteFollowupDto> {
    return this.appFollowupService.delete(req, params);
  }

  @ApiOperation({ summary: 'User Assign Followup' })
  @ApiBody({ type: FollowupAppAssignUserDto })
  @Post('/user-assign')
  async userassign(@Req() req: any, @Body() params: FollowupAppAssignUserDto): Promise<FollowupAppAssignUserDto> {
    return this.appFollowupService.userAssign(req, params);
  }

  @ApiOperation({ summary: 'Followup Status Update' })
  @ApiBody({ type: AppStatusUdateFollowupDto })
  @Post('/status-update')
  async statusUpdate(@Req() req: any, @Body() params: AppStatusUdateFollowupDto): Promise<AppStatusUdateFollowupDto> {
    return this.appFollowupService.statusUpdate(req, params);
  }

  @ApiOperation({ summary: 'Followup Status Update' })
  @ApiBody({ type: followupForList })
  @Post('/followup-for-list')
  async followupForList(@Req() req: any, @Body() params: followupForList): Promise<followupForList> {
    return this.appFollowupService.followupForList(req, params);
  }

  @ApiOperation({ summary: 'Followup Status Update' })
  @ApiBody({ type: assignUserList })
  @Post('/assign-user-list')
  async assignUserList(@Req() req: any, @Body() params: any): Promise<any> {
    return this.appFollowupService.assignUserList(req, params);
  }


}