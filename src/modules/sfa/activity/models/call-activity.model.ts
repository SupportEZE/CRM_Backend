import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema, Types } from 'mongoose';
import { ParentSchema } from 'src/common/schema/parent.schema';
import { COLLECTION_CONST } from 'src/config/collection.constant';

@Schema({ collection: COLLECTION_CONST().CRM_CALL_ACTIVITY })
export class Base extends Document { }
const CallActivitySchema = SchemaFactory.createForClass(Base);
CallActivitySchema.add(ParentSchema.obj);

@Schema()
export class CallActivityModel extends Document {
    @Prop({ type: Number })
    org_id: number;

    @Prop({ type: String })
    module_name: string;

    @Prop({ type: Types.ObjectId })
    module_id: string;

    @Prop({ type: Types.ObjectId })
    user_id: string;

    @Prop({ type: Types.ObjectId, ref: 'Customer' })
    customer_id: Types.ObjectId;

    @Prop({ type: Object })
    customer_details?: Record<string, any>;

    @Prop({ type: String })
    activity_type: string;

    @Prop({ type: Date })
    activity_date: Date;

    @Prop({ type: String })
    call_recording: string;

    @Prop({ type: Date })
    call_start: Date;

    @Prop({ type: Date })
    call_end: Date;

    @Prop({ type: Object })
    form_data?: Record<string, any>;
}

const childSchema = SchemaFactory.createForClass(CallActivityModel);
CallActivitySchema.add(childSchema.obj);

export { CallActivitySchema };