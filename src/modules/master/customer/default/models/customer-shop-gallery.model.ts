import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { ParentSchema } from 'src/common/schema/parent.schema';
import { COLLECTION_CONST } from 'src/config/collection.constant';

@Schema({ collection: COLLECTION_CONST().CRM_CUSTOMER_SHOP_GALLERY })
export class Base extends Document {}
const CustomerShopGallerySchema = SchemaFactory.createForClass(Base);
CustomerShopGallerySchema.add(ParentSchema.obj);

@Schema()
export class CustomerShopGalleryModel extends Document {

  @Prop({ type: Number })
  org_id: number;

  @Prop({ type: Types.ObjectId, required: true })
  customer_id: number;

  @Prop({ type: String, required: true })
  doc_label: string;

  @Prop({ type: String, required: true })
  doc_file: string;
}

const childSchema = SchemaFactory.createForClass(CustomerShopGalleryModel);
CustomerShopGallerySchema.add(childSchema.obj);
export { CustomerShopGallerySchema };
