import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { ParentSchema } from 'src/common/schema/parent.schema';
import { COLLECTION_CONST } from 'src/config/collection.constant';
@Schema({ collection: COLLECTION_CONST().CRM_BEAT_PLAN })
export class Base extends Document { }
const BeatPlanSchema = SchemaFactory.createForClass(Base);
BeatPlanSchema.add(ParentSchema.obj);
@Schema()
export class BeatPlanModel extends Document {

  @Prop({ type: Number })
  org_id: number;

  @Prop({ type: Date, required: true })
  date: Date;

  @Prop({ type: Types.ObjectId, required: true })
  user_id: string;

  @Prop({ type: String })
  user_name: string;

  @Prop({ type: String })
  user_mobile: string;

  @Prop({ type: String })
  day: string;

  @Prop({ type: String, required: true })
  beat_code: string;

  @Prop({ type: String, required: true })
  description: string;

}

const childSchema = SchemaFactory.createForClass(BeatPlanModel);
BeatPlanSchema.add(childSchema.obj);
export { BeatPlanSchema };