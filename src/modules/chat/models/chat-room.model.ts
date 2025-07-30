import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { ParentSchema } from 'src/common/schema/parent.schema';
import { COLLECTION_CONST } from 'src/config/collection.constant';

@Schema({ collection: COLLECTION_CONST().CRM_CHAT_ROOM })
export class Base extends Document {}

const ChatRoomSchema = SchemaFactory.createForClass(Base);
ChatRoomSchema.add(ParentSchema.obj);

export enum RoomType {
  PRIVATE = 'private', 
  GROUP = 'group'
}

@Schema()
export class Participant extends Document {
  @Prop({ type: Types.ObjectId, required: true })
  participant_id: Types.ObjectId;

  @Prop({ type: String, required: true })
  participant_name: string;

  @Prop({ type: String, required: true })
  participant_type: string;
}

const ParticipantSchema = SchemaFactory.createForClass(Participant);

@Schema()
export class ChatRoomModel extends Base {
  @Prop({ type: String, required: true })
  room_name: string; 

  @Prop({ type: String, enum: Object.values(RoomType), required: true })
  room_type: RoomType;

  @Prop({ type: [ParticipantSchema], required: true })
  participants: Participant[];
}

const childSchema = SchemaFactory.createForClass(ChatRoomModel);
ChatRoomSchema.add(childSchema.obj);

export { ChatRoomSchema };
