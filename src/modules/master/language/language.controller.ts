import { Body, Controller, Post, Req, Get, Param } from '@nestjs/common';
import { LanguageService } from './language.service';
import { ReadLanguageDto } from './dto/language.dto';
import { ApiBearerAuth, ApiTags, ApiBody, ApiOperation } from '@nestjs/swagger';
import { Public } from 'src/decorators/public.decorator';

@ApiTags('language')
@ApiBearerAuth('Authorization')
@Controller('language')
export class LanguageController {
  constructor(
    private readonly languageService: LanguageService

  ) { }

  @Public()
  @ApiOperation({ summary: 'Fetch Language.' })
  @Get('/read-language')
  async publicLanguage(): Promise<any> {
    return await this.languageService.publicLanguage();
  }

  @Public()
  @ApiOperation({ summary: 'Fetch Language json.' })
  @Get('/read-json-public/:language_code')
  async publicLanguageJson(@Param('language_code') languageCode: string): Promise<any> {
    return await this.languageService.publicLanguageJson(languageCode);
  }

  @ApiOperation({ summary: 'Fetch Language json.' })
  @Get('/read-json-private/:language_code')
  async privateLanguageJson(@Req() req: any, @Param('language_code') languageCode: string): Promise<any> {
    return await this.languageService.privateLanguageJson(req, languageCode);
  }

}
