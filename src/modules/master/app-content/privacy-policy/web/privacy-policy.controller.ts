import { Body, Controller, Post, Req, Request } from '@nestjs/common';
import { PrivacyPolicyService } from './privacy-policy.service';
import { CreatePrivacyPolicyDto} from './dto/privacy-policy.dto';

@Controller('privacy-policy')
export class PrivacyPolicyController {
  constructor(private readonly privacyPolicyService: PrivacyPolicyService) {}

  @Post('/create')
  async create(@Req() req: Request, @Body() params: CreatePrivacyPolicyDto): Promise<any> {
    return await this.privacyPolicyService.create(req, params);
  }

  @Post('/read')
  async read(@Req() req: Request, @Body() params: any): Promise<any> {
    return await this.privacyPolicyService.read(req, params);
  }
}
