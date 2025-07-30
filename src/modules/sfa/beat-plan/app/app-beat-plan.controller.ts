import { Body, Controller, Post, Req } from '@nestjs/common';
import { AppBeatPlanService } from './app-beat-plan.service';
import { AppBeatPlanListDto } from './dto/app-beat-plan.dto';
import { ApiBearerAuth, ApiTags, ApiBody, ApiOperation } from '@nestjs/swagger';

@ApiTags('App-Beat')
@ApiBearerAuth('Authorization')
@Controller('app-beat')
export class AppBeatPlanController {
  constructor(private readonly appBeatPlanService: AppBeatPlanService) { }

  @ApiOperation({ summary: 'Beat Plan List' })
  @ApiBody({ type: AppBeatPlanListDto })
  @Post('/read')
  async create(@Req() req: any, @Body() params: AppBeatPlanListDto): Promise<AppBeatPlanListDto> {
    return await this.appBeatPlanService.read(req, params);
  }
}