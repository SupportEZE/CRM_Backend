
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { ParentSchema } from 'src/common/schema/parent.schema';
import { COLLECTION_CONST } from 'src/config/collection.constant';
@Schema({ collection: COLLECTION_CONST().CRM_OZONE_QUOTATION })
export class Base extends Document { }
const OzoneQuotationSchema = SchemaFactory.createForClass(Base);
OzoneQuotationSchema.add(ParentSchema.obj);

export enum OzoneQuotatioStatus {
  LOST = 'Lost',
  WIN = 'Win',
  PENDING = 'Pending'
}
@Schema()
export class OzoneCartItem extends Document {
  @Prop({ type: Types.ObjectId, required: true })
  product_id: Types.ObjectId;

  @Prop({ type: String })
  sap_code: string;

  @Prop({ type: String })
  uom: string;

  @Prop({ type: String, required: true })
  product_name: string;

  @Prop({ type: Number, required: true })
  qty: number;

  @Prop({ type: Number, required: true })
  price: number;

  @Prop({ type: Number })
  total_price: number;

  @Prop({ type: Number })
  discount_percent: number;

  @Prop({ type: Number })
  discount_amount: number;

  @Prop({ type: Number })
  sub_total: number;

  @Prop({ type: Number })
  net_amount: number;

  @Prop({ type: Number })
  gst_percent: number;

  @Prop({ type: Number })
  gst_amount: number;
}
const CartItemSchema = SchemaFactory.createForClass(OzoneCartItem);

@Schema()
export class OzoneQuotationModel extends Document {
  @Prop({ type: Number })
  org_id: number;

  @Prop({ type: Types.ObjectId, required: true })
  enquiry_id: Types.ObjectId;

  @Prop({ type: String })
  quotation_id: string;

  @Prop({ type: Date })
  followup_date: Date;

  @Prop({ type: String })
  remarks: string;

  @Prop({ type: String })
  note: string;

  @Prop({ type: Number })
  sub_total: number;

  @Prop({ type: Number })
  total_discount: number;

  @Prop({ type: Number })
  gst: number;

  @Prop({ type: Number })
  total_amount: number;

  @Prop({ type: String })
  platform: string;

  @Prop({ type: String })
  app_id: string;

  @Prop({ type: [String] })
  files: string[];

  @Prop({ type: String })
  status: string;

  @Prop({ type: [CartItemSchema], default: [] })
  cart_item: OzoneCartItem[];
}
const QuotationModelSchema = SchemaFactory.createForClass(OzoneQuotationModel);

OzoneQuotationSchema.add(QuotationModelSchema.obj);

export { OzoneQuotationSchema };
