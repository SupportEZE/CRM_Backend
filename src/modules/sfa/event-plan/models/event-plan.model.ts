import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { ParentSchema } from 'src/common/schema/parent.schema';
import { COLLECTION_CONST } from 'src/config/collection.constant';
@Schema({ collection: COLLECTION_CONST().CRM_EVENT_PLAN })
export class Base extends Document { }
const EventPlanSchema = SchemaFactory.createForClass(Base);
EventPlanSchema.add(ParentSchema.obj);
@Schema()
export class EventPlanModel extends Document {

  @Prop({ type: Number })
  org_id: number;

  @Prop({ type: String })
  event_id: string;

  @Prop({ type: Date, required: true })
  event_date: Date;

  @Prop({ type: String })
  event_type: string;

  @Prop({ type: Types.ObjectId })
  assigned_to_user_id: string;

  @Prop({ type: String })
  assigned_to_user_name: string;

  @Prop({ type: Types.ObjectId, required: true })
  customer_type_id: string;

  @Prop({ type: String })
  customer_type_name: string;

  @Prop({ type: Types.ObjectId, required: true })
  customer_id: string;

  @Prop({ type: String })
  customer_name: string;

  @Prop({ type: Number })
  invite_members: number;

  @Prop({ type: Number })
  budget_request_per_person: number;

  @Prop({ type: String })
  gift_detail: string;

  @Prop({ type: String })
  status: string;

  @Prop({ type: String })
  event_venue: string;

  @Prop({ type: String })
  remark: string;

  @Prop({ type: String })
  reason: string;
}
const childSchema = SchemaFactory.createForClass(EventPlanModel);
EventPlanSchema.add(childSchema.obj);
export { EventPlanSchema };