import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { ParentSchema } from 'src/common/schema/parent.schema';
import { COLLECTION_CONST } from 'src/config/collection.constant';

export enum EnquiryStatus {
  PENDING = 'Review Pending',
  INPROCESS = 'Inprocess',
  NOT_ASSIGNED = 'Not Assigned',
  ASSIGNED = 'Assigned',
  LOST = 'Lost',
  DROP = 'Drop',
  CLOSE = "Close",
  JUNK = 'Junk & Close',
  WIN = 'Win'
}

@Schema({ collection: COLLECTION_CONST().CRM_ENQUIRY })
export class Base extends Document { }
const EnquirySchema = SchemaFactory.createForClass(Base);
EnquirySchema.add(ParentSchema.obj);
@Schema()
export class EnquiryModel extends Document {

  @Prop({ type: Number })
  org_id: number;

  @Prop({ type: String })
  old_lead_id: string;

  @Prop({ type: String })
  enquiry_id: string;

  @Prop({ type: String, required: true })
  enquiry_type: string;

  @Prop({ type: String, required: true })
  enquiry_source: string;

  @Prop({ type: Types.ObjectId })
  assigned_to_user_id: Types.ObjectId;

  @Prop({ type: String })
  assigned_to_user_name: string;

  @Prop({ type: String, required: true })
  name: string;

  @Prop({ type: String, required: true })
  mobile: string;

  @Prop({ type: String })
  email: string;

  @Prop({ type: String, required: true })
  requirement: string;

  @Prop({ type: String })
  status: string;

  @Prop({ type: String })
  reason: string;

  @Prop({ type: Array })
  files: Record<string, any>;

  @Prop({ type: Object })
  form_data?: Record<string, any>;

  @Prop({ type: Date })
  assigned_date: Date;

  @Prop({ type: Types.ObjectId })
  visit_activity_id: Types.ObjectId;

}

const childSchema = SchemaFactory.createForClass(EnquiryModel);
EnquirySchema.add(childSchema.obj);
export { EnquirySchema };


