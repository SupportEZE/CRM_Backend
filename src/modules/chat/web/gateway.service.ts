import { Injectable } from '@nestjs/common';
import { ChatMessageModel } from '../models/chat-message.model';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import {
  tat,
  tatToMilliseconds,
  toObjectId,
} from 'src/common/utils/common.utils';
import { UserModel } from 'src/modules/master/user/models/user.model';
import { CustomerModel } from 'src/modules/master/customer/default/models/customer.model';
import { ChatModel } from '../models/chat.model';
import { RoomType } from '../models/chat-room.model';
import { ChatRoomModel } from '../models/chat-room.model';
import { NotificationService } from 'src/shared/rpc/notification.service';
import { ModulePerModel } from 'src/modules/master/rbac/models/module-permission.model';

const enum chatStatus {
  READ = 'Read',
  DELIVERED = 'Delivered',
}
const enum platform {
  APP = 'app',
  WEB = 'web',
}
@Injectable()
export class GatewayService {
  constructor(
    @InjectModel(ChatMessageModel.name)
    private chatMessageModel: Model<ChatMessageModel>,
    @InjectModel(UserModel.name) private userModel: Model<UserModel>,
    @InjectModel(CustomerModel.name)
    private customerModel: Model<CustomerModel>,
    @InjectModel(ChatModel.name) private chatModel: Model<ChatModel>,
    @InjectModel(ChatRoomModel.name)
    private chatRoomModel: Model<ChatRoomModel>,
    @InjectModel(ModulePerModel.name)
    private modulePerModel: Model<ChatRoomModel>,
    private readonly notificationService: NotificationService,
  ) {}
  async syncChat(client: any, user: any, params: any): Promise<any> {
    try {
      let senderChatId: any;
      if (params.platform == platform.APP) {
        var { chatId, newChat } = await this.chatInit(user, params);
        senderChatId = chatId;
      } else {
        senderChatId = params.chat_id;
      }

      let saveObj: Record<string, any> = {
        org_id: user.org_id,
        created_id: user._id,
        created_name: user.name || user.customer_name,
        platform: params.platform,
        chat_id: senderChatId,
        room_id: toObjectId(params.room_id),
        message: params.message,
        sender_id: user._id,
        login_type_id: user['login_type_id'],
        status: chatStatus.DELIVERED,
      };
      const document = new this.chatMessageModel(saveObj);
      await document.save();
      if (newChat) client.emit('newChat', newChat);
      return senderChatId;
    } catch (error) {
      console.error('syncChat====', error);
      throw error;
    }
  }
  async chatInit(user: any, params: any): Promise<any> {
    try {
      let newChat: boolean = false;
      const loginId = user['_id'];
      const orgId = user['org_id'];
      let data: Record<string, any>;
      let chatObj: Record<string, any> = {
        sender_id: loginId,
      };

      if (user['login_type_id'] === global.LOGIN_TYPE_ID['FIELD_USER']) {
        data = await this.userModel.findOne({ _id: loginId });
        chatObj.name = data.name;
        chatObj.designation = data.designation;
      } else {
        data = await this.customerModel.findOne({ _id: loginId });
        chatObj.name = data.customer_name;
        chatObj.designation = data.customer_type_name;
      }

      chatObj.mobile = data.mobile;
      chatObj.login_type_id = user['login_type_id'];

      let match: Record<string, any> = {
        is_delete: 0,
        org_id: orgId,
        sender_id: loginId,
      };
      let chatId: any;
      let exist: Record<string, any> = await this.chatModel
        .findOne(match)
        .lean();
      if (!exist) {
        chatObj = {
          created_id: user['_id'],
          created_name: user['name'] || user['customer_name'],
          org_id: user['org_id'],
          ...chatObj,
        };
        const document = new this.chatModel(chatObj);
        const insert = await document.save();
        chatId = insert._id;
        newChat = true;
      } else {
        chatId = exist._id;
      }
      return { chatId, newChat };
    } catch (error) {
      console.error('chatInit====', error);
      throw error;
    }
  }
  async getOrCreatePrivateChatRoom(user: Request, params: any) {
    try {
      let senderId: string = user['_id'];

      let participants: Record<string, any>[] = [];
      const senderObj: Record<string, any> = {
        participant_id: senderId,
        participant_name: user['name'] || user['customer_name'],
        participant_type: user['login_type_id'],
      };
      participants.push(senderObj);
      let roomId: any;

      const existingRoom = await this.chatRoomModel.findOne({
        room_type: RoomType.PRIVATE,
        participants: {
          $elemMatch: { participant_id: senderId },
        },
      });

      if (!existingRoom) {
        const document = new this.chatRoomModel({
          created_id: user['_id'],
          created_name: user['name'] || user['customer_name'],
          org_id: user['org_id'],
          room_name: 'Support',
          room_type: RoomType.PRIVATE,
          participants: participants,
        });

        const insert = await document.save();
        roomId = insert._id;
      } else {
        roomId = existingRoom._id;
      }

      return roomId;
    } catch (error) {
      console.error('getOrCreatePrivateChatRoom====', error);
      throw error;
    }
  }
  async chatTat(user: Request, params: any): Promise<any> {
    try {
      let status: boolean = true;
      let match: Record<string, any> = {
        is_delete: 0,
        org_id: user['org_id'],
        sender_id: user['_id'],
        room_id: toObjectId(params.room_id),
      };

      const projection: Record<string, any> = {
        platform: 1,
        chat_id: 1,
        room_id: 1,
        sender_id: 1,
        login_type_id: 1,
        message: 1,
        created_at: 1,
      };

      const first: any = await this.chatMessageModel
        .findOne(match, projection)
        .sort({ _id: -1 });
      let second: any;
      let tatTimestr: string;
      let tatTime: number;
      if (first) {
        match.sender_id = { $ne: user['_id'] };
        second = await this.chatMessageModel
          .findOne(match, projection)
          .sort({ _id: -1 });
        if (second) {
          tatTimestr = tat(first.created_at, second.created_at);
          tatTime = tatToMilliseconds(tatTimestr);
        } else {
          status = false;
        }
      } else {
        status = false;
      }
      return {
        status,
        tatTimestr,
        tatTime,
        first,
        second,
      };
    } catch (error) {
      console.error('chatTat=====', error);
      throw error;
    }
  }
  async notifySupport(user: Request, params: any): Promise<any> {
    try {
      const { status, tatTime, second } = await this.chatTat(user, params);
      const defaultTatMs = tatToMilliseconds(global.DEFAULT_NOTIFICATION_TAT);

      if (status && defaultTatMs > tatTime) {
        return this.notify(user, params, second.sender_id);
      }

      const roleIds = await this.modulePerModel
        .find({ module_id: global.MODULES['Chat'] }, { user_role_id: 1 })
        .then((rows) => rows?.map((row: any) => row.user_role_id));

      const userIds = await this.userModel
        .find({ user_role_id: { $in: roleIds }, org_id: user['org_id'] }) //login_type_id: 3,
        .then((rows) => rows?.map((row: any) => row._id));

      return this.notify(user, params, userIds);
    } catch (error) {
      return null;
    }
  }

