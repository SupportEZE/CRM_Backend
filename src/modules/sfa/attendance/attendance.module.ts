import { Module } from '@nestjs/common';
import { AttendanceController } from './web/attendance.controller';
import { AppAttendanceController } from './app/app-attendance.controller';
import { AttendanceService } from './web/attendance.service';
import { AppAttendanceService } from './app/app-attendance.service';
import { MongooseModule } from '@nestjs/mongoose';
import { AttendanceModel, AttendanceSchema } from './models/attendance.model';
import { ResponseService } from 'src/services/response.service';
import { LocationService } from 'src/services/location.service';
import { UserModel, UserSchema } from 'src/modules/master/user/models/user.model';
import { HolidayModel, HolidaySchema } from 'src/modules/master/holiday/models/holiday.model';
import { BackgroundLocationModel, BackgroundLocationSchema } from './models/backgroud-location.model.ts';
import { InvalidBackgroundLocationModel, InvalidBackgroundLocationSchema } from './models/invalid-backgroud-location.model';
import { ValidBackgroundLocationModel, ValidBackgroundLocationSchema } from './models/valid-background-location.model';
import { LeaveModel, LeaveSchema } from '../leave/models/leave.model';
import { AttendanceDocsModel, AttendanceDocsSchema } from './models/attendance-docs.model';
import { S3Service } from 'src/shared/rpc/s3.service';
import { CsvModule } from 'src/shared/csv/csv.module';
import { ActivityModule } from '../activity/activity.module';
import { TimelineModel, TimelineSchema } from './models/timeline.model';
import { UserModule } from 'src/modules/master/user/user.module';
import { DB_NAMES } from 'src/config/db.constant';
import { UserDocsModel, UserDocsSchema } from 'src/modules/master/user/models/user-docs.model';
@Module({
    imports: [
        MongooseModule.forFeature([
            { name: AttendanceDocsModel.name, schema: AttendanceDocsSchema },
            { name: AttendanceModel.name, schema: AttendanceSchema },
            { name: UserModel.name, schema: UserSchema },
            { name: UserDocsModel.name, schema: UserDocsSchema },
            { name: HolidayModel.name, schema: HolidaySchema },
            { name: LeaveModel.name, schema: LeaveSchema },
            { name: UserModel.name, schema: UserSchema },
            { name: TimelineModel.name, schema: TimelineSchema },
        ]),
        MongooseModule.forFeature(
            [
                { name: BackgroundLocationModel.name, schema: BackgroundLocationSchema },
                { name: InvalidBackgroundLocationModel.name, schema: InvalidBackgroundLocationSchema },
                { name: ValidBackgroundLocationModel.name, schema: ValidBackgroundLocationSchema },
            ],
            DB_NAMES().SUPPORT_DB
        ),
        CsvModule,
        ActivityModule,
        UserModule
    ],
    controllers: [AttendanceController, AppAttendanceController],
    providers: [AttendanceService, ResponseService, LocationService, AppAttendanceService, S3Service],
    exports: [AttendanceService, AppAttendanceService]
})

export class AttendanceModule { }
