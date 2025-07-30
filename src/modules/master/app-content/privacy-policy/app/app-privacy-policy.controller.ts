import { Controller, Post, Body, Req, Request } from '@nestjs/common';
import { AppPrivacyPolicyService } from './app-privacy-policy.service';
import { ApiBearerAuth, ApiTags, ApiBody, ApiOperation } from '@nestjs/swagger';

@ApiTags('App-Privacy-Policy')
@ApiBearerAuth('Authorization')
@Controller('app-privacy-policy')
export class AppPrivacyPolicyController {
  constructor(private readonly appPrivacyPolicyService: AppPrivacyPolicyService) { }

  @ApiOperation({ summary: 'Read PrivacyPolicy' })
  @Post('/read')
  async read(@Req() req: Request, @Body() params: any): Promise<any> {
    return await this.appPrivacyPolicyService.read(req, params);
  }
}