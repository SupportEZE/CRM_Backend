import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { ParentSchema } from 'src/common/schema/parent.schema';
import { COLLECTION_CONST } from 'src/config/collection.constant';
import { preUpdateHook } from 'src/common/hooks/pre-update';
@Schema({ collection: COLLECTION_CONST().CRM_BANNER })
export class Base extends Document {
}

const BannerSchema = SchemaFactory.createForClass(Base);
BannerSchema.add(ParentSchema.obj);
@Schema()
export class BannerModel extends Document {

  @Prop({ type: Number, required: true, min: 1 })
  org_id: number;

  @Prop({ type: [Number], min: 1, default: [] })
  login_type_id: number[];

  @Prop({ type: [String], default: [] })
  login_type_name: string[];

  @Prop({ type: [String], default: [] })
  customer_type_name: string[];

  @Prop({ type: Types.ObjectId, default: null })
  customer_type_id: string;

  @Prop({ type: String, required: true })
  country: string;

  @Prop({ type: Object, default: {} })
  form_data: Record<string, any>;
}

const childSchema = SchemaFactory.createForClass(BannerModel);
BannerSchema.add(childSchema.obj);

BannerSchema.pre('findOneAndUpdate', preUpdateHook);
BannerSchema.pre('updateOne', preUpdateHook);
BannerSchema.pre('updateMany', preUpdateHook);

export { BannerSchema };