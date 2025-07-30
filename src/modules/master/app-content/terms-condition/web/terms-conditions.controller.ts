import { Body, Controller, Post, Req, Request } from '@nestjs/common';
import { TermsConditionsService } from './terms-conditions.service';
import { CreateTermsConditionsDto } from './dto/terms-conditions.dto';


@Controller('terms-conditions')
export class TermsConditionsController {
  constructor(private readonly termsConditionsService: TermsConditionsService) { }

  @Post('/create')
  async create(@Req() req: Request, @Body() params: CreateTermsConditionsDto): Promise<any> {
    return await this.termsConditionsService.create(req, params);
  }

  @Post('/read')
  async read(@Req() req: Request, @Body() params: any): Promise<any> {
    return await this.termsConditionsService.read(req, params);
  }

}
