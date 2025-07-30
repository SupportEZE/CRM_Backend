import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { EventPlanModel, EventPlanSchema } from './models/event-plan.model';
import { EventPlanController } from './web/event-plan.controller';
import { EventPlanService } from './web/event-plan.service';
import { ResponseService } from 'src/services/response.service';
import { AppEventPlanController } from './app/app-event-plan.controller';
import { DateTimeService } from 'src/services/date-time.service';
import { CustomerModule } from 'src/modules/master/customer/customer.module';
import { EventPlanParticipantModel, EventPlanParticipantSchema } from './models/event-plan-participants.model';
import { S3Service } from 'src/shared/rpc/s3.service';
import { EventPlanDocsModel, EventPlanDocsSchema } from './models/event-plan-docs.model';
import { ExpenseModule } from '../expense/expense.module';
import { UserModule } from 'src/modules/master/user/user.module';

@Module({
  imports: [
    MongooseModule.forFeature(
      [
        { name: EventPlanModel.name, schema: EventPlanSchema },
        { name: EventPlanParticipantModel.name, schema: EventPlanParticipantSchema },
        { name: EventPlanDocsModel.name, schema: EventPlanDocsSchema },
      ]
    ),
    CustomerModule,
    ExpenseModule,
    UserModule
  ],

  providers: [EventPlanService, ResponseService, DateTimeService, S3Service],
  controllers: [EventPlanController, AppEventPlanController],
  exports: [EventPlanService]
})
export class EventPlanModule { }
