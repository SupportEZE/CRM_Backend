import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document,Types } from 'mongoose';
import { ParentSchema } from 'src/common/schema/parent.schema';
import { COLLECTION_CONST } from 'src/config/collection.constant';
@Schema({ collection: COLLECTION_CONST().CRM_CHAT })
export class Base extends Document {}
const ChatSchema = SchemaFactory.createForClass(Base);
ChatSchema.add(ParentSchema.obj);

export enum SenderTypeEnum {
  CUSTOMER = 'customer',
  USER = 'user',
}

@Schema()
export class ChatModel extends Document {
 
  @Prop({ type: Number })
  org_id: number;

  @Prop({ type: Types.ObjectId, required: true })
  sender_id: Types.ObjectId;

  @Prop({ type: Number})
  login_type_id: number;

  @Prop({ type: String })
  name: string;

  @Prop({ type: String })
  mobile: string;

  @Prop({ type: String})
  designation?: string;

  @Prop({ type: String})
  profile_pic?: string;

}

const childSchema = SchemaFactory.createForClass(ChatModel);
ChatSchema.add(childSchema.obj);
export { ChatSchema };
