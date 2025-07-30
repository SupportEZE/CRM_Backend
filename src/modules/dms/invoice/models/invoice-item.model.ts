import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { ParentSchema } from 'src/common/schema/parent.schema';
import { COLLECTION_CONST } from 'src/config/collection.constant';
import { preUpdateHook } from 'src/common/hooks/pre-update';
@Schema({ collection: COLLECTION_CONST().CRM_INVOICE_ITEM })
export class Base extends Document {
}
const InvoiceItemSchema = SchemaFactory.createForClass(Base);
InvoiceItemSchema.add(ParentSchema.obj);
@Schema()
export class InvoiceItemModel extends Document {

  @Prop({ type: Number, required: true })
  org_id: number;

  @Prop({ type: Types.ObjectId, required: true })
  invoice_id: Types.ObjectId;

  @Prop({ type: Types.ObjectId, required: true })
  product_id: Types.ObjectId;

  @Prop({ type: String })
  product_name: string;

  @Prop({ type: String })
  product_code: string;

  @Prop({ type: Number })
  total_quantity: number;

  @Prop({ type: Number })
  grn_quantity: number;

  @Prop({ type: Number })
  unit_price: number;

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
}

const childSchema = SchemaFactory.createForClass(InvoiceItemModel);
InvoiceItemSchema.add(childSchema.obj);

InvoiceItemSchema.pre('findOneAndUpdate', preUpdateHook);
InvoiceItemSchema.pre('updateOne', preUpdateHook);
InvoiceItemSchema.pre('updateMany', preUpdateHook);

export { InvoiceItemSchema };
