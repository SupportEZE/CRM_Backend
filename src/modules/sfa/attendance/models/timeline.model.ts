import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { preUpdateHook } from 'src/common/hooks/pre-update';
import { ParentSchema } from 'src/common/schema/parent.schema';
import { COLLECTION_CONST } from 'src/config/collection.constant';

export const enum TimelineType{
    ATTENDANCE='Attendance'
}

@Schema({ collection: COLLECTION_CONST().CRM_TIMELINE })
export class Base extends Document { }
const TimelineSchema = SchemaFactory.createForClass(Base);
TimelineSchema.add(ParentSchema.obj);

@Schema()
export class TimelineModel extends Document {
    @Prop({ type: Number })
    org_id: number;

    @Prop({ type: Types.ObjectId, required: true })
    user_id: Types.ObjectId;

    @Prop({ type: Date })
    date: Date;

    @Prop({ type: String })
    type: string;

    @Prop({ type: Object })
    timeline: Record<string,any>;

    @Prop({ type: Number })
    data_size: number;
}

const childSchema = SchemaFactory.createForClass(TimelineModel);
TimelineSchema.add(childSchema.obj);
TimelineSchema.pre('findOneAndUpdate', preUpdateHook);
TimelineSchema.pre('updateOne', preUpdateHook);
TimelineSchema.pre('updateMany', preUpdateHook);
export { TimelineSchema };