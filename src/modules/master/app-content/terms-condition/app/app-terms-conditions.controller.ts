import { Controller, Post, Body, Req, Request } from '@nestjs/common';
import { AppTermsConditionsService } from './app-terms-conditions.service';
import { ApiBearerAuth, ApiTags, ApiBody, ApiOperation } from '@nestjs/swagger';
import { ReadTermsConditionsDto } from './dto/app-terms-conditions.dto';
import { Public } from 'src/decorators/public.decorator';

@ApiTags('App-Terms-Conditions')
@ApiBearerAuth('Authorization')
@Controller('app-terms-conditions')
export class AppTermsConditionsController {
  constructor(private readonly appTermsConditionsService: AppTermsConditionsService) { }

  @ApiOperation({ summary: 'Read Terms-Conditions' })
  @Public()
  @Post('/read')
  async read(@Req() req: Request, @Body() params: ReadTermsConditionsDto): Promise<ReadTermsConditionsDto> {
    return await this.appTermsConditionsService.read(req, params);
  }
}