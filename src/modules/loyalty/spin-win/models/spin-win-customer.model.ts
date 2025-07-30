import { Prop, Schema, SchemaFactory, } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { ParentSchema } from 'src/common/schema/parent.schema';
import { COLLECTION_CONST } from 'src/config/collection.constant';
import { preUpdateHook } from 'src/common/hooks/pre-update';

@Schema({ collection: COLLECTION_CONST().CRM_SPIN_WIN_CUSTOMERS })
export class Base extends Document { }
const SpinWInCustomersSchema = SchemaFactory.createForClass(Base);
SpinWInCustomersSchema.add(ParentSchema.obj);

@Schema()
export class SpinWinCustomersModel extends Document {

    @Prop({ type: Number, required: true, index: true })
    org_id: number;

    @Prop({ type: Types.ObjectId, required: true })
    spin_id: string;

    @Prop({ type: Number, required: true })
    points: number;

    @Prop({ type: Types.ObjectId, required: true })
    customer_id: string;

    @Prop({ type: Object, required: true })
    customer_name: Record<string, string>;
}

const childSchema = SchemaFactory.createForClass(SpinWinCustomersModel);
SpinWInCustomersSchema.add(childSchema.obj);

SpinWInCustomersSchema.pre('findOneAndUpdate', preUpdateHook);
SpinWInCustomersSchema.pre('updateOne', preUpdateHook);
SpinWInCustomersSchema.pre('updateMany', preUpdateHook);

export { SpinWInCustomersSchema };