  private async notify(user: any, params: any, account_ids: any): Promise<any> {
    params.template_id = 10;
    if (Array.isArray(account_ids)) {
      params.account_ids = account_ids.map((id: any) => ({
        account_ids: id,
        login_type_id: 2, //login_type_id: 3,
      }));
    } else {
      params.account_ids = [
        {
          account_ids,
          login_type_id: 2, //login_type_id: 3,
        },
      ];
    }

    params.variables = {
      body: params.message,
      title: user['name'] || user['customer_name'],
    };

    params.push_notify = true;
    params.in_app = false;
    return this.notificationService.notifyInSocket(user, params);
  }

  async notifyApp(user: Request, params: any): Promise<any> {
    try {
      console.info('notify hit');
      params.template_id = 9;
      params.account_ids = [
        {
          account_ids: params.receiver_id,
          login_type_id: 10,
        },
      ];

      params.variables = {
        body: params.message,
        title: 'chat title',
      };
      params.push_notify = true;
      params.in_app = false;

      return await this.notificationService.notifyInSocket(user, params);
    } catch (error) {
      throw error;
    }
  }

  async readChatMessage(user: Request, params: any): Promise<any> {
    try {
      let match: Record<string, any> = {
        is_delete: 0,
        org_id: user['org_id'],
        room_id: toObjectId(params.room_id),
        sender_id: { $ne: user['_id'] },
      };
      await this.chatMessageModel.updateMany(match, {
        status: chatStatus.READ,
      });
    } catch (error) {
      console.info('readChatMessage=====', error);
      throw error;
    }
  }
}
