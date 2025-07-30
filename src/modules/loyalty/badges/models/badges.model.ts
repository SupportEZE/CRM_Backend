import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { ParentSchema } from 'src/common/schema/parent.schema';
import { COLLECTION_CONST } from 'src/config/collection.constant';
import { preUpdateHook } from 'src/common/hooks/pre-update';

@Schema({ collection: COLLECTION_CONST().CRM_BADGES })
export class Base extends Document {
}
const BadgesSchema = SchemaFactory.createForClass(Base);
BadgesSchema.add(ParentSchema.obj);
@Schema()

export class BadgesModel extends Document {
  @Prop({ type: Number, required: true, index: true })
  org_id: number;

  @Prop({ type: String, required: true, index: 'text' })
  title: string;

  @Prop({ type: [Types.ObjectId], required: true, index: true })
  customer_type_id: Types.ObjectId[];

  @Prop({ type: [String], required: true })
  customer_type_name: string[];

  @Prop({ type: String, required: true, enum: ['Gift', 'Fixed Point'], default: 'Fixed Point' })
  incentive_type: string;

  @Prop({ type: String, required: true, })
  incentive_value: string;

  @Prop({ type: Number, required: true, })
  eligible_points: number;

  @Prop({ type: Date, required: true, index: true })
  start_date: Date;

  @Prop({ type: Date, required: true })
  end_date: Date;

  @Prop({ type: String, required: true, enum: ['Active', 'Inactive'], default: 'active', index: true })
  status: string;
}

const childSchema = SchemaFactory.createForClass(BadgesModel);
BadgesSchema.add(childSchema.obj);

BadgesSchema.pre('findOneAndUpdate', preUpdateHook);
BadgesSchema.pre('updateOne', preUpdateHook);
BadgesSchema.pre('updateMany', preUpdateHook);

export { BadgesSchema };


