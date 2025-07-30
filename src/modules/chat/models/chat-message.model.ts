import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { ParentSchema } from 'src/common/schema/parent.schema';
import { COLLECTION_CONST } from 'src/config/collection.constant';

export enum PlatformEnum {
  APP = 'app',
  WEB = 'web',
}

@Schema({ collection: COLLECTION_CONST().CRM_CHAT_MESSAGE })
export class Base extends Document {}
const ChatMessageSchema = SchemaFactory.createForClass(Base);
ChatMessageSchema.add(ParentSchema.obj);

@Schema()
export class ChatMessageModel extends Document {
  
  @Prop({ type: Number, default: () => Date.now() })
  timestamp: number;

  @Prop({ type: String, enum: PlatformEnum, required: true })
  platform: PlatformEnum;
  
  @Prop({ type: Number })
  org_id: number;

  @Prop({ type: Types.ObjectId })
  chat_id?: Types.ObjectId;

  @Prop({ type: Types.ObjectId })
  room_id?: Types.ObjectId;

  @Prop({ type: Types.ObjectId, required: true })
  sender_id: Types.ObjectId;

  @Prop({ type: Number})
  login_type_id: number;

  @Prop({ type: String, required: true })
  message: string;

  @Prop({ type: String, default: 'Delivered' })
  status: string;
}

const childSchema = SchemaFactory.createForClass(ChatMessageModel);
ChatMessageSchema.add(childSchema.obj);
export { ChatMessageSchema };
