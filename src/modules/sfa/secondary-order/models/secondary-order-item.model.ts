import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { ParentSchema } from 'src/common/schema/parent.schema';
import { COLLECTION_CONST } from 'src/config/collection.constant';
@Schema({ collection: COLLECTION_CONST().CRM_SECONDARY_ORDER_ITEM })
export class Base extends Document {
}

const SecondaryOrderItemSchema = SchemaFactory.createForClass(Base);
SecondaryOrderItemSchema.add(ParentSchema.obj);
@Schema()
export class SecondaryOrderItemModel extends Document {

    @Prop({ type: Number })
    org_id: number;

    @Prop({ type: Types.ObjectId })
    order_id: string;

    @Prop({ type: Types.ObjectId })
    cart_id: string;

    @Prop({ type: String, required: true })
    category_name: string;

    @Prop({ type: Types.ObjectId, required: true })
    product_id: string;

    @Prop({ type: String, required: true })
    product_code: string;

    @Prop({ type: String, required: true })
    product_name: string;

    @Prop({ type: Types.ObjectId })
    scheme_id: string;

    @Prop({ type: Number, required: true })
    total_quantity: number;

    @Prop({ type: Number })
    dispatch_quantity: number;

    @Prop({ type: Number, required: true })
    mrp: number;

    @Prop({ type: Number, required: true })
    unit_price: number;

    @Prop({ type: Number, required: true })
    gross_amount: number;

    @Prop({ type: Number, required: true })
    gst_amount: number;

    @Prop({ type: Number, required: true })
    gst_percent: number;

    @Prop({ type: Number, required: true })
    discount_amount: number;

    @Prop({ type: String, required: true })
    discount_percent: string;

    @Prop({ type: Number, required: true })
    net_amount_with_tax: number;

    @Prop({ type: String, required: false })
    uom: string;
}
const childSchema = SchemaFactory.createForClass(SecondaryOrderItemModel);
SecondaryOrderItemSchema.add(childSchema.obj);
export { SecondaryOrderItemSchema };