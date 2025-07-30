import { Prop, Schema, SchemaFactory, } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { ParentSchema } from 'src/common/schema/parent.schema';
import { COLLECTION_CONST } from 'src/config/collection.constant';
import { preUpdateHook } from 'src/common/hooks/pre-update';

@Schema({ collection: COLLECTION_CONST().CRM_SPIN_WIN })
export class Base extends Document { }
const SpinWInSchema = SchemaFactory.createForClass(Base);
SpinWInSchema.add(ParentSchema.obj);

export enum SpinWinStatus {
    ACTIVE = 'Active',
    INACTIVE = 'Inactive',
}
@Schema()
export class SpinWinModel extends Document {

    @Prop({ type: Number, required: true, index: true })
    org_id: number;

    @Prop({ type: Number, required: true, min: 1 })
    eligible_days: number;

    @Prop({ type: [Types.ObjectId], required: true, index: true })
    customer_type_id: Types.ObjectId[];

    @Prop({ type: Object, required: true })
    customer_type_name: Record<string, string>;

    @Prop({ type: String, enum: SpinWinStatus, default: SpinWinStatus.ACTIVE, index: true })
    status: SpinWinStatus;

    @Prop({ type: Number, required: true, min: 0 })
    point_section: number;

    @Prop({ type: Object, required: true })
    slab_data: Record<string, any>;

}

const childSchema = SchemaFactory.createForClass(SpinWinModel);
SpinWInSchema.add(childSchema.obj);

SpinWInSchema.pre('findOneAndUpdate', preUpdateHook);
SpinWInSchema.pre('updateOne', preUpdateHook);
SpinWInSchema.pre('updateMany', preUpdateHook);

export { SpinWInSchema };
