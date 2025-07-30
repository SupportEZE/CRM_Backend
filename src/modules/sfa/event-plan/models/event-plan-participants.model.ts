import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { ParentSchema } from 'src/common/schema/parent.schema';
import { COLLECTION_CONST } from 'src/config/collection.constant';
@Schema({ collection: COLLECTION_CONST().CRM_EVENT_PLAN_PARTICIPANT })
export class Base extends Document { }
const EventPlanParticipantSchema = SchemaFactory.createForClass(Base);
EventPlanParticipantSchema.add(ParentSchema.obj);
@Schema()
export class EventPlanParticipantModel extends Document {

    @Prop({ type: Number })
    org_id: number;

    @Prop({ type: Types.ObjectId })
    event_plan_id: Date;

    @Prop({ type: String, required: true })
    name: string;

    @Prop({ type: String, required: true })
    mobile: string;

    @Prop({ type: String })
    status: string;

}

const childSchema = SchemaFactory.createForClass(EventPlanParticipantModel);
EventPlanParticipantSchema.add(childSchema.obj);
export { EventPlanParticipantSchema };