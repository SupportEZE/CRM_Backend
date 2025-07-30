import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { ParentSchema } from 'src/common/schema/parent.schema';
import { COLLECTION_CONST } from 'src/config/collection.constant';
import { preUpdateHook } from 'src/common/hooks/pre-update';

@Schema({ collection: COLLECTION_CONST().CRM_UNPAID_INVOICE_BILLING })
export class Base extends Document {
}

const UnpaidInvoiceBillingSchema = SchemaFactory.createForClass(Base);
UnpaidInvoiceBillingSchema.add(ParentSchema.obj);
@Schema()
export class UnpaidInvoiceModel extends Document {

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
  net_amount: number;

  @Prop({ type: Number })
  received_amount: number;
}


const childSchema = SchemaFactory.createForClass(UnpaidInvoiceModel);
UnpaidInvoiceBillingSchema.add(childSchema.obj);

UnpaidInvoiceBillingSchema.pre('findOneAndUpdate', preUpdateHook);
UnpaidInvoiceBillingSchema.pre('updateOne', preUpdateHook);
UnpaidInvoiceBillingSchema.pre('updateMany', preUpdateHook);

export { UnpaidInvoiceBillingSchema };
