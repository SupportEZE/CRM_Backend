import { Controller, Post, Body, Req, Request } from '@nestjs/common';
import { AppVersionService } from './version.service';
import { AppVersionReadDTO } from './dto/version.dto';
import { Public } from 'src/decorators/public.decorator';

@Controller('app-version')
export class AppVersionController {
  constructor(private readonly appVersionService: AppVersionService) { }

  @Public()
  @Post('/read')
  async read(@Req() req: Request, @Body() params: AppVersionReadDTO): Promise<AppVersionReadDTO> {
    return this.appVersionService.read(req, params)
  }
}
