import { Body, Controller, Patch, Post, Req, Request } from '@nestjs/common';
import { BeatPlanService } from './beat-plan.service';
import { CreateBeatPlanDto, ReadBeatPlanDto, ReadBeatAssigningWise, ReadBeatParty, UpdateBeatDto, UnAssignBeatPlanDto, DeleteBeatPlanDto } from './dto/beat-plan.dto';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiBody } from '@nestjs/swagger';
import { SharedUserService } from 'src/modules/master/user/shared-user.service';

@ApiTags('Web-Site')
@ApiBearerAuth('Authorization')
@Controller('beat')
export class BeatPlanController {
  constructor(
    private readonly beatPlanService: BeatPlanService,
    private readonly sharedUserService: SharedUserService,
  ) { }

  @ApiOperation({ summary: 'Create Beat Plan' })
  @ApiBody({ type: CreateBeatPlanDto })
  @Post('/create')
  async create(@Req() req: Request, @Body() params: CreateBeatPlanDto): Promise<CreateBeatPlanDto> {
    return await this.beatPlanService.create(req, params);
  }

  @ApiOperation({ summary: 'Read Beat Plan' })
  @ApiBody({ type: ReadBeatPlanDto })
  @Post('/read')
  async read(@Req() req: Request, @Body() params: ReadBeatPlanDto): Promise<ReadBeatPlanDto> {
    return this.beatPlanService.read(req, params);
  }

  @ApiOperation({ summary: 'UnAssign Beat Plan' })
  @ApiBody({ type: UnAssignBeatPlanDto })
  @Patch('/unassign-beat-plan')
  async unAssignBeatPlan(@Req() req: Request, @Body() params: UnAssignBeatPlanDto): Promise<UnAssignBeatPlanDto> {
    return this.beatPlanService.unAssignBeatPlan(req, params);
  }

  @ApiOperation({ summary: 'Delete Beat Plan' })
  @ApiBody({ type: DeleteBeatPlanDto })
  @Patch('/delete')
  async delete(@Req() req: Request, @Body() params: DeleteBeatPlanDto): Promise<DeleteBeatPlanDto> {
    return this.beatPlanService.delete(req, params);
  }

  @ApiOperation({ summary: 'Read Assigned Beats' })
  @ApiBody({ type: ReadBeatAssigningWise })
  @Post('/read-beat')
  async readBeat(@Req() req: Request, @Body() params: ReadBeatAssigningWise): Promise<ReadBeatAssigningWise> {
    return this.beatPlanService.readBeat(req, params);
  }

  @ApiOperation({ summary: 'Read user' })
  @Post('/read-user')
  async readUser(@Req() req: Request, @Body() params: any): Promise<any> {
    return this.sharedUserService.readUser(req, params);
  }

  @ApiOperation({ summary: 'Read Count' })
  @Post('/read-count')
  async readCounts(@Req() req: Request, @Body() params: any): Promise<any> {
    return this.beatPlanService.readCounts(req, params);
  }

  @Post('/read-party')
  @ApiOperation({ summary: 'Read Party Detail' })
  @ApiBody({ type: ReadBeatParty })
  async readPartyInfo(@Req() req: Request, @Body() params: ReadBeatParty): Promise<ReadBeatParty> {
    return this.beatPlanService.readPartyInfo(req, params);
  }

  @Post('/read-graph')
  async readGraph(@Req() req: Request, @Body() params: any): Promise<any> {
    return this.beatPlanService.readGraph(req, params);
  }

  @Post('/read-previous-beat')
  async readLastTenDaysBeat(@Req() req: Request, @Body() params: any): Promise<any> {
    return this.beatPlanService.readLastTenDaysBeat(req, params);
  }

  @Post('/update-beat-target')
  @ApiOperation({ summary: 'Update Beat Target' })
  @ApiBody({ type: UpdateBeatDto })
  async addBeatTarget(@Req() req: Request, @Body() params: UpdateBeatDto): Promise<UpdateBeatDto> {
    return this.beatPlanService.addBeatTarget(req, params);
  }
}