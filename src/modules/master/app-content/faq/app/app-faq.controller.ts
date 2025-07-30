import { Controller, Post, Body, Req } from '@nestjs/common';
import { AppFaqService } from './app-faq.service';
import { ReadFaqDto } from './dto/app-faq.dto';
import { ApiBearerAuth, ApiTags, ApiBody, ApiOperation } from '@nestjs/swagger';

@ApiTags('App-Faq')
@ApiBearerAuth('Authorization')
@Controller('app-faq')
export class AppFaqController {
  constructor(private readonly appFaqService: AppFaqService) { }

  @ApiOperation({ summary: 'Read Faq' })
  @ApiBody({ type: ReadFaqDto })
  @Post('/read')
  async read(@Req() req: Request, @Body() params: ReadFaqDto): Promise<ReadFaqDto> {
    return await this.appFaqService.read(req, params);
  }
}