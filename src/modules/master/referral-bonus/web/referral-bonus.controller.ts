import { Body, Controller, Post, Req, Patch } from '@nestjs/common';
import { ReferralBonusService } from './referral-bonus.service';
import { CreateReferralBonusDto, ReadReferralBonusDto, UpdateReferralBonusDto, StatusUpdateReferralBonusDto, DeleteReferralBonusDto } from './dto/referral-bonus.dto';

@Controller('referral-bonus')
export class ReferralBonusController {
  constructor(
    private readonly referralBonusService: ReferralBonusService

  ) { }

  @Post('/create')
  async create(@Req() req: any, @Body() params: CreateReferralBonusDto): Promise<any> {
    return await this.referralBonusService.create(req, params);
  }
  @Patch('/update')
  async update(@Req() req: any, @Body() params: UpdateReferralBonusDto): Promise<any> {
    return await this.referralBonusService.update(req, params);
  }
  @Post('/read')
  async read(@Req() req: any, @Body() params: any): Promise<any> {
    return await this.referralBonusService.read(req, params);
  }
  @Patch('/update-status')
  async updateStatus(@Req() req: any, @Body() params: StatusUpdateReferralBonusDto): Promise<any> {
    return await this.referralBonusService.updateStatus(req, params);
  }
  @Patch('/delete')
  async delete(@Req() req: any, @Body() params: DeleteReferralBonusDto): Promise<any> {
    return await this.referralBonusService.update(req, params);
  }
}