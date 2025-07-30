import { Controller, Post, Body, Req } from '@nestjs/common';
import { AppBonusService } from './app-bonus.service';
import { AppReadBonusDto } from '../app/dto/app-bonus.dto';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiBody } from '@nestjs/swagger';


@ApiTags('App-Bonus')
@ApiBearerAuth('Authorization')
@Controller('app-bonus')
export class AppBonusController {
  constructor(private readonly appbonusService: AppBonusService) { }

  @ApiOperation({ summary: 'Read Bonus' })
  @ApiBody({ type: AppReadBonusDto })
  @Post('/read')
  async read(@Req() req: any, @Body() params: AppReadBonusDto): Promise<AppReadBonusDto> {
    return await this.appbonusService.read(req, params);
  }
}
