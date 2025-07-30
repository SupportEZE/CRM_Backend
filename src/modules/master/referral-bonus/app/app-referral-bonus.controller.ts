import { Controller, Post, Body, Req, Request } from '@nestjs/common';
import { AppReferralBonusService } from './app-referral-bonus.service';
import { ApiBearerAuth, ApiTags, ApiBody, ApiOperation } from '@nestjs/swagger';

@ApiTags('App-Referral-Bonus')
@ApiBearerAuth('Authorization')
@Controller('app-referral-bonus')
export class AppReferralBonusController {
  constructor(private readonly appreferralbonusService: AppReferralBonusService) { }

  @ApiOperation({ summary: 'Read Referral Bonus' })
  @Post('/read')
  async read(@Req() req: Request, @Body() params: any): Promise<any> {
    return await this.appreferralbonusService.read(req, params);
  }
}