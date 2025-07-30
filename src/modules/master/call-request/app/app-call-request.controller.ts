import { Controller, Post, Body, Req, Request } from '@nestjs/common';
import { AppCallRequestService } from './app-call-request.service';
import { ApiBearerAuth, ApiTags, ApiBody, ApiOperation } from '@nestjs/swagger';

@ApiTags('App-Call-Request')
@ApiBearerAuth('Authorization')
@Controller('app-call-request')
export class AppCallRequestController {
  constructor(private readonly appCallRequestService: AppCallRequestService) { }

  @ApiOperation({ summary: 'Send a Call Request' })
  @Post('/create')
  async create(@Req() req: Request, @Body() params: any): Promise<any> {
    return await this.appCallRequestService.create(req, params);
  }
}