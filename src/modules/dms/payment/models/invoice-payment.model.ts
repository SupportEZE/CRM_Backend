import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { ParentSchema } from 'src/common/schema/parent.schema';
import { COLLECTION_CONST } from 'src/config/collection.constant';
import { preUpdateHook } from 'src/common/hooks/pre-update';
@Schema({ collection: COLLECTION_CONST().CRM_INVOICE_PAYMENT })
export class Base extends Document {
}
const InvoicePaymentSchema = SchemaFactory.createForClass(Base);
InvoicePaymentSchema.add(ParentSchema.obj);
@Schema()
export class InvoicePaymentModel extends Document {

    @Prop({ type: Number, required: true })
    org_id: number;

    @Prop({ type: Number, required: true })
    login_type_id: number;

    @Prop({ type: Types.ObjectId })
    customer_type_id: Types.ObjectId;

    @Prop({ type: String })
    customer_type_name: string;

    @Prop({ type: Types.ObjectId })
    customer_id: Types.ObjectId;

    @Prop({ type: String })
    customer_code: string;

    @Prop({ type: String })
    customer_name: string;

    @Prop({ type: Types.ObjectId })
    invoice_id: Types.ObjectId;

    @Prop({ type: String })
    invoice_no: string;

    @Prop({ type: Date })
    payment_date: Date;

    @Prop({ type: Number })
    payment_amount: number;

    @Prop({ type: String })
    payment_mode: string;

    @Prop({ type: String })
    transaction_number: string;

    @Prop({ type: String })
    remarks: string;

}

const childSchema = SchemaFactory.createForClass(InvoicePaymentModel);
InvoicePaymentSchema.add(childSchema.obj);

InvoicePaymentSchema.pre('findOneAndUpdate', preUpdateHook);
InvoicePaymentSchema.pre('updateOne', preUpdateHook);
InvoicePaymentSchema.pre('updateMany', preUpdateHook);

export { InvoicePaymentSchema };
