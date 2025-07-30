import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { ParentSchema } from 'src/common/schema/parent.schema';
import { COLLECTION_CONST } from 'src/config/collection.constant';
@Schema({ collection: COLLECTION_CONST().CRM_BEAT_PLAN_TARGET })
export class Base extends Document { }
const BeatPlanTargetSchema = SchemaFactory.createForClass(Base);
BeatPlanTargetSchema.add(ParentSchema.obj);
@Schema()
export class BeatPlanTargetModel extends Document {

    @Prop({ type: Number })
    org_id: number;

    @Prop({ type: String, required: true })
    target_value: string;

}

const childSchema = SchemaFactory.createForClass(BeatPlanTargetModel);
BeatPlanTargetSchema.add(childSchema.obj);
export { BeatPlanTargetSchema };