import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { ParentSchema } from 'src/common/schema/parent.schema';
import { COLLECTION_CONST } from 'src/config/collection.constant';

@Schema({ collection: COLLECTION_CONST().CRM_GIFT_GALLERY })
export class Base extends Document {
}

const GiftGallerySchema = SchemaFactory.createForClass(Base);
GiftGallerySchema.add(ParentSchema.obj);
@Schema()
export class GiftGalleryModel extends Document {
  @Prop({ type: Number, required: true, index: true })
  org_id: number;

  @Prop({ type: Number, required: true, index: true })
  login_type_id: number;

  @Prop({ type: [Types.ObjectId], required: true, ref: COLLECTION_CONST().CRM_CUSTOMERS, index: true })
  customer_type_id: Types.ObjectId[];

  @Prop({ type: Types.ObjectId, index: true })
  voucher_type_id: Types.ObjectId;

  @Prop({ type: [String] })
  customer_type_name: string[];

  @Prop({ type: String, required: true, enum: ['Cash', 'Gift', 'Voucher'], index: true })
  gift_type: string;

  @Prop({ type: String, required: true, minlength: 3, maxlength: 100 })
  title: string;

  @Prop({ type: Date, index: true })
  date_from: Date;

  @Prop({ type: Date, index: true })
  date_to: Date;

  @Prop({ type: Number, min: 0 })
  range_start: number;

  @Prop({ type: Number, min: 0 })
  range_end: number;

  @Prop({ type: Number, required: true, min: 0 })
  point_value: number;

  @Prop({ type: String, default: 'Active', enum: ['Active', 'Inactive'], index: true })
  status: string;

  @Prop({ type: String, maxlength: 2000 })
  description: string;
}

const childSchema = SchemaFactory.createForClass(GiftGalleryModel);
GiftGallerySchema.add(childSchema.obj);

export { GiftGallerySchema };
