import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { ParentSchema } from 'src/common/schema/parent.schema';
import { COLLECTION_CONST } from 'src/config/collection.constant';
import { preUpdateHook } from 'src/common/hooks/pre-update';

@Schema({ collection: COLLECTION_CONST().CRM_INVOICE_BILLING })
export class Base extends Document {
}

const InvoiceBillingSchema = SchemaFactory.createForClass(Base);
InvoiceBillingSchema.add(ParentSchema.obj);
@Schema()
export class InvoiceModel extends Document {

  @Prop({ type: Number, required: true })
  org_id: number;

  @Prop({ type: Number, required: true })
  login_type_id: number;

  @Prop({ type: Types.ObjectId })
  customer_type_id: Types.ObjectId;

  @Prop({ type: String })
  customer_type_name: string;

  @Prop({ type: Types.ObjectId })
  customer_id: Types.ObjectId;

  @Prop({ type: String })
  customer_code: string;

  @Prop({ type: String })
  customer_name: string;

  @Prop({ type: String, unique: true })
  invoice_number: string;

  @Prop({ type: Date })
  billing_date: Date;

  @Prop({ type: Number })
  total_item_count: number;

  @Prop({ type: Number })
  total_item_quantity: number;

  @Prop({ type: Number })
  gross_amount: number;

  @Prop({ type: Number })
  discount_percent: number;

  @Prop({ type: Number })
  discount_amount: number;

  @Prop({ type: Number })
  net_amount_before_tax: number;

  @Prop({ type: Number })
  gst_percent: number;

  @Prop({ type: Number })
  gst_amount: number;

  @Prop({ type: Number })
  net_amount_with_tax: number;

  @Prop({ type: String })
  order_number: string;

  @Prop({ type: String, default: 'Pending' })
  grn_status: string;

  @Prop({ type: String })
  remarks: string;
}


const childSchema = SchemaFactory.createForClass(InvoiceModel);
InvoiceBillingSchema.add(childSchema.obj);

InvoiceBillingSchema.pre('findOneAndUpdate', preUpdateHook);
InvoiceBillingSchema.pre('updateOne', preUpdateHook);
InvoiceBillingSchema.pre('updateMany', preUpdateHook);

export { InvoiceBillingSchema };
