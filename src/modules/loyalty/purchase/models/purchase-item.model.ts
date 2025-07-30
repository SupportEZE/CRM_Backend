import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { ParentSchema } from 'src/common/schema/parent.schema';
import { COLLECTION_CONST } from 'src/config/collection.constant';
import { preUpdateHook } from 'src/common/hooks/pre-update';

@Schema({ collection: COLLECTION_CONST().CRM_PURCHASE_REQUEST_ITEM })
export class Base extends Document {
}

const PurchaseItemSchema = SchemaFactory.createForClass(Base);
PurchaseItemSchema.add(ParentSchema.obj);
@Schema()
export class PurchaseItemModel extends Document {
    @Prop({ type: Number, required: true, index: true })
    org_id: number;

    @Prop({ type: Types.ObjectId, required: true })
    purchase_id: Types.ObjectId;

    @Prop({ type: String, required: true })
    label: string;

    @Prop({ type: Types.ObjectId, required: true })
    value: Types.ObjectId;

    @Prop({ type: Number, required: true })
    qty: number;

    @Prop({ type: Number, required: true })
    point_value: number;
}

const childSchema = SchemaFactory.createForClass(PurchaseItemModel);
PurchaseItemSchema.add(childSchema.obj);

PurchaseItemSchema.pre('findOneAndUpdate', preUpdateHook);
PurchaseItemSchema.pre('updateOne', preUpdateHook);
PurchaseItemSchema.pre('updateMany', preUpdateHook);

export { PurchaseItemSchema };
