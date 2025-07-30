import { forwardRef, Module } from '@nestjs/common';
import { TicketController } from './web/ticket.controller';
import { TicketService } from './web/ticket.service';
import { AppTicketController } from './app/app-ticket.controller';
import { AppTicketService } from './app/app-ticket.service';
import { MongooseModule } from '@nestjs/mongoose';
import { TicketModel, TicketSchema } from './models/ticket.model';
import {
  VisitActivityModel,
  VisitActivitySchema,
} from '../../sfa/activity/models/visit-activity.model';
import { ResponseService } from 'src/services/response.service';
import {
  CustomerModel,
  CustomerSchema,
} from 'src/modules/master/customer/default/models/customer.model';
import {
  UserModel,
  UserSchema,
} from 'src/modules/master/user/models/user.model';
import {
  CustomerTypeModel,
  CustomerTypeSchema,
} from 'src/modules/master/customer-type/models/customer-type.model';
import { NotificationService } from 'src/shared/rpc/notification.service';
import { TicketDocsModel, TicketDocsSchema } from './models/ticket-docs.model';
import { S3Service } from 'src/shared/rpc/s3.service';
import { CommentModule } from 'src/modules/sfa/comment/comment.module';
import { UserModule } from '../user/user.module';
import { CustomerTypeModule } from '../customer-type/customer-type.module';
import { CustomerModule } from '../customer/customer.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: TicketDocsModel.name, schema: TicketDocsSchema },
      { name: TicketModel.name, schema: TicketSchema },
      { name: VisitActivityModel.name, schema: VisitActivitySchema },
      { name: UserModel.name, schema: UserSchema },
      { name: CustomerModel.name, schema: CustomerSchema },
      { name: CustomerTypeModel.name, schema: CustomerTypeSchema },
    ]),
    CommentModule,
    UserModule,
    CustomerTypeModule,
    forwardRef(() => CustomerModule),
  ],
  controllers: [TicketController, AppTicketController],
  providers: [
    TicketService,
    AppTicketService,
    ResponseService,
    NotificationService,
    S3Service,
  ],
  exports: [TicketService, AppTicketService],
})
export class TicketModule {}
