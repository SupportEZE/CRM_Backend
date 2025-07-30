import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types, Schema as MongooseSchema } from 'mongoose';
import { ParentSchema } from 'src/common/schema/parent.schema';
import { COLLECTION_CONST } from 'src/config/collection.constant';

@Schema({ collection: COLLECTION_CONST().CRM_CUSTOMER_OTHER_DETAIL })
export class Base extends Document { }
const CustomerOtherDetailSchema = SchemaFactory.createForClass(Base);
CustomerOtherDetailSchema.add(ParentSchema.obj);

@Schema()
export class CustomerOtherDetailModel extends Document {

  @Prop({ type: Number })
  org_id: number;

  @Prop({ type: Types.ObjectId, required: true })
  customer_id: Types.ObjectId;

  @Prop({ type: Number })
  lat: number;

  @Prop({ type: Number })
  long: number;

  @Prop({ type: Number })
  credit_days: number;

  @Prop({ type: Number })
  credit_limit: number;

  @Prop({ type: String })
  gst_number: string;

  @Prop({ type: Types.ObjectId })
  beat_code_id: Types.ObjectId;

  @Prop({ type: String })
  beat_code: string;

  @Prop({ type: String })
  beat_code_desc: string;
}

const childSchema = SchemaFactory.createForClass(CustomerOtherDetailModel);
CustomerOtherDetailSchema.add(childSchema.obj);

export { CustomerOtherDetailSchema };
