import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { ParentSchema } from 'src/common/schema/parent.schema';
import { COLLECTION_CONST } from 'src/config/collection.constant';

@Schema({ collection: COLLECTION_CONST().CRM_BACKGROUND_LOCATION })
export class Base extends Document { }
const BackgroundLocationSchema = SchemaFactory.createForClass(Base);
BackgroundLocationSchema.add(ParentSchema.obj);

@Schema()
export class BackgroundLocationModel extends Document {
    @Prop({ type: Number })
    org_id: number;

    @Prop({ type: Types.ObjectId, required: true })
    user_id: Types.ObjectId;

    @Prop({ type: Date })
    attend_date: Date;

    @Prop({ type: Date })
    activity_date: Date;

    @Prop({ type: Number })
    latitude: number;

    @Prop({ type: Number })
    longitude: number;

    @Prop({ type: Number })
    speed: number;

    @Prop({ type: Number })
    heading: number;

    @Prop({ type: Number })
    accuracy: number;

    @Prop({ type: Number })
    altitude: number;

    @Prop({ type: Number })
    altitude_accuracy: number;

    @Prop({ type: Number })
    heading_accuracy: number;

    @Prop({ type: Number })
    speed_accuracy: number;

    @Prop({ type: Number })
    timestamp: number;

    @Prop({ type: String })
    uuid: string;

    @Prop({ type: String })
    event: string;

    @Prop({ type: Number })
    odometer: number;

    @Prop({ type: String })
    activity_type: string;

    @Prop({ type: Number })
    activity_confidence: number;

    @Prop({ type: Number })
    battery_level: number;

    @Prop({ type: Boolean })
    battery_is_charging: boolean;

    @Prop({ type: Boolean })
    mock: boolean;

    @Prop({ type: Boolean })
    is_moving: boolean;

    @Prop({ type: Object })
    customer_details?: Record<string, any>;
}

const childSchema = SchemaFactory.createForClass(BackgroundLocationModel);
BackgroundLocationSchema.add(childSchema.obj);
export { BackgroundLocationSchema };