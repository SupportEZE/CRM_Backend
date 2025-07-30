import { Controller, Post, Body, Req } from '@nestjs/common';
import { AppSpinWinService } from './app-spin-win.service';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiBody } from '@nestjs/swagger';
import { SpinWinCustomerDto } from './dto/app-spin-win.dto';

@ApiTags('App-Spin')
@ApiBearerAuth('Authorization')
@Controller('app-spin')
export class AppSpinWinController {
  constructor(private readonly appSpinWinService: AppSpinWinService) { }

  @ApiOperation({ summary: 'Spin List' })
  @Post('/read-customer-spin')
  async readCustomerSpin(@Req() req: any, @Body() params: any): Promise<any> {
    return await this.appSpinWinService.readCustomerSpin(req, params);
  }

  @ApiOperation({ summary: 'Spin to Win Rewards' })
  @ApiBody({ type: SpinWinCustomerDto })
  @Post('/spin-win')
  async saveSpinWin(@Req() req: any, @Body() params: SpinWinCustomerDto): Promise<SpinWinCustomerDto> {
    return await this.appSpinWinService.saveSpinWin(req, params);
  }

}
