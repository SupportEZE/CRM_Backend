import { Body, Controller, Patch, Post, Req, Request } from '@nestjs/common';
import { AppLeaderBoardService } from './app-leader-board.service';
import { ReadLeaderBoardDto, DetailLeaderBoardDto } from '../web/dto/leader-board.dto';
import { ApiBearerAuth, ApiTags, ApiBody, ApiOperation } from '@nestjs/swagger';


@ApiTags('App-Leaderboard')
@ApiBearerAuth('Authorization')
@Controller('app-leaderboard')

export class AppLeaderBoardController {
  constructor(private readonly appleaderboardService: AppLeaderBoardService) { }

  @ApiOperation({ summary: 'Detail Point category.' })
  @Post('/detail')
  async detail(@Req() req: any, @Body() params: any): Promise<any> {
    return await this.appleaderboardService.detail(req, params);
  }
}
