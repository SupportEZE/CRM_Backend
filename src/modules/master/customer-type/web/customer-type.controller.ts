import { Body, Controller, Post, Req, Request } from '@nestjs/common';
import { CustomerTypeService } from './customer-type.service';
import { CreateCustomerTypeDto, ReadCustomerTypeDto, ReadDropdownDto } from './dto/customer-type.dto';

@Controller('customer-type')
export class CustomerTypeController {
  constructor(private readonly customerTypeService: CustomerTypeService) { }

  @Post('/create')
  async create(@Req() req: Request, @Body() params: CreateCustomerTypeDto): Promise<CreateCustomerTypeDto> {
    return await this.customerTypeService.create(req, params);
  }
  @Post('/read')
  async read(@Req() req: Request, @Body() params: ReadCustomerTypeDto): Promise<ReadCustomerTypeDto> {
    return await this.customerTypeService.read(req, params);
  }
  @Post('/read-dropdown')
  async readDropdown(@Req() req: Request, @Body() params: ReadDropdownDto): Promise<ReadDropdownDto> {
    return await this.customerTypeService.readDropdown(req, params);
  }

}
