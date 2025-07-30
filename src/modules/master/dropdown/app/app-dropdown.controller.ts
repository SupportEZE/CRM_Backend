import { Body, Controller, Post, Req } from '@nestjs/common';
import { AppDropdownService } from './app-dropdown.service';
import { ReadOptionDropdownDto } from '../web/dto/option.dto';
import { DropdownService } from '../web/dropdown.service';

@Controller('app-dropdown')
export class AppDropdownController {
  constructor(
    private readonly appService: AppDropdownService,
    private readonly dropdownService: DropdownService
  ) { }

  @Post('/read-dropdown')
  async readDropdown(@Req() req: Request, @Body() params: ReadOptionDropdownDto): Promise<ReadOptionDropdownDto> {
    return await this.dropdownService.readDropdown(req, params);
  }
}
