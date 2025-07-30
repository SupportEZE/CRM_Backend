import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ResponseService } from 'src/services/response.service';
import { ChatController } from './web/chat.controller';
import { ChatService } from './web/chat.service';
import { AppChatController } from './app/app-chat.controller';
import { AppChatService } from './app/app-chat.service';
import { ChatRoomModel, ChatRoomSchema } from './models/chat-room.model';
import {
  ChatMessageModel,
  ChatMessageSchema,
} from './models/chat-message.model';
import { AppChatGateway } from './app/app-chat.gateway';
import { ChatRoomService } from './web/chat-room.service';
import {
  CustomerModel,
  CustomerSchema,
} from '../master/customer/default/models/customer.model';
import { UserModel, UserSchema } from '../master/user/models/user.model';
import { ChatModel, ChatSchema } from './models/chat.model';
import { ChatGateway } from './web/chat.gateway';
import { JwtService } from '@nestjs/jwt';
import { GatewayService } from './web/gateway.service';
import { NotificationService } from 'src/shared/rpc/notification.service';
import {
  ModulePerModel,
  ModulePerSchema,
} from '../master/rbac/models/module-permission.model';
import { S3Service } from 'src/shared/rpc/s3.service';
import { CustomerModule } from '../master/customer/customer.module';
import { UserModule } from '../master/user/user.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: UserModel.name, schema: UserSchema },
      { name: CustomerModel.name, schema: CustomerSchema },
      { name: ChatModel.name, schema: ChatSchema },
      { name: ChatMessageModel.name, schema: ChatMessageSchema },
      { name: ChatRoomModel.name, schema: ChatRoomSchema },
      { name: ModulePerModel.name, schema: ModulePerSchema },
    ]),
    CustomerModule,
    UserModule,
  ],
  controllers: [ChatController, AppChatController],
  providers: [
    GatewayService,
    ChatGateway,
    AppChatGateway,
    ChatService,
    JwtService,
    ChatRoomService,
    AppChatService,
    ResponseService,
    NotificationService,
    S3Service,
  ],
  exports: [ChatGateway, AppChatGateway],
})
export class ChatModule {}
