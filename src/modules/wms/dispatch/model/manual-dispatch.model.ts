import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { ParentSchema } from 'src/common/schema/parent.schema';
import { COLLECTION_CONST } from 'src/config/collection.constant';
import { preUpdateHook } from 'src/common/hooks/pre-update';

@Schema({ collection: COLLECTION_CONST().CRM_MANUAL_DISPATCH })
export class Base extends Document {
}

const ManualDispatchSchema = SchemaFactory.createForClass(Base);
ManualDispatchSchema.add(ParentSchema.obj);

@Schema()
export class ManualDispatchModel extends Document {

    @Prop({ type: Number, required: true, index: true })
    org_id: number;

    @Prop({
        type: Types.ObjectId,
        ref: COLLECTION_CONST().CRM_PRODUCTS,
        required: true,
        index: true,
    })
    product_id: Types.ObjectId;

    @Prop({ type: Types.ObjectId })
    gate_pass_id: Types.ObjectId;

    @Prop({ type: Types.ObjectId })
    dispatch_id: Types.ObjectId;

    @Prop({ type: Types.ObjectId })
    item_id: Types.ObjectId;

    @Prop({ type: Types.ObjectId })
    customer_id: Types.ObjectId;

    @Prop({ type: Types.ObjectId })
    customer_type_id: Types.ObjectId;

    @Prop({ type: String })
    customer_type_name?: string;

    @Prop({ type: String })
    customer_name?: string;

    @Prop({ type: String })
    customer_mobile?: string;


    @Prop({ type: String })
    dispatch_from?: string;

    @Prop({ type: Types.ObjectId })
    order_id: Types.ObjectId;

    @Prop({ type: String })
    order_date?: string;

    @Prop({ type: String })
    order_no?: string;

    @Prop({ type: String })
    billing_company?: string;

    @Prop({ type: String })
    qr_master_box_code?: string;

    @Prop({ type: Types.ObjectId })
    qr_master_box_id: Types.ObjectId;
}

const childSchema = SchemaFactory.createForClass(ManualDispatchModel);
ManualDispatchSchema.add(childSchema.obj);

ManualDispatchSchema.pre('findOneAndUpdate', preUpdateHook);
ManualDispatchSchema.pre('updateOne', preUpdateHook);
ManualDispatchSchema.pre('updateMany', preUpdateHook);

export { ManualDispatchSchema };
