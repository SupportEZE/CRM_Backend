import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { preUpdateHook } from 'src/common/hooks/pre-update';
import { ParentSchema } from 'src/common/schema/parent.schema';
import { COLLECTION_CONST } from 'src/config/collection.constant';
@Schema({ collection: COLLECTION_CONST().CRM_LEAVE_BALANCE })
export class Base extends Document { }
const LeaveBalanceSchema = SchemaFactory.createForClass(Base);
LeaveBalanceSchema.add(ParentSchema.obj);
@Schema()
export class LeaveBalanceModel extends Document {

  @Prop({ type: Number })
  org_id: number;

  @Prop({ type: Types.ObjectId, required: true })
  user_id: string;

  @Prop({ type: Types.ObjectId, required: true })
  leave_master_id: string;

  @Prop({ type: Object })
  leave_balance?: Record<string, any>;
}

const childSchema = SchemaFactory.createForClass(LeaveBalanceModel);
LeaveBalanceSchema.add(childSchema.obj);
LeaveBalanceSchema.pre('findOneAndUpdate', preUpdateHook);
LeaveBalanceSchema.pre('updateOne', preUpdateHook);
LeaveBalanceSchema.pre('updateMany', preUpdateHook);
export { LeaveBalanceSchema };