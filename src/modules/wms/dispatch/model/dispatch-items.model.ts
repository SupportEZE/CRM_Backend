import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { ParentSchema } from 'src/common/schema/parent.schema';
import { COLLECTION_CONST } from 'src/config/collection.constant';
import { preUpdateHook } from 'src/common/hooks/pre-update';

@Schema({ collection: COLLECTION_CONST().CRM_DISPATCH_ITEMS })
export class Base extends Document {
}

const DispatchItemsSchema = SchemaFactory.createForClass(Base);
DispatchItemsSchema.add(ParentSchema.obj);

@Schema()
export class DispatchItemsModel extends Document {

    @Prop({ type: Number, required: true })
    org_id: number;

    @Prop({ type: Types.ObjectId, required: true })
    dispatch_id: Types.ObjectId;

    @Prop({ type: Types.ObjectId, required: true })
    order_id: Types.ObjectId;

    @Prop({ type: Types.ObjectId, required: true })
    item_id: Types.ObjectId;

    @Prop({ type: Types.ObjectId, required: true })
    product_id: Types.ObjectId;

    @Prop({ type: String, required: true })
    product_name: string;

    @Prop({ type: String, required: true })
    product_code: string;

    @Prop({ type: Number })
    planned_qty: number;

    @Prop({ type: Number })
    scanned_quantity: number;
}

const childSchema = SchemaFactory.createForClass(DispatchItemsModel);
DispatchItemsSchema.add(childSchema.obj);

DispatchItemsSchema.pre('findOneAndUpdate', preUpdateHook);
DispatchItemsSchema.pre('updateOne', preUpdateHook);
DispatchItemsSchema.pre('updateMany', preUpdateHook);

export { DispatchItemsSchema };
