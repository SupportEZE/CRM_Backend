import { Body, Controller, Patch, Post, Req, Request } from '@nestjs/common';
import { DropdownService } from './dropdown.service';
import { CreateDropdownDto, ReadDropdownDto, UpdateDropdownDto, DeleteDropdownDto } from './dto/dropdown.dto';
import { CreateOptionDto, DeleteOptionDto, ReadOptionDropdownDto } from './dto/option.dto';

@Controller('dropdown')
export class DropdownController {
  constructor(private readonly dropdownService: DropdownService) { }

  @Post('/create')
  async create(@Req() req: Request, @Body() params: CreateDropdownDto): Promise<CreateDropdownDto> {
    return await this.dropdownService.create(req, params);
  }
  @Post('/update')
  async update(@Req() req: Request, @Body() params: UpdateDropdownDto): Promise<UpdateDropdownDto> {
    return await this.dropdownService.update(req, params);
  }
  @Post('/read')
  async read(@Req() req: Request, @Body() params: ReadDropdownDto): Promise<ReadDropdownDto> {
    return await this.dropdownService.read(req, params);
  }

  @Post('/delete')
  async delete(@Req() req: Request, @Body() params: DeleteDropdownDto): Promise<DeleteDropdownDto> {
    return await this.dropdownService.delete(req, params);
  }
  @Post('/create-option')
  async createOption(@Req() req: Request, @Body() params: CreateOptionDto): Promise<CreateOptionDto> {
    return await this.dropdownService.createOption(req, params);
  }
  @Patch('/delete-option')
  async deleteOption(@Req() req: Request, @Body() params: DeleteOptionDto): Promise<DeleteOptionDto> {
    return await this.dropdownService.deleteOption(req, params);
  }
  @Post('/read-option')
  async readOption(@Req() req: Request, @Body() params: any): Promise<any> {
    return await this.dropdownService.readOption(req, params);
  }
  @Post('/read-dropdown')
  async readDropdown(@Req() req: Request, @Body() params: ReadOptionDropdownDto): Promise<ReadOptionDropdownDto> {
    return await this.dropdownService.readDropdown(req, params);
  }
  
  @Post('/country')
  async readCountry(@Req() req: any, @Body() params: any): Promise<any> {
    return await this.dropdownService.readCountry(req, params);
  }
}
