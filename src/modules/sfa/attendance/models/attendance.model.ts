import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema, Types } from 'mongoose';
import { preUpdateHook } from 'src/common/hooks/pre-update';
import { ParentSchema } from 'src/common/schema/parent.schema';
import { COLLECTION_CONST } from 'src/config/collection.constant';
@Schema({ collection: COLLECTION_CONST().CRM_ATTENDANCE })
export class Base extends Document { }
const AttendanceSchema = SchemaFactory.createForClass(Base);
AttendanceSchema.add(ParentSchema.obj);

@Schema()
export class AttendanceModel extends Document {
    @Prop({ type: Number })
    org_id: number;

    @Prop({ type: Types.ObjectId })
    user_id: string;

    @Prop({ type: Date })
    attend_date: Date;

    @Prop({ type: Date })
    punch_in: Date;

    @Prop({ type: Date })
    punch_out: Date;

    @Prop({ type: Number })
    start_lat: string;

    @Prop({ type: Number })
    start_lng: number;

    @Prop({ type: Number})
    stop_lat: number;

    @Prop({ type: Number })
    stop_lng: number;

    @Prop({ type: String, maxlength: 500 })
    start_address: string;

    @Prop({ type: String, maxlength: 500 })
    stop_address: string;

    @Prop({ type: String})
    total_hours: string;

    @Prop({ type: Object })
    form_data?: Record<string, any>;
}

const childSchema = SchemaFactory.createForClass(AttendanceModel);
AttendanceSchema.add(childSchema.obj);
AttendanceSchema.pre('findOneAndUpdate', preUpdateHook);
AttendanceSchema.pre('updateOne', preUpdateHook);
AttendanceSchema.pre('updateMany', preUpdateHook);
export { AttendanceSchema };