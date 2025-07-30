import { Prop, Schema, SchemaFactory, } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { ParentSchema } from 'src/common/schema/parent.schema';
import { COLLECTION_CONST } from 'src/config/collection.constant';
import { preUpdateHook } from 'src/common/hooks/pre-update';
@Schema({ collection: COLLECTION_CONST().CRM_CUSTOMER_CUSTOMER_STOCK })
export class Base extends Document { }
const CustomerToCustomerStockSchema = SchemaFactory.createForClass(Base);
CustomerToCustomerStockSchema.add(ParentSchema.obj);

@Schema()
export class CustomerToCustomerStockModel extends Document {
    @Prop({ type: Number, required: true })
    org_id: number;

    @Prop({ type: Number, required: true })
    sender_login_type_id: number;

    @Prop({ type: Types.ObjectId })
    sender_customer_type_id: Types.ObjectId;

    @Prop({ type: String })
    sender_customer_type_name: string;

    @Prop({ type: Types.ObjectId })
    sender_customer_id: Types.ObjectId;

    @Prop({ type: String })
    sender_customer_name: string;

    @Prop({ type: Number, required: true })
    receiver_login_type_id: number;

    @Prop({ type: Types.ObjectId })
    receiver_customer_type_id: Types.ObjectId;

    @Prop({ type: String })
    receiver_customer_type_name: string;

    @Prop({ type: String })
    receiver_customer_name: string;

    @Prop({ type: Types.ObjectId })
    receiver_customer_id: Types.ObjectId;

    @Prop({ type: Date })
    bill_date: Date;

    @Prop({ type: String })
    bill_number: string;

    @Prop({ type: Number })
    bill_amount: number;

    @Prop({ type: Number })
    total_item_count: number;

    @Prop({ type: Number })
    total_item_quantity: number;

    @Prop({ type: String })
    transfer_id: string;

    @Prop({ type: String })
    transaction_type: string;

    @Prop({ type: [Object], default: [] }) 
    selected_item: Record<string, any>[];

    @Prop({ type: Object, default: {} })
    status_tracking?: Record<string, any>;

    @Prop({ type: String })
    status: string;

    @Prop({ type: String })
    remarks: string;
}

const childSchema = SchemaFactory.createForClass(CustomerToCustomerStockModel);
CustomerToCustomerStockSchema.add(childSchema.obj);

CustomerToCustomerStockSchema.pre('findOneAndUpdate', preUpdateHook);
CustomerToCustomerStockSchema.pre('updateOne', preUpdateHook);
CustomerToCustomerStockSchema.pre('updateMany', preUpdateHook);

export { CustomerToCustomerStockSchema };
