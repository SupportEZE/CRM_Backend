import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { ParentSchema } from 'src/common/schema/parent.schema';
import { COLLECTION_CONST } from 'src/config/collection.constant';
@Schema({ collection: COLLECTION_CONST().CRM_FOLLOWUP })
export class Base extends Document { }
const FollowupSchema = SchemaFactory.createForClass(Base);
FollowupSchema.add(ParentSchema.obj);
@Schema()
export class FollowupModel extends Document {

  @Prop({ type: Number })
  org_id: number;

  @Prop({ type: Date })
  followup_date: Date;

  @Prop({ type: String })
  followup_time: string;

  @Prop({ type: String })
  customer_name: string;

  @Prop({ type: String })
  followup_type: string;

  @Prop({ type: String })
  category_type: string;

  @Prop({ type: Types.ObjectId })
  category_id: string;

  @Prop({ type: Object })
  category_detail?: Record<string, any>;

  @Prop({ type: Types.ObjectId })
  assigned_to_user_id: string;

  @Prop({ type: String })
  assigned_to_user_name: string;

  @Prop({ type: Object })
  assigned_user_detail?: Record<string, any>;;

  @Prop({ type: String })
  remark: string;

  @Prop({ type: String })
  status: string;

  @Prop({ type: Object })
  form_data?: Record<string, any>;

  @Prop({ type: Types.ObjectId })
  visit_activity_id: Types.ObjectId;

}

const childSchema = SchemaFactory.createForClass(FollowupModel);
FollowupSchema.add(childSchema.obj);
export { FollowupSchema };