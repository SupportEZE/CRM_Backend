import { Module } from '@nestjs/common';
import { HolidayController } from './web/holiday.controller';
import { HolidayService } from './web/holiday.service';
import { AppHolidayController } from './app/app-holiday.controller';
import { AppHolidayService } from './app/app-holiday.service';
import { MongooseModule } from '@nestjs/mongoose';
import { HolidayModel,HolidaySchema } from './models/holiday.model';
import { ResponseService } from 'src/services/response.service';
import { DateTimeService } from 'src/services/date-time.service';
@Module({
  imports: [
    MongooseModule.forFeature([
      { name: HolidayModel.name, schema: HolidaySchema },
    ])
  ],
  controllers: [HolidayController,AppHolidayController],
  providers: [HolidayService,AppHolidayService,ResponseService,DateTimeService],
})
export class HolidayModule {}
