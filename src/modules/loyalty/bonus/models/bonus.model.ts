import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { ParentSchema } from 'src/common/schema/parent.schema';
import { COLLECTION_CONST } from 'src/config/collection.constant';
@Schema({ collection: COLLECTION_CONST().CRM_BONUS })
export class Base extends Document {
}

const BonusSchema = SchemaFactory.createForClass(Base);
BonusSchema.add(ParentSchema.obj);
@Schema()
export class BonusModel extends Document {
  @Prop({ type: Number, required: true, index: true })
  org_id: number;

  @Prop({ type: String, required: true, minlength: 3, maxlength: 100 })
  title: string;

  @Prop({ type: [Types.ObjectId], required: true, ref: COLLECTION_CONST().CRM_CUSTOMERS, index: true })
  customer_type_id: Types.ObjectId[];

  @Prop({ type: [String] })
  customer_type_name: string[];

  @Prop({ type: String, required: true })
    country: string;

  @Prop({ type: Date, required: true, index: true })
  start_date: Date;

  @Prop({ type: Date, required: true, index: true })
  end_date: Date;

  @Prop({ type: [String], required: true })
  state: string[];

  @Prop({ type: [String], required: true })
  district: string[];

  @Prop({ type: String, enum: ['Active', 'Inactive'], default: 'Active', index: true })
  status: string;
}

const childSchema = SchemaFactory.createForClass(BonusModel);
BonusSchema.add(childSchema.obj);

export { BonusSchema };
