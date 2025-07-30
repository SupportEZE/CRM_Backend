import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { ParentSchema } from 'src/common/schema/parent.schema';
import { COLLECTION_CONST } from 'src/config/collection.constant';
import { preUpdateHook } from 'src/common/hooks/pre-update';

@Schema({ collection: COLLECTION_CONST().CRM_DISPATCH })
export class Base extends Document {
}

const DispatchSchema = SchemaFactory.createForClass(Base);
DispatchSchema.add(ParentSchema.obj);

@Schema()
export class DispatchModel extends Document {

    @Prop({ type: Number, required: true })
    org_id: number;

    @Prop({ type: Types.ObjectId, required: true })
    order_id: Types.ObjectId;

    @Prop({ type: String, required: true })
    order_no: string

    @Prop({ type: String, required: true })
    order_date: string

    @Prop({ type: String, required: true })
    dispatch_from: string

    @Prop({ type: String })
    warehouse_id: string

    @Prop({ type: Types.ObjectId, required: true })
    customer_id: Types.ObjectId;

    @Prop({ type: Types.ObjectId, required: true })
    customer_type_id: Types.ObjectId;

    @Prop({ type: String })
    customer_type_name: string;

    @Prop({ type: String })
    customer_name: string;

    @Prop({ type: String })
    company_name: string;

    @Prop({ type: String })
    mobile: string;

    @Prop({ type: String })
    billing_company: string;

    @Prop({ type: Types.ObjectId })
    gate_pass_id: Types.ObjectId;

    @Prop({ type: String })
    gate_pass_number: string;

    @Prop({ type: String })
    invoice_no: string;

    @Prop({ type: String, required: true })
    dispatch_status: string;

    @Prop({ type: String, required: true })
    shipping_address: string;

    @Prop({ type: String, required: true })
    customer_address: string;

    @Prop({ type: String })
    dispatch_date: string;
}

const childSchema = SchemaFactory.createForClass(DispatchModel);
DispatchSchema.add(childSchema.obj);

DispatchSchema.pre('findOneAndUpdate', preUpdateHook);
DispatchSchema.pre('updateOne', preUpdateHook);
DispatchSchema.pre('updateMany', preUpdateHook);

export { DispatchSchema };
