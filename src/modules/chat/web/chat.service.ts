import { HttpStatus, Injectable } from '@nestjs/common';
import { ChatMessageModel } from '../models/chat-message.model';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { ResponseService } from 'src/services/response.service';
import { CustomerModel } from 'src/modules/master/customer/default/models/customer.model';
import { UserModel } from 'src/modules/master/user/models/user.model';
import { Like, toObjectId } from 'src/common/utils/common.utils';
import { ChatModel } from '../models/chat.model';
import { SharedUserService } from 'src/modules/master/user/shared-user.service';
import { SharedCustomerService } from 'src/modules/master/customer/shared-customer.service';

@Injectable()
export class ChatService {
  constructor(
    @InjectModel(ChatMessageModel.name)
    private chatMessageModel: Model<ChatMessageModel>,
    @InjectModel(CustomerModel.name)
    private customerModel: Model<CustomerModel>,
    @InjectModel(UserModel.name) private userModel: Model<UserModel>,
    @InjectModel(ChatModel.name) private chatModel: Model<ChatModel>,
    private readonly res: ResponseService,
    private readonly sharedUserService: SharedUserService,
    private readonly sharedCustomerService: SharedCustomerService,
  ) {}

  async pendingChats(req: Request, params: any): Promise<any> {
    try {
      const match: Record<string, any> = {
        is_delete: 0,
        org_id: req['user']['org_id'],
      };

      if (params?.search) {
        match.$or = [
          { name: Like(params.search) },
          { mobile: Like(params.search) },
          { designation: Like(params.search) },
        ];
      }

      const data: any = await this.chatModel.find(match).lean();

      if (data?.length > 0) {
        const chatIds: string[] = data.map((chat) => chat._id);

        const pendingCounts: Array<{ _id: string; count: number }> =
          await this.chatMessageModel.aggregate([
            { $match: { status: 'Delivered', chat_id: { $in: chatIds } } },
            { $group: { _id: '$chat_id', count: { $sum: 1 } } },
          ]);

        const lastMessages: Array<{
          _id: string;
          last_message: string;
          last_message_status: string;
        }> = await this.chatMessageModel.aggregate([
          { $match: { chat_id: { $in: chatIds } } },
          { $sort: { createdAt: -1 } },
          {
            $group: {
              _id: '$chat_id',
              last_message: { $first: '$message' },
              last_message_status: { $first: '$status' },
            },
          },
        ]);

        const pendingCountMap: Record<string, number> = pendingCounts.reduce(
          (acc, item) => {
            acc[item._id.toString()] = item.count;
            return acc;
          },
          {},
        );

        const lastMessageMap: Record<
          string,
          { message: string; status: string }
        > = lastMessages.reduce((acc, item) => {
          acc[item._id.toString()] = {
            message: item.last_message,
            status: item.last_message_status,
          };
          return acc;
        }, {});

        for (const chat of data) {
          (chat as any).pending_chat_count =
            pendingCountMap[chat._id.toString()] || 0;
          (chat as any).last_message =
            lastMessageMap[chat._id.toString()]?.message || null;
          (chat as any).last_message_status =
            lastMessageMap[chat._id.toString()]?.status || null;

          if (chat?.login_type_id === global.LOGIN_TYPE_ID['FIELD_USER']) {
            chat.files = await this.sharedUserService.getDocument(
              chat.sender_id,
            );
          } else {
            chat.files = await this.sharedCustomerService.getDocument(
              chat.sender_id,
            );
          }
        }
      }

      return this.res.success('SUCCESS.FETCH', data);
    } catch (error) {
      return this.res.error(HttpStatus.BAD_REQUEST, 'ERROR.BAD_REQ', error);
    }
  }
  async readChatMessage(req: Request, params: any): Promise<any> {
    try {
      const match: Record<string, any> = {
        is_delete: 0,
        org_id: req['user']['org_id'],
        room_id: toObjectId(params.room_id),
      };
      const data = await this.chatMessageModel.find(match);
      return this.res.success('SUCCESS.FETCH', data);
    } catch (error) {
      return this.res.error(HttpStatus.BAD_REQUEST, 'ERROR.BAD_REQ', error);
    }
  }
  async chatTat(req: Request, params: any): Promise<any> {
    try {
      let match: Record<string, any> = {
        is_delete: 0,
        org_id: req['user']['org_id'],
        sender_id: req['user']['_id'],
        room_id: toObjectId(params.room_id),
      };
      const first = await this.chatMessageModel
        .findOne(match)
        .sort({ _id: -1 });
      match.sender_id = { $ne: req['user']['_id'] };
      const second = await this.chatMessageModel
        .findOne(match)
        .sort({ _id: -1 });
      return { first, second };
    } catch (error) {
      return this.res.error(HttpStatus.BAD_REQUEST, 'ERROR.BAD_REQ', error);
    }
  }
  async unReadChatCount(req: Request, params: any): Promise<any> {
    try {
      const match: Record<string, any> = {
        is_delete: 0,
        org_id: req['user']['org_id'],
        status: 'Delivered',
      };

      const unreadCounts = await this.chatMessageModel.aggregate([
        { $match: match },
        {
          $group: {
            _id: '$chat_id',
            count: { $sum: 1 },
          },
        },
      ]);
      return this.res.success('SUCCESS.FETCH', unreadCounts);
    } catch (error) {
      return this.res.error(HttpStatus.BAD_REQUEST, 'ERROR.BAD_REQ', error);
    }
  }
}
