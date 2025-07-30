import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { ParentSchema } from 'src/common/schema/parent.schema';
import { COLLECTION_CONST } from 'src/config/collection.constant';
import { ComplaintInvoiceStatus } from '../web/dto/complaint-invoice.dto';
@Schema({ collection: COLLECTION_CONST().CRM_COMPLAINT_INVOICE })
export class Base extends Document {
}
const ComplaintInvoiceSchema = SchemaFactory.createForClass(Base);
ComplaintInvoiceSchema.add(ParentSchema.obj);
@Schema()
export class ComplaintInvoiceModel extends Document {
  @Prop({ type: Number })
  org_id: number;

  @Prop({ type: String })
  invoice_no: string;

  @Prop({ type: Date, required: true })
  invoice_date: Date;

  @Prop({ type: String })
  payment_mode: string;

  @Prop({ type: String, required: true })
  service_type: string;

  @Prop({ type: String })
  transaction_number: string;

  @Prop({ type: Types.ObjectId, required: true })
  service_engineer_id: string;

  @Prop({ type: String, required: true })
  service_engineer_name: string;

  @Prop({ type: Types.ObjectId, required: true })
  customer_id: string;

  @Prop({ type: String, required: true })
  customer_name: string;

  @Prop({ type: String, required: true })
  customer_mobile: string;

  @Prop({ type: String, required: true })
  customer_address: string;

  @Prop({ type: Types.ObjectId, required: true })
  complaint_id: string;

  @Prop({ type: String, required: true })
  complaint_no: string;

  @Prop({ type: String, default: ComplaintInvoiceStatus.Paid })
  status: string;

  @Prop({ type: Number, required: true })
  sub_total: number;

  @Prop({ type: Number, required: true })
  net_amount: number;

  @Prop({ type: Number, required: true })
  total_discount: number;

  @Prop({ type: Number, required: true })
  total_items: number;

  @Prop({ type: Number, required: true })
  total_qty: number;
}
const childSchema = SchemaFactory.createForClass(ComplaintInvoiceModel);
ComplaintInvoiceSchema.add(childSchema.obj);
export { ComplaintInvoiceSchema };