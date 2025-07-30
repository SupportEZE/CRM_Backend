import { Body, Controller, Post, Req ,Request} from '@nestjs/common';
import { AboutService } from './about.service';
import { CreateAboutDto } from './dto/about.dto';

@Controller('about')
export class AboutController {
  constructor(
    private readonly aboutService: AboutService

  ) {}

  @Post('/create')
    async create(@Req() req: Request, @Body() params:CreateAboutDto): Promise<CreateAboutDto> {
      return await this.aboutService.create(req, params);
  }

  @Post('/read')
  async read(@Req() req: Request, @Body() params:any): Promise<any> {
    return await this.aboutService.read(req, params);
  }
}
