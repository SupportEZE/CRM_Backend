import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { preUpdateHook } from 'src/common/hooks/pre-update';
import { ParentSchema } from 'src/common/schema/parent.schema';
import { COLLECTION_CONST } from 'src/config/collection.constant';
@Schema({ collection: COLLECTION_CONST().CRM_LEAVE })
export class Base extends Document { }
const LeaveSchema = SchemaFactory.createForClass(Base);
LeaveSchema.add(ParentSchema.obj);
@Schema()
export class LeaveModel extends Document {
  
  @Prop({ type: Number })
  org_id: number;
  
  @Prop({ type: Types.ObjectId })
  user_id: string;
  
  @Prop({ type: String })
  user_name: string;
  
  @Prop({ type: String })
  leave_duration: string;
  
  @Prop({ type: String })
  leave_type: string;
  
  @Prop({ type: String })
  subject: string;
  
  @Prop({ type: Date })
  leave_start: Date;
  
  @Prop({ type: Date })
  leave_end: Date;
  
  @Prop({ type: String })
  reason: string;
  
  @Prop({ type: String })
  status: string;
  
  @Prop({ type: String})
  senior_status: string;
  
  @Prop({ type: Date})
  senior_status_updated_at: Date;
  
  @Prop({ type: Types.ObjectId})
  senior_status_updated_id: Types.ObjectId;
  
  @Prop({ type: String})
  senior_status_updated_name: string;
  
  @Prop({ type: String})
  senior_status_remark: string;
  
  @Prop({ type: String })
  description: string;
  
  @Prop({ type: Object })
  form_data?: Record<string, any>;
}

const childSchema = SchemaFactory.createForClass(LeaveModel);
LeaveSchema.add(childSchema.obj);
LeaveSchema.pre('findOneAndUpdate', preUpdateHook);
LeaveSchema.pre('updateOne', preUpdateHook);
LeaveSchema.pre('updateMany', preUpdateHook);
export { LeaveSchema };