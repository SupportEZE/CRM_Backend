import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { ParentSchema } from 'src/common/schema/parent.schema';
import { COLLECTION_CONST } from 'src/config/collection.constant';
@Schema({ collection: COLLECTION_CONST().CRM_PURCHASE_REQUEST })
export class Base extends Document {
}

export enum PurchaseStatus {
  Pending = 'Pending',
  Approved = 'Approved',
  Reject = 'Reject'
}
const PurchaseSchema = SchemaFactory.createForClass(Base);
PurchaseSchema.add(ParentSchema.obj);
@Schema()
export class PurchaseModel extends Document {
  @Prop({ type: Number, required: true, index: true })
  org_id: number;

  @Prop({ type: Number, required: true })
  login_type_id: number;

  @Prop({ type: Types.ObjectId, required: true })
  customer_type_id: Types.ObjectId;

  @Prop({ type: String, required: true })
  customer_type_name: string;

  @Prop({ type: Types.ObjectId, required: true })
  customer_id: Types.ObjectId;

  @Prop({ type: String, required: true })
  customer_name: string;

  @Prop({ type: String })
  purchase_from: string;

  @Prop({ type: String })
  purchase_from_name: string;

  @Prop({ type: String, required: true })
  bill_date: string;

  @Prop({ type: Number, required: true })
  bill_amount: number;

  @Prop({ type: String, required: true })
  bill_number: string;

  @Prop({ type: String })
  remark: string;

  @Prop({ type: String })
  reason: string;

  @Prop({ type: Number })
  total_item: number;

  @Prop({ type: Number })
  total_qty: number;

  @Prop({ type: Number })
  approved_point: number;

  @Prop({ type: String, default: PurchaseStatus.Pending })
  status: string;
}

const childSchema = SchemaFactory.createForClass(PurchaseModel);
PurchaseSchema.add(childSchema.obj);

export { PurchaseSchema };
