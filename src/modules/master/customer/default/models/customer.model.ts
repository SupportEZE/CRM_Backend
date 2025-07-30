import { Prop, Schema, SchemaFactory, } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { ParentSchema } from 'src/common/schema/parent.schema';
import { COLLECTION_CONST } from 'src/config/collection.constant';

export const enum PrimaryProfileStatus {
  ACTIVE = 'Active',
  INACTIVE = 'Inactive',
  LEAD = 'Lead'
}

export enum CustomerSource {
  VISIT = 'visit',
  APP = 'app',
  WEB = 'web',
  COMPLAINT = 'complaint'
}
export enum OzoneOBprospectStatus {
  PROSPECT = 'Prospect',
  LEAD = 'Lead',
  MEETING = 'Meeting',
  SHOWROOM_VISIT = 'Showroom Visit',
  BUSINESS_HEAD_MEETING = 'Business Head Meeting',
  STATUS = 'Status',
}

@Schema({ collection: COLLECTION_CONST().CRM_CUSTOMERS })
export class Base extends Document { }
const CustomerSchema = SchemaFactory.createForClass(Base);
CustomerSchema.add(ParentSchema.obj);

@Schema()
export class CustomerModel extends Document {

  @Prop({ type: Number })
  org_id: number;

  @Prop({ type: Number })
  login_type_id: number;

  @Prop({ type: String, required: true })
  login_type_name: string;

  @Prop({ type: Types.ObjectId, required: true })
  customer_type_id: string;

  @Prop({ type: String })
  customer_type_name: string;


  @Prop({ type: String })
  customer_name: string;

  @Prop({ type: String })
  company_name: string;

  @Prop({ type: String })
  customer_code: string;

  @Prop({ type: String })
  mobile: string;

  @Prop({ type: String })
  email: string;

  @Prop({ type: String })
  alt_mobile_no: string;

  @Prop({ type: String })
  country: string;

  @Prop({ type: String })
  state: string;

  @Prop({ type: String })
  district: string;

  @Prop({ type: String })
  city: string;

  @Prop({ type: Number })
  pincode: number;

  @Prop({ type: String })
  address: string;

  @Prop({ type: String, default: 'Active' })
  status: String;

  @Prop({ type: String, default: PrimaryProfileStatus.INACTIVE })
  profile_status: string;


  @Prop({ type: String })
  lead_source: string

  @Prop({ type: String })
  lead_category: string

  @Prop({ type: Types.ObjectId })
  last_order_id: Types.ObjectId

  @Prop({ type: Date })
  last_order_date: Date

  @Prop({ type: Types.ObjectId })
  last_checkin_id: Types.ObjectId

  @Prop({ type: Date })
  last_checkin_Date: Date

  @Prop({ type: String })
  jwt_app_token: string

  @Prop({ type: String })
  jwt_web_token: string

  @Prop({ type: String })
  fcm_token: string

  @Prop({ type: String })
  fake_app_name: string;

  @Prop({ type: Date, default: null })
  first_app_login: Date;

  @Prop({ type: Date, default: null })
  latest_app_login: Date;

  @Prop({ type: Object })
  device_info?: Record<string, any>;

  @Prop({ type: String, required: true })
  identifier: string

  @Prop({ type: String })
  language_code: string

  @Prop({ type: String, enum: CustomerSource, required: true })
  source: string

  @Prop({ type: Number, required: true })
  identifier_number: number

  @Prop({ type: Boolean })
  welcome_point: boolean

  @Prop({ type: Boolean })
  invitation: boolean

  @Prop({ type: Date })
  dob: Date

  @Prop({ type: Date })
  doa: Date

  @Prop({ type: Object })
  form_data?: Record<string, any>;

  @Prop({ type: String })
  influencer_type: string

  @Prop({ type: String })
  profile_status_remark: string;

  @Prop({ type: String })
  approved_type: string;

  @Prop({ type: String })
  referral_code: string;
}

const childSchema = SchemaFactory.createForClass(CustomerModel);
CustomerSchema.add(childSchema.obj);
export { CustomerSchema };
