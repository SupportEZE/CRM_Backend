import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { ParentSchema } from 'src/common/schema/parent.schema';
import { COLLECTION_CONST } from 'src/config/collection.constant';

export enum OzoneEnquiryStatus {
  ENQUIRY = 'Enquiry',
  WIN = 'Win',
  LOST = 'Lost',
  LEAD = 'Lead',
  MEETING = 'Meeting',
  SHOWROOM_VISIT = 'Showroom Visit',
  SITE_VISIT = 'Site Visit',
  QUOTATION = 'Quotation',
}
export enum EnquiryAssignedType {
  Distributor = 'OB Partner',
  User = 'Sales User',
  ReportingManager = 'Sales Head',
}

export enum EnquiryTypeTemp {
  Distributor = 'Distributor',
}

@Schema({ collection: COLLECTION_CONST().CRM_OZONE_ENQUIRY })
export class Base extends Document {}
const OzoneEnquirySchema = SchemaFactory.createForClass(Base);
OzoneEnquirySchema.add(ParentSchema.obj);

@Schema()
export class OzoneEnquiryModel extends Document {
  // Customer Details
  @Prop({ type: String, required: true })
  contact_number: string;

  @Prop({ type: String, required: true })
  customer_name: string;

  @Prop({ type: String, required: true })
  customer_type: string;

  @Prop({ type: String })
  company_name: string;

  @Prop({ type: String })
  alternate_mobile_no: string;

  @Prop({ type: String })
  email: string;

  @Prop({ type: String, required: true })
  pincode: string;

  @Prop({ type: String, required: true })
  district: string;

  @Prop({ type: String })
  city: string;

  @Prop({ type: String, required: true })
  state: string;

  @Prop({ type: String, required: true })
  country: string;

  @Prop({ type: String })
  address: string;

  @Prop({ type: String })
  site_pincode: string;

  @Prop({ type: String })
  site_city: string;

  @Prop({ type: String })
  site_state: string;

  @Prop({ type: String })
  site_country: string;

  @Prop({ type: String })
  site_address: string;

  @Prop({ type: String, required: true })
  mode_of_enquiry: string;

  @Prop({ type: String })
  mode_of_enquiry_other: string;

  @Prop({ type: [String], required: true })
  product_type_required: string[];

  @Prop({ type: String })
  product_type_required_other: string;

  @Prop({ type: String, required: true })
  type_of_project: string;

  @Prop({ type: String })
  type_of_project_other: string;

  @Prop({ type: String, required: true })
  building_type: string;

  @Prop({ type: Number })
  approximate_quantity: number;

  @Prop({ type: String })
  approx_value: string;

  @Prop({ type: String })
  location_of_installation: string;

  @Prop({ type: String })
  special_requirements: string;

  @Prop({ type: [String] })
  files: string[];

  @Prop({ type: String })
  enquiry_id: string;

  @Prop({ type: String })
  old_lead_id: string;

  @Prop({ type: String })
  status: string;

  @Prop({ type: String })
  reason: string;

  @Prop({ type: Types.ObjectId })
  visit_activity_id: Types.ObjectId;

  @Prop({ type: Object })
  form_data?: Record<string, any>;

  @Prop({ type: String })
  enquiry_remarks: string;

  @Prop({ type: String })
  lost_remarks: string;

  @Prop({ type: String })
  lead_remarks: string;

  @Prop({ type: String })
  meeting_remarks: string;

  @Prop({ type: String })
  showroom_visit_remarks: string;

  @Prop({ type: String })
  site_visit_remarks: string;

  @Prop({ type: String })
  quotation_remarks: string;

  @Prop({ type: Date })
  enquiry_followup_date: Date;

  @Prop({ type: Date })
  lost_followup_date: Date;

  @Prop({ type: Date })
  lead_followup_date: Date;

  @Prop({ type: Date })
  meeting_followup_date: Date;

  @Prop({ type: Date })
  showroom_visit_followup_date: Date;

  @Prop({ type: Date })
  site_visit_followup_date: Date;

  @Prop({ type: Date })
  quotation_followup_date: Date;

  @Prop({ type: String })
  created_by_type: string;

  @Prop({ type: String })
  name: string;

  @Prop({ type: String })
  technical_designation: string;

  @Prop({ type: Date })
  win_date: Date;
  @Prop({
    type: [
      {
        _id: false,
        assigned_to_id: { type: Types.ObjectId },
        assigned_to_name: { type: String },
        assigned_to_type: { type: String },
        assigned_to_date: { type: Date },
      },
    ],
    default: [],
  })
  assigned_to: {
    assigned_to_id: Types.ObjectId;
    assigned_to_name: string;
    assigned_to_type: string;
    assigned_to_date: Date;
  }[];
}

const childSchema = SchemaFactory.createForClass(OzoneEnquiryModel);
OzoneEnquirySchema.add(childSchema.obj);

export { OzoneEnquirySchema };
