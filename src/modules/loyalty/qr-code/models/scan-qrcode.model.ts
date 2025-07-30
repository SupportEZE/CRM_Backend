import { Prop, Schema, SchemaFactory, } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { ParentSchema } from 'src/common/schema/parent.schema';
import { COLLECTION_CONST } from 'src/config/collection.constant';
import { preUpdateHook } from 'src/common/hooks/pre-update';

@Schema({ collection: COLLECTION_CONST().CRM_SCAN_QRCODES })
export class Base extends Document { }
const ScanQrcodeSchema = SchemaFactory.createForClass(Base);
ScanQrcodeSchema.add(ParentSchema.obj);

@Schema()
export class ScanQrcodeModel extends Document {
  @Prop({ type: Number, required: true, index: true })
  org_id: number;

  @Prop({ type: Types.ObjectId, index: true })
  scanned_id: Types.ObjectId;

  @Prop({ type: String, required: true })
  scanned_name: string;

  @Prop({ type: Object, required: true })
  qr_id: Record<string, any>;

  @Prop({ type: String, required: true, index: true })
  qr_code: string;

  @Prop({ type: String, index: true })
  box_qr_code: string;

  @Prop({
    type: String,
    required: true,
    enum: ['item', 'box', 'point_category'],
    index: true,
  })
  qrcode_type: string;

  @Prop({
    type: String,
    required: true,
    enum: ['item', 'box', 'point_category'],
    index: true,
  })
  scan_type: string;

  @Prop({ type: String })
  point_category_name: string;

  @Prop({ type: Types.ObjectId, ref: COLLECTION_CONST().CRM_POINT_CATEGORY, index: true })
  point_category_id: Types.ObjectId;

  @Prop({ type: Types.ObjectId, required: true, ref: 'LoginType', index: true })
  login_type_id: Types.ObjectId;

  @Prop({ type: Types.ObjectId, required: true, ref: 'CustomerType', index: true })
  customer_type_id: Types.ObjectId;

  @Prop({ type: String, required: true })
  customer_type_name: string;

  @Prop({ type: String, required: true })
  customer_mobile: string;

  @Prop({ type: Types.ObjectId, ref: COLLECTION_CONST().CRM_PRODUCTS, index: true })
  product_id: Types.ObjectId;

  @Prop({ type: String })
  product_name: string;

  @Prop({ type: String })
  product_code: string;

  @Prop({ type: Number, default: 0 })
  total_points: number;

  @Prop({ type: Number, default: 0 })
  bonus_points: number;

  @Prop({ type: Types.ObjectId })
  bonus_id: Types.ObjectId;

  @Prop({ type: String, required: true })
  transaction_id: string;

  @Prop({ type: String, required: true })
  state: string;

  @Prop({ type: Number, required: true })
  lattitude: number;

  @Prop({ type: Number, required: true })
  longitude: number;

  @Prop({ type: Boolean, default: false })
  is_manual_scan: boolean;
}
const childSchema = SchemaFactory.createForClass(ScanQrcodeModel);
ScanQrcodeSchema.add(childSchema.obj);

ScanQrcodeSchema.index({ scanned_id: 1, qr_code: 1 }, { unique: true });

ScanQrcodeSchema.pre('findOneAndUpdate', preUpdateHook);
ScanQrcodeSchema.pre('updateOne', preUpdateHook);
ScanQrcodeSchema.pre('updateMany', preUpdateHook);
export { ScanQrcodeSchema };
