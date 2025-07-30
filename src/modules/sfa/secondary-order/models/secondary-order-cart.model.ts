import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { ParentSchema } from 'src/common/schema/parent.schema';
import { COLLECTION_CONST } from 'src/config/collection.constant';
@Schema({ collection: COLLECTION_CONST().CRM_SECONDARY_ORDER_CART })
export class Base extends Document { }
const SecondaryOrderCartSchema = SchemaFactory.createForClass(Base);
SecondaryOrderCartSchema.add(ParentSchema.obj);
@Schema()
export class SecondaryOrderCartModel extends Document {
    @Prop({ type: Number })
    org_id: number;

    @Prop({ type: Types.ObjectId, required: true })
    customer_id: string;

    @Prop({ type: String })
    customer_name: string;

    @Prop({ type: Types.ObjectId, required: true })
    delivery_from: string;

    @Prop({ type: String })
    gst_type: string;

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
}
const childSchema = SchemaFactory.createForClass(SecondaryOrderCartModel);
SecondaryOrderCartSchema.add(childSchema.obj);

export { SecondaryOrderCartSchema };
