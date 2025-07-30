import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { LeaveController } from './web/leave.controller';
import { LeaveService } from './web/leave.service';
import { AppLeaveController } from './app/app-leave.controller';
import { AppLeaveService } from './app/app-leave.service';
import { LeaveMasterModel, LeaveMasterSchema } from './models/leave-master.model';
import { LeaveModel, LeaveSchema } from './models/leave.model';
import { LeaveBalanceModel, LeaveBalanceSchema } from './models/leave-balance.model';
import { ResponseService } from 'src/services/response.service';
import { UserModule } from 'src/modules/master/user/user.module';
import { S3Service } from 'src/shared/rpc/s3.service';
import { LeaveDocsModel, LeaveDocsSchema } from './models/leave-doc-model';
import { UserModel, UserSchema } from 'src/modules/master/user/models/user.model';
@Module({
  imports: [
    MongooseModule.forFeature(
      [
        { name: LeaveMasterModel.name, schema: LeaveMasterSchema },
        { name: LeaveModel.name, schema: LeaveSchema },
        { name: LeaveBalanceModel.name, schema: LeaveBalanceSchema },
        { name: LeaveDocsModel.name, schema: LeaveDocsSchema },
        { name: UserModel.name, schema: UserSchema }
      ]
    ),
    UserModule
  ],

  providers: [LeaveService, AppLeaveService, ResponseService, S3Service],
  controllers: [LeaveController, AppLeaveController],
  exports: [AppLeaveService, LeaveService]
})
export class LeaveModule { }
