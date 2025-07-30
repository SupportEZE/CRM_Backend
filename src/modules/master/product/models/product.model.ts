import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';
import { ParentSchema } from 'src/common/schema/parent.schema';
import { COLLECTION_CONST } from 'src/config/collection.constant';

@Schema({ collection: COLLECTION_CONST().CRM_PRODUCTS })
export class Base extends Document { }
const ProductSchema = SchemaFactory.createForClass(Base);
ProductSchema.add(ParentSchema.obj);

@Schema()
export class ProductModel extends Document {

  @Prop({ type: Number, required: true, index: true })
  org_id: number;

  @Prop({ type: String, required: true, maxlength: 100 })
  category_name: string;

  @Prop({ type: String, maxlength: 100 })
  sub_category: string;

  @Prop({ type: String, required: true, maxlength: 500 })
  product_name: string;

  @Prop({ type: String, required: true, unique: true, maxlength: 100, index: true })
  product_code: string;

  @Prop({ type: String})
  uom: string;

  @Prop({ type: MongooseSchema.Types.Mixed })
  form_data?: Record<string, any>;

  @Prop({
    type: String,
    enum: ['Active', 'Inactive'],
    default: 'Active',
    index: true,
  })
  status: string;

  @Prop({ type: Number })
  box_size?: number;

  @Prop({ type: Number })
  gst_percent?: number;
}

const childSchema = SchemaFactory.createForClass(ProductModel);
ProductSchema.add(childSchema.obj);
export { ProductSchema };
