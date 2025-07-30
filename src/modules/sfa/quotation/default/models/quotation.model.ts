import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { ParentSchema } from 'src/common/schema/parent.schema';
import { COLLECTION_CONST } from 'src/config/collection.constant';

@Schema({ collection: COLLECTION_CONST().CRM_QUOTATION })
export class Base extends Document { }
const QuotationSchema = SchemaFactory.createForClass(Base);
QuotationSchema.add(ParentSchema.obj);


@Schema()
export class CartItem extends Document {
  @Prop({ type: Types.ObjectId, required: true })
  product_id: Types.ObjectId;

  @Prop({ type: String, required: true })
  product_name: string;

  @Prop({ type: Number, required: true })
  qty: number;

  @Prop({ type: Number, required: true })
  price: number;

  @Prop({ type: Number, required: true })
  total_price: number;

  @Prop({ type: Number, required: true })
  discount_percent: number;

  @Prop({ type: Number, required: true })
  discount_amount: number;

  @Prop({ type: Number })
  gst_percent: number;

  @Prop({ type: Number })
  gst_amount: number;

  @Prop({ type: Number, required: true })
  sub_total: number;

  @Prop({ type: Number, required: true })
  net_amount: number;

  @Prop({ type: String })
  description: string;
}
const CartItemSchema = SchemaFactory.createForClass(CartItem);

@Schema()
export class QuotationModel extends Document {
  @Prop({ type: Number })
  org_id: number;

  @Prop({ type: String, required: true })
  title: string;

  @Prop({ type: String, required: true })
  quotation_type: string;

  @Prop({ type: Number, required: true })
  module_id: number;

  @Prop({ type: String, required: true })
  module_name: string;

  @Prop({ type: String })
  quotation_id: string;

  @Prop({ type: String })
  customer_type_name: string;

  @Prop({ type: Types.ObjectId })
  customer_type_id: Types.ObjectId;

  @Prop({ type: Types.ObjectId, required: true })
  customer_id: Types.ObjectId;

  @Prop({ type: String, required: true })
  customer_name: string;

  @Prop({ type: Date })
  followup_date: Date;

  @Prop({ type: Number })
  sub_total: number;

  @Prop({ type: Number })
  total_discount: number;

  @Prop({ type: Number })
  gst: number;

  @Prop({ type: Number })
  total_amount: number;

  @Prop({ type: String, default: 'Pending' })
  status: string;

  @Prop({ type: String, default: '' })
  stage: string;

  @Prop({ type: String, required: true })
  payment_term: string;

  @Prop({ type: String, required: true })
  note: string;

  @Prop({ type: String })
  reason: string;

  @Prop({ type: Date })
  valid_upto: Date;

  @Prop({ type: [CartItemSchema], default: [] })
  cart_item: CartItem[];
}
const QuotationModelSchema = SchemaFactory.createForClass(QuotationModel);

// Add QuotationModelSchema into main QuotationSchema
QuotationSchema.add(QuotationModelSchema.obj);

export { QuotationSchema };
