import { Body, Controller, Post, Req ,Request} from '@nestjs/common';
import { ReadDropdownDto } from './dto/app-customer-type.dto';
import { CustomerTypeService } from '../web/customer-type.service';
@Controller('app-customer-type')
export class AppCustomerTypeController {
  constructor(
    private readonly customerTypeService: CustomerTypeService,
  ) {}

  @Post('/read-dropdown')
      async readDropdown(@Req() req: Request, @Body() params:ReadDropdownDto): Promise<ReadDropdownDto> {
      return await this.customerTypeService.readDropdown(req, params);
  }
}
