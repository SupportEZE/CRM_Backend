import { HttpStatus, Injectable } from '@nestjs/common';
import { ChatRoomModel } from '../models/chat-room.model';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { RoomType } from '../models/chat-room.model';
import { CustomerModel } from 'src/modules/master/customer/default/models/customer.model';
import { UserModel } from 'src/modules/master/user/models/user.model';
import { toObjectId } from 'src/common/utils/common.utils';
import { ResponseService } from 'src/services/response.service';
import { ChatMessageModel } from '../models/chat-message.model';

@Injectable()
export class ChatRoomService {
  constructor(
    @InjectModel(ChatRoomModel.name)
    private chatRoomModel: Model<ChatRoomModel>,
    @InjectModel(CustomerModel.name)
    private customerModel: Model<CustomerModel>,
    @InjectModel(UserModel.name) private userModel: Model<UserModel>,
    @InjectModel(ChatMessageModel.name)
    private chatMessageModel: Model<ChatMessageModel>,
    private readonly res: ResponseService,
  ) {}

  async getOrCreatePrivateChatRoomOld(req: Request, params: any) {
    try {
      if (!req['user']['name'])
        return this.res.error(
          HttpStatus.FORBIDDEN,
          'CHAT.FORBIDDEN',
          'Persmission denied',
        );
      let senderId: string = req['user']['_id'];
      let receiverId: any = toObjectId(params.receiver_id);
      let participants: Record<string, any>[] = [];
      const senderObj: Record<string, any> = {
        participant_id: senderId,
        participant_name: req['user']['name'],
        participant_type: global.SENDER_TYPE[1],
      };
      let receiverObj: Record<string, any> = {
        participant_id: receiverId,
      };
      participants.push(senderObj);

      if (params.receiver_type === global.SENDER_TYPE[1]) {
        const data = await this.userModel.findOne({ _id: receiverId });
        if (!data)
          return this.res.error(
            HttpStatus.NOT_FOUND,
            'CHAT.NO_RECIEVER',
            'receiver not found',
          );
        receiverObj.participant_name = data.name;
        receiverObj.participant_type = global.SENDER_TYPE[1];
      } else {
        const data = await this.customerModel.findOne({ _id: receiverId });
        if (!data)
          return this.res.error(
            HttpStatus.NOT_FOUND,
            'CHAT.NO_RECIEVER',
            'receiver not found',
          );
        receiverObj.participant_name = data.customer_name;
        receiverObj.participant_type = data.customer_type_name;
      }
      participants.push(receiverObj);

      let roomId: any;

      const existingRoom = await this.chatRoomModel.findOne({
        room_type: RoomType.PRIVATE,
        participants: {
          $all: [
            { $elemMatch: { participant_id: senderId } },
            { $elemMatch: { participant_id: receiverId } },
          ],
        },
      });

      if (!existingRoom) {
        const document = new this.chatRoomModel({
          ...req['createObj'],
          room_name: 'Support',
          room_type: RoomType.PRIVATE,
          participants: participants,
        });
        const insert = await document.save();
        roomId = insert._id;
      } else {
        roomId = existingRoom._id;
      }
      if (roomId) {
        await this.chatMessageModel.updateOne(
          { sender_id: receiverId, room_id: { $exists: false } },
          { $set: { room_id: roomId } },
        );
      }
      return this.res.success('SUCCESS.FETCH', { room_id: roomId });
    } catch (error) {
      return this.res.error(HttpStatus.BAD_REQUEST, 'ERROR.BAD_REQ', error);
    }
  }
  async getOrCreatePrivateChatRoom(req: Request, params: any) {
    try {
      let receiverId: any = toObjectId(params.receiver_id);

      let roomId: any;

      const existingRoom = await this.chatRoomModel.findOne({
        room_type: RoomType.PRIVATE,
        participants: {
          $all: [{ $elemMatch: { participant_id: receiverId } }],
        },
      });
      if (!existingRoom)
        return this.res.error(
          HttpStatus.NOT_FOUND,
          'CHAT.NO_ROOM',
          'Room Not found',
        );
      roomId = existingRoom._id;
      return this.res.success('SUCCESS.FETCH', { room_id: roomId });
    } catch (error) {
      return this.res.error(HttpStatus.BAD_REQUEST, 'ERROR.BAD_REQ', error);
    }
  }
}
