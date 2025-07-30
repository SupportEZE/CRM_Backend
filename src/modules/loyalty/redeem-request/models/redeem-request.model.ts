import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { ParentSchema } from 'src/common/schema/parent.schema';
import { COLLECTION_CONST } from 'src/config/collection.constant';
import { preUpdateHook } from 'src/common/hooks/pre-update';

export enum RedeemRequestStatus {
  PENDING = 'Pending',
  APPROVED = 'Approved',
  REJECT = 'Reject',
}

export enum TransferStatus {
  PENDING = 'Pending',
  APPROVED = 'Approved',
  REJECT = 'Reject',
}

@Schema({ collection: COLLECTION_CONST().CRM_REDEEM_REQUEST })
export class Base extends Document {
}

const RedeemRequestSchema = SchemaFactory.createForClass(Base);
RedeemRequestSchema.add(ParentSchema.obj);
@Schema()
export class RedeemRequestModel extends Document {
  @Prop({ type: Number, required: true, index: true })
  org_id: number;

  @Prop({ type: Types.ObjectId, required: true, index: true })
  gift_id: Types.ObjectId;

  @Prop({ type: String, required: true, minlength: 3, maxlength: 100 })
  title: string;

  @Prop({ type: String, maxlength: 500 })
  gift_shipping_address: string;

  @Prop({ type: Types.ObjectId, required: true, index: true })
  customer_id: Types.ObjectId;

  @Prop({ type: String, required: true })
  customer_name: string;

  @Prop({ type: String, required: true, minlength: 10, maxlength: 15 })
  customer_mobile: string;

  @Prop({ type: Number, required: true })
  login_type_id: number;

  @Prop({ type: Types.ObjectId, required: true, index: true })
  customer_type_id: Types.ObjectId;

  @Prop({ type: String, required: true })
  customer_type_name: string;

  @Prop({ type: String, required: true, enum: ['Cash', 'Gift', 'Voucher'] })
  gift_type: string;

  @Prop({ type: String, enum: ['BANK', 'UPI'] })
  payment_mode: string;

  @Prop({ type: String })
  req_id: string;

  @Prop({ type: String })
  transfer_date: string;

  @Prop({ type: String, required: true, enum: TransferStatus })
  transfer_status: TransferStatus;

  @Prop({ type: String })
  transfer_remark: string;

  @Prop({ type: String })
  transfer_type: string;

  @Prop({ type: String })
  transaction_no: string;

  @Prop({ type: Date })
  transaction_date: Date;

  @Prop({ type: String })
  account_no: string;

  @Prop({ type: String })
  shipping_type: string;

  @Prop({ type: String })
  upi_id: string;

  @Prop({ type: String })
  ifsc_code: string;

  @Prop({ type: String })
  bank_name: string;

  @Prop({ type: String })
  voucher_code: string;

  @Prop({ type: String })
  beneficiary_name: string;

  @Prop({ type: String, required: true, enum: RedeemRequestStatus, default: RedeemRequestStatus.PENDING })
  status: RedeemRequestStatus;

  @Prop({ type: String })
  status_reason: string;

  @Prop({ type: String })
  shipped_date: string;

  @Prop({ type: String })
  shipping_address: string;

  @Prop({ type: String })
  shipping_courier: string;

  @Prop({ type: String })
  shipping_tracking: string;

  @Prop({ type: String })
  recieved_date: string;

  @Prop({ type: Number, min: 0 })
  claim_point: number;

  @Prop({ type: Number, min: 0 })
  cash_value: number;

  @Prop({ type: Number, min: 0 })
  point_value: number;

  @Prop({ type: String })
  state: string;

  @Prop({ type: String })
  district: string;
}

const childSchema = SchemaFactory.createForClass(RedeemRequestModel);
RedeemRequestSchema.add(childSchema.obj);

RedeemRequestSchema.pre('findOneAndUpdate', preUpdateHook);
RedeemRequestSchema.pre('updateOne', preUpdateHook);
RedeemRequestSchema.pre('updateMany', preUpdateHook);

export { RedeemRequestSchema };
