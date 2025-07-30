import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';
import { preUpdateHook } from 'src/common/hooks/pre-update';
import { ParentSchema } from 'src/common/schema/parent.schema';
import { COLLECTION_CONST } from 'src/config/collection.constant';

export enum PriceType {
  PRICE = 'Mrp',
  NET_PRICE = 'Net Price',
  ZONE_WISE_PRICE = 'Zone Wise',
  ZONE_WISE_NET_PRICE = 'Zone Wise Net Price',
}

@Schema({ collection: COLLECTION_CONST().CRM_PRODUCT_PRICE })
export class Base extends Document { }
const ProductPriceSchema = SchemaFactory.createForClass(Base);
ProductPriceSchema.add(ParentSchema.obj);

@Schema()
export class ProductPriceModel extends Document {

  @Prop({ type: Number, required: true })
  org_id: number;

  @Prop({ type: String, enum: PriceType, required: true })
  price_type: PriceType;

  @Prop({ type: MongooseSchema.Types.ObjectId, required: true, ref: COLLECTION_CONST().CRM_PRODUCTS })
  product_id: MongooseSchema.Types.ObjectId;

  @Prop({ required: true, type: MongooseSchema.Types.Mixed })
  form_data: Record<string, any> | any[];
}

const childSchema = SchemaFactory.createForClass(ProductPriceModel);
ProductPriceSchema.add(childSchema.obj);
ProductPriceSchema.pre('findOneAndUpdate', preUpdateHook);
ProductPriceSchema.pre('updateOne', preUpdateHook);
ProductPriceSchema.pre('updateMany', preUpdateHook);
export { ProductPriceSchema };
