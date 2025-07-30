import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { ParentSchema } from 'src/common/schema/parent.schema';
import { COLLECTION_CONST } from 'src/config/collection.constant';
import { preUpdateHook } from 'src/common/hooks/pre-update';

@Schema({ collection: COLLECTION_CONST().CRM_TICKETS })
export class Base extends Document {}

const TicketSchema = SchemaFactory.createForClass(Base);
TicketSchema.add(ParentSchema.obj);
@Schema()
export class TicketModel extends Document {
  
  @Prop({ type: Number, required: true })
  org_id: number;
  
  @Prop({ type: Types.ObjectId, required: true })
  customer_id: Types.ObjectId;
    
  @Prop({ type: Object })
  customer_detail: Record<string, any>;

  @Prop({ type: Types.ObjectId })
  assign_to_user_id?: Types.ObjectId;

  @Prop({ type: Object })
  assign_to_user_detail: Record<string, any>;
  
  @Prop({ type: String, required: true })
  ticket_no: string;
  
  @Prop({ type: String, required: true })
  ticket_category: string;
  
  @Prop({ type: String, required: true })
  ticket_priority: string;
  
  @Prop({ type: String, required: true })
  ticket_description: string;
  
  @Prop({ type: String, default: 'Pending' })
  status: string;
  
  @Prop({ type: String })
  status_remark?: string;
  
  @Prop({ type: Number, min: 1, max: 5 })
  feedback_star: number;
  
  @Prop({ type: String })
  feedback_remark?: string;
  
  @Prop({ type: Types.ObjectId })
  visit_activity_id: Types.ObjectId;
}

const childSchema = SchemaFactory.createForClass(TicketModel);
TicketSchema.add(childSchema.obj);

TicketSchema.pre('findOneAndUpdate', preUpdateHook);
TicketSchema.pre('updateOne', preUpdateHook);
TicketSchema.pre('updateMany', preUpdateHook);
export { TicketSchema };
