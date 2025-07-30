import { Prop, Schema, SchemaFactory, } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { ParentSchema } from 'src/common/schema/parent.schema';
import { COLLECTION_CONST } from 'src/config/collection.constant';
import { preUpdateHook } from 'src/common/hooks/pre-update';

@Schema({ collection: COLLECTION_CONST().CRM_QRCODES_GENERATOR })
export class Base extends Document { }
const QrcodeGeneratorSchema = SchemaFactory.createForClass(Base);
QrcodeGeneratorSchema.add(ParentSchema.obj);

@Schema()
export class QrcodeGeneratorModel extends Document {

  @Prop({ type: Number, required: true, index: true })
  org_id: number;

  @Prop({ type: Object, default: {} })
  created_data: Record<string, any>;

  @Prop({ type: Types.ObjectId, ref: COLLECTION_CONST().CRM_PRODUCTS, index: true })
  product_id: Types.ObjectId;

  @Prop({ type: Object, default: {} })
  product_data: Record<string, any>;

  @Prop({ type: Object, default: {} })
  dispatch_data: Record<string, any>;

  @Prop({ type: Number })
  mrp: number;

  @Prop({
    type: Types.ObjectId,
    ref: COLLECTION_CONST().CRM_POINT_CATEGORY,
    index: true,
  })
  point_category_id: Types.ObjectId;

  @Prop({ type: String, maxlength: 100 })
  point_category_name: string;

  @Prop({ type: String })
  batch_no: string;

  @Prop({
    type: String,
    required: true,
    enum: ['item', 'box', 'point_category'],
    index: true,
  })
  qrcode_type: string;

  @Prop({ type: Number, required: true, min: 1 })
  qrcode_qty: number;

  @Prop({ type: String, maxlength: 500 })
  remark: string;

  @Prop({ type: String, default: '25*25' })
  paper_size: string;

  @Prop({ type: String, default: 'Active' })
  status: string;

  @Prop({ type: Boolean, default: false })
  is_printed?: boolean;

  @Prop({ type: Object, default: {} })
  form_data?: Record<string, any>;
}

const childSchema = SchemaFactory.createForClass(QrcodeGeneratorModel);
QrcodeGeneratorSchema.add(childSchema.obj);

QrcodeGeneratorSchema.pre('findOneAndUpdate', preUpdateHook);
QrcodeGeneratorSchema.pre('updateOne', preUpdateHook);
QrcodeGeneratorSchema.pre('updateMany', preUpdateHook);

export { QrcodeGeneratorSchema };
