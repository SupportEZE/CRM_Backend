import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { ParentSchema } from 'src/common/schema/parent.schema';
import { COLLECTION_CONST } from 'src/config/collection.constant';
@Schema({ collection: COLLECTION_CONST().CRM_PRIMARY_ORDERS_CART })
export class Base extends Document { }
const PrimaryOrderCartSchema = SchemaFactory.createForClass(Base);
PrimaryOrderCartSchema.add(ParentSchema.obj);
@Schema({ strict: false })
export class PrimaryOrderCartModel extends Document {
    @Prop({ type: Number })
    org_id: number;

    @Prop({ type: Types.ObjectId, required: true })
    customer_id: string;

    @Prop({ type: String })
    customer_name: string;

    @Prop({ type: String, required: true })
    shipping_address: string;

    @Prop({ type: Number, default: 0 })
    total_item_count: number;

    @Prop({ type: Number, default: 0 })
    total_item_quantity: number;

    @Prop({ type: Number, default: 0 })
    gross_amount: number;

    @Prop({ type: Number, default: 0 })
    net_amount_before_tax: number;

    @Prop({ type: Number, default: 0 })
    discount_amount: number;

    @Prop({ type: Number, default: 0 })
    gst_amount: number;

    @Prop({ type: Number, default: 0 })
    net_amount_with_tax: number;

    @Prop({ type: String, required: false })
    color: string;

    @Prop({ type: String, required: false })
    brand: string;

    @Prop({ type: String, required: false })
    order_type: string;
}
const childSchema = SchemaFactory.createForClass(PrimaryOrderCartModel);
PrimaryOrderCartSchema.add(childSchema.obj);

export { PrimaryOrderCartSchema };
