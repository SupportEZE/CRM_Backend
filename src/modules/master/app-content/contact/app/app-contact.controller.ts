import { Controller, Post, Body, Req } from '@nestjs/common';
import { AppContactService } from './app-contact.service';
import { ApiBearerAuth, ApiTags, ApiBody, ApiOperation } from '@nestjs/swagger';

@ApiTags('App-Contact')
@ApiBearerAuth('Authorization')
@Controller('app-contact')
export class AppContactController {
  constructor(private readonly appcontactService: AppContactService) { }

  @Post('/read')
  async read(@Req() req: any, @Body() params: any): Promise<any> {
    return await this.appcontactService.read(req, params);
  }
}
