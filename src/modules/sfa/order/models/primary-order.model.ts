import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { ParentSchema } from 'src/common/schema/parent.schema';
import { COLLECTION_CONST } from 'src/config/collection.constant';
@Schema({ collection: COLLECTION_CONST().CRM_PRIMARY_ORDERS })
export class Base extends Document {
}
const PrimaryOrderSchema = SchemaFactory.createForClass(Base);
PrimaryOrderSchema.add(ParentSchema.obj);
@Schema({ strict: false })
export class PrimaryOrderModel extends Document {

    @Prop({ type: Number })
    org_id: number;

    @Prop({ type: String })
    order_no: string;

    @Prop({ type: Types.ObjectId, required: true })
    customer_id: string;

    @Prop({ type: Number, default: 0 })
    total_item_count: number;

    @Prop({ type: Number, default: 0 })
    total_item_quantity: number;

    @Prop({ type: Number, required: true })
    gross_amount: number;

    @Prop({ type: Number, required: true })
    net_amount_before_tax: number;

    @Prop({ type: Number, required: true })
    discount_amount: number;

    @Prop({ type: Number })
    discount_percent: number;

    @Prop({ type: Number, required: true })
    gst_amount: number;

    @Prop({ type: Number, default: 0 })
    net_amount_with_tax: number;

    @Prop({ type: String })
    status: string;

    @Prop({ type: String })
    billing_company: string;

    @Prop({ type: String, required: true })
    order_create_remark: string;

    @Prop({ type: String })
    reason: string;

    @Prop({ type: String })
    order_type: string;

    @Prop({ type: String, required: true })
    shipping_address: string;

    @Prop({ type: Object, default: {} })
    order_tracking_status?: Record<string, any>;


    @Prop({ type: Types.ObjectId })
    visit_activity_id: Types.ObjectId;

    @Prop({ type: String, required: false })
    brand: string;

    @Prop({ type: String, required: false })
    color: string;

}
const childSchema = SchemaFactory.createForClass(PrimaryOrderModel);
PrimaryOrderSchema.add(childSchema.obj);
export { PrimaryOrderSchema };