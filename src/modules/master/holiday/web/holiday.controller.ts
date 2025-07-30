import { Body, Controller, Patch, Post, Req,Request } from '@nestjs/common';
import { HolidayService} from './holiday.service';
import { CreateHolidayDto,ReadHolidayDto, UpdateHolidayDto,DeleteHolidayDto } from './dto/holiday.dto';

@Controller('holiday')
export class HolidayController {
  constructor(
    private readonly holidayService: HolidayService

) {}

  @Post('/create')
    async create(@Req() req: Request, @Body() params:CreateHolidayDto): Promise<any> {
    return await this.holidayService.create(req, params);
  }
  @Post('/read')
    async read(@Req() req: Request, @Body() params:ReadHolidayDto): Promise<ReadHolidayDto> {
    return await this.holidayService.read(req, params);
  }
  @Patch('/delete')
    async delete(@Req() req: Request, @Body() params: DeleteHolidayDto) {
    return await this.holidayService.delete(req, params);
  }
}
