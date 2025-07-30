import { Prop, Schema, SchemaFactory, } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { ParentSchema } from 'src/common/schema/parent.schema';
import { COLLECTION_CONST } from 'src/config/collection.constant';
import { preUpdateHook } from 'src/common/hooks/pre-update';

@Schema({ collection: COLLECTION_CONST().CRM_DISPATCH_GATEPASS })
export class Base extends Document { }
const DispatchGatepassSchema = SchemaFactory.createForClass(Base);
DispatchGatepassSchema.add(ParentSchema.obj);

@Schema()
export class DispatchGatepassModel extends Document {
    @Prop({ type: Number, required: true, index: true })
    org_id: number;

    @Prop({
        type: String,
        index: true,
    })
    invoice_number: string;

    @Prop({
        type: String,
    })
    driver_name: string;


    @Prop({
        type: String,
    })
    e_way_number: string;

    @Prop({
        type: String,
    })
    mobile: string;

    @Prop({
        type: String,
    })
    vehicle_number: string;

    @Prop({
        type: String,
    })
    transportation_mode: string;

    @Prop({
        type: String,
    })
    status: string;

    @Prop({
        type: String,
        index: true,
    })
    gatepass_number: string;

    @Prop({
        type: String,
        index: true,
    })
    billing_company: string;

    @Prop({
        type: String,
        index: true,
    })
    bilty_number: string;

    @Prop({
        type: Number,
    })
    identifier_number: number;

    @Prop({
        type: Types.ObjectId,
    })
    dispatch_id: Types.ObjectId;
}

const childSchema = SchemaFactory.createForClass(DispatchGatepassModel);
DispatchGatepassSchema.add(childSchema.obj);

DispatchGatepassSchema.pre('findOneAndUpdate', preUpdateHook);
DispatchGatepassSchema.pre('updateOne', preUpdateHook);
DispatchGatepassSchema.pre('updateMany', preUpdateHook);

export { DispatchGatepassSchema };
