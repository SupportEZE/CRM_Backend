import { HttpStatus, Injectable } from '@nestjs/common';
import { ChatMessageModel } from '../models/chat-message.model';
import { Model } from 'mongoose';
import { InjectModel } from '@nestjs/mongoose';
import { ResponseService } from 'src/services/response.service';
import { ChatModel } from '../models/chat.model';
import {
  tat,
  tatToMilliseconds,
  toObjectId,
} from 'src/common/utils/common.utils';
import { UserModel } from 'src/modules/master/user/models/user.model';
import { CustomerModel } from 'src/modules/master/customer/default/models/customer.model';
import { PlatformEnum } from '../models/chat-message.model';
import { NotificationService } from 'src/shared/rpc/notification.service';
import { ModulePerModel } from 'src/modules/master/rbac/models/module-permission.model';

@Injectable()
export class AppChatService {
  constructor(
    @InjectModel(ChatMessageModel.name)
    private chatMessageModel: Model<ChatMessageModel>,
    @InjectModel(ChatModel.name) private chatModel: Model<ChatModel>,
    @InjectModel(UserModel.name) private userModel: Model<UserModel>,
    @InjectModel(CustomerModel.name)
    private customerModel: Model<CustomerModel>,
    @InjectModel(ModulePerModel.name)
    private modulePerModel: Model<ModulePerModel>,
    private readonly res: ResponseService,
    private readonly notificationService: NotificationService,
  ) {}

  async chatInit(req: Request, params: any): Promise<any> {
    try {
      const loginId = req['user']['_id'];
      let data: Record<string, any>;
      let senderType: string;
      let chatObj: Record<string, any> = {
        sender_id: loginId,
      };
      if (req['user']['login_type_id'] === global.LOGIN_TYPE_ID['FIELD_USER']) {
        senderType = 'user';
        data = await this.userModel.findOne({ _id: loginId });
        chatObj.name = data.name;
        chatObj.designation = data.designation;
      } else {
        senderType = 'customer';
        data = await this.customerModel.findOne({ _id: loginId });
        chatObj.name = data.customer_name;
        chatObj.designation = data.customer_type_name;
      }
      chatObj.mobile = data.mobile;
      chatObj.profile_pic = data.profile_pic;

      let match: Record<string, any> = {
        is_delete: 0,
        org_id: req['user']['org_id'],
        sender_id: req['user']['_id'],
      };
      let chatId: any;
      let exist: Record<string, any> = await this.chatModel
        .findOne(match)
        .lean();
      if (!exist) {
        chatObj = {
          ...req['createObj'],
          ...chatObj,
        };
        const document = new this.chatModel(chatObj);
        const insert = await document.save();
        chatId = insert._id;
      } else {
        chatId = exist._id;
      }

      if (!chatId)
        return this.res.error(
          HttpStatus.NOT_FOUND,
          'ERROR.NOT_EXIST',
          'chat not created',
        );

      let chatMessageObj: Record<string, any> = {
        ...req['createObj'],
        chat_id: chatId,
        sender_id: loginId,
        sender_type: senderType,
        message: params.message,
        platform: PlatformEnum.APP,
      };
      const document = new this.chatMessageModel(chatMessageObj);
      await document.save();
      return this.res.success('SUCCESS.CREATE');
    } catch (error) {
      return this.res.error(HttpStatus.BAD_REQUEST, 'ERROR.BAD_REQ', error);
    }
  }
  async readChatMessage(req: Request, params: any): Promise<any> {
    try {
      let match: Record<string, any> = {
        is_delete: 0,
        org_id: req['user']['org_id'],
      };
      if (params?.room_id) {
        match.room_id = toObjectId(params.room_id);
      } else {
        match.sender_id = params.customer_id || req['user']['_id'];
      }
      const data = await this.chatMessageModel.find(match);
      return this.res.success('SUCCESS.FETCH', data);
    } catch (error) {
      return this.res.error(HttpStatus.BAD_REQUEST, 'ERROR.BAD_REQ', error);
    }
  }
  async chatTat(req: Request, params: any): Promise<any> {
    try {
      let status: boolean = true;
      let match: Record<string, any> = {
        is_delete: 0,
        org_id: req['user']['org_id'],
        sender_id: req['user']['_id'],
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
        match.sender_id = { $ne: req['user']['_id'] };
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
      return { status, tatTimestr, tatTime, first, second };
    } catch (error) {
      return this.res.error(HttpStatus.BAD_REQUEST, 'ERROR.BAD_REQ', error);
    }
  }
  async notifySupport(req: Request, params: any): Promise<any> {
    try {
      let notifyRes: any;
      const { status, tatTime, second } = await this.chatTat(req, params);
      if (status) {
        const defaultTat = tatToMilliseconds(global.DEFAULT_NOTIFICATION_TAT);
        if (defaultTat > tatTime) {
          let account_ids: string[] = [second.sender_id];
          let notifyObj: Record<string, any> = {
            title: 'Ezeone support',
            body: 'hello',
            account_ids: account_ids,
          };
          notifyRes = await this.notificationService.notify(req, notifyObj);
        } else {
          let roleIds: Record<string, any> = await this.modulePerModel.find(
            { module_id: global.MODULES['Chat'] },
            { user_role_id: 1 },
          );
          roleIds = roleIds?.map((row: any) => row.user_role_id);
          let usersId = await this.userModel.find({
            user_role_id: { $in: roleIds },
          });
          usersId = usersId?.map((row: any) => row._id);
          let account_ids: any[] = usersId;
          let notifyObj: Record<string, any> = {
            title: 'Ezeone support',
            body: 'hello',
            account_ids: account_ids,
          };
          notifyRes = await this.notificationService.notify(req, notifyObj);
        }
        return notifyRes;
      }
    } catch (error) {
      return this.res.error(HttpStatus.BAD_REQUEST, 'ERROR.BAD_REQ', error);
    }
  }
}
