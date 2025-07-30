import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { ParentSchema } from 'src/common/schema/parent.schema';
import { COLLECTION_CONST } from 'src/config/collection.constant';

export enum SitesStatus {
  INPROCESS = 'Inprocess',
  LOST = 'Lost',
  WIN = 'Win'
}

@Schema({ collection: COLLECTION_CONST().CRM_SITE_PROJECT })
export class Base extends Document { }
const SitesSchema = SchemaFactory.createForClass(Base);
SitesSchema.add(ParentSchema.obj);
@Schema()
export class SitesModel extends Document {

  @Prop({ type: Number })
  org_id: number;

  @Prop({ type: String, required: true })
  site_type: string;

  @Prop({ type: String, required: true })
  source: string;

  @Prop({ type: String, required: true })
  priority: string;

  @Prop({ type: String, required: true })
  site_name: string;

  @Prop({ type: String })
  site_id: string;

  @Prop({ type: String })
  pincode: string;

  @Prop({ type: String })
  state: string;

  @Prop({ type: String })
  address: string;

  @Prop({ type: String })
  district: string;

  @Prop({ type: String })
  city: string;

  @Prop({ type: String })
  mobile: string;

  @Prop({ type: Types.ObjectId })
  assigned_to_user_id: string;

  @Prop({ type: String })
  assigned_to_user_name: string;

  @Prop({ type: String })
  status: string;

  @Prop({ type: String })
  reason: string;

  @Prop({ type: Number })
  lat: number;

  @Prop({ type: Number })
  long: number;

  @Prop({ type: Array })
  files: Record<string, any>;

  @Prop({ type: Object })
  form_data?: Record<string, any>;

  @Prop({ type: Date })
  assigned_date: Date;

}
const childSchema = SchemaFactory.createForClass(SitesModel);
SitesSchema.add(childSchema.obj);
export { SitesSchema };