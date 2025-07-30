import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { ParentSchema } from 'src/common/schema/parent.schema';
import { COLLECTION_CONST } from 'src/config/collection.constant';
import { preUpdateHook } from 'src/common/hooks/pre-update';
@Schema({ collection: COLLECTION_CONST().CRM_LEAVE_MASTER })
export class Base extends Document { }
const LeaveMasterSchema = SchemaFactory.createForClass(Base);
LeaveMasterSchema.add(ParentSchema.obj);
@Schema()
export class LeaveMasterModel extends Document {

  @Prop({ type: Number })
  org_id: number;

  @Prop({ type: Types.ObjectId, required: true })
  user_id: string;

  @Prop({ type: String, required: true })
  user_name: string;

  @Prop({ type: Date })
  leave_start: Date;

  @Prop({ type: Date })
  leave_end: Date;

  @Prop({ type: Object })
  form_data?: Record<string, any>;
}

const childSchema = SchemaFactory.createForClass(LeaveMasterModel);
LeaveMasterSchema.add(childSchema.obj);
LeaveMasterSchema.pre('findOneAndUpdate', preUpdateHook);
LeaveMasterSchema.pre('updateOne', preUpdateHook);
LeaveMasterSchema.pre('updateMany', preUpdateHook);
export { LeaveMasterSchema };