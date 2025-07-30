import { Controller, Post, Body, Req, Request } from '@nestjs/common';
import { AppHolidayService } from './app-holiday.service';
import { ReadHolidayDto } from '../web/dto/holiday.dto';

@Controller('app-holiday')
export class AppHolidayController {
    constructor(private readonly appholidayService: AppHolidayService) { }

    @Post('/read')
    async read(@Req() req: Request, @Body() params: ReadHolidayDto): Promise<ReadHolidayDto> {
        return await this.appholidayService.read(req, params);
    }
}
