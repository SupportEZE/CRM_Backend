import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { ParentSchema } from 'src/common/schema/parent.schema';
import { COLLECTION_CONST } from 'src/config/collection.constant';
@Schema({ collection: COLLECTION_CONST().CRM_COMPLAINT_INVOICE_ITEM })
export class Base extends Document {
}
const ComplaintInvoiceItemSchema = SchemaFactory.createForClass(Base);
ComplaintInvoiceItemSchema.add(ParentSchema.obj);
@Schema()
export class ComplaintInvoiceItemModel extends Document {
    @Prop({ type: Number })
    org_id: number;

    @Prop({ type: Types.ObjectId })
    invoice_id: string;

    @Prop({ type: Types.ObjectId, required: true })
    product_id: string;

    @Prop({ type: String, required: true })
    product_name: string;

    @Prop({ type: String, required: true })
    product_code: string;

    @Prop({ type: Number, required: true })
    qty: number;

    @Prop({ type: Number, required: true })
    mrp: number;

    @Prop({ type: Number, required: true })
    sub_total: number;

    @Prop({ type: Number, required: true })
    discount: number;

    @Prop({ type: Number, required: true })
    net_price: number;
}
const childSchema = SchemaFactory.createForClass(ComplaintInvoiceItemModel);
ComplaintInvoiceItemSchema.add(childSchema.obj);
export { ComplaintInvoiceItemSchema };