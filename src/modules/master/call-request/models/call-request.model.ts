import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema, Types } from 'mongoose';
import { ParentSchema } from 'src/common/schema/parent.schema';
import { COLLECTION_CONST } from 'src/config/collection.constant';
import { preUpdateHook } from 'src/common/hooks/pre-update';
@Schema({ collection: COLLECTION_CONST().CRM_CALL_REQUEST })
export class CallRequestModel extends Document {
  @Prop({ type: Number, required: true, index: true })
  org_id: number;

  @Prop({ type: Types.ObjectId, ref: COLLECTION_CONST().CRM_CUSTOMERS, required: true, index: true })
  customer_id: Types.ObjectId;

  @Prop({ type: String, required: true })
  customer_type: string;

  @Prop({ type: String, required: true })
  customer_name: string;

  @Prop({ type: String, required: true })
  customer_mobile: string;

  @Prop({ type: String })
  state: string;

  @Prop({ type: String, required: true, index: true })
  status: string;

  @Prop({ type: String })
  sub_status?: string;

  @Prop({ type: Date })
  closed_date: Date;

  @Prop({ type: MongooseSchema.Types.Mixed })
  form_data?: Record<string, any>;
}

const CallRequestSchema = SchemaFactory.createForClass(CallRequestModel);
CallRequestSchema.add(ParentSchema.obj);

CallRequestSchema.pre('findOneAndUpdate', preUpdateHook);
CallRequestSchema.pre('updateOne', preUpdateHook);
CallRequestSchema.pre('updateMany', preUpdateHook);
export { CallRequestSchema };