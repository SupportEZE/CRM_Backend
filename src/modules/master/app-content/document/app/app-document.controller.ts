import { Controller, Post, Body, Req } from '@nestjs/common';
import { AppDocumentService } from './app-document.service';
import { ApiBearerAuth, ApiTags, ApiBody, ApiOperation } from '@nestjs/swagger';

@ApiTags('App-Document')
@ApiBearerAuth('Authorization')
@Controller('app-document')
export class AppDocumentController {
  constructor(private readonly appDocumentService: AppDocumentService) { }

  @ApiOperation({ summary: 'Read Document' })
  @Post('/read')
  async read(@Req() req: Request, @Body() params: any): Promise<any> {
    return await this.appDocumentService.read(req, params);
  }
}