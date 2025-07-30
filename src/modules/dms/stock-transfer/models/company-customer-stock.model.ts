import { Prop, Schema, SchemaFactory, } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { ParentSchema } from 'src/common/schema/parent.schema';
import { COLLECTION_CONST } from 'src/config/collection.constant';
import { preUpdateHook } from 'src/common/hooks/pre-update';
@Schema({ collection: COLLECTION_CONST().CRM_CUSTOMER_STOCK })
export class Base extends Document { }
const CustomerStockSchema = SchemaFactory.createForClass(Base);
CustomerStockSchema.add(ParentSchema.obj);

@Schema()
export class CustomerStockModel extends Document {
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

    @Prop({ type: String })
    invoice_number: string;

    @Prop({ type: Date })
    stock_date: Date;

    @Prop({ type: Number })
    total_item_count: number;

    @Prop({ type: Number })
    total_item_quantity: number;

    @Prop({ type: String })
    transaction_type: string;

    @Prop({ type: Number })
    bill_amount: number;

    @Prop({ type: [Object], default: [] }) 
    selected_item: Record<string, any>[];

    @Prop({ type: String })
    status: string;

    @Prop({ type: String })
    remarks: string;
}

const childSchema = SchemaFactory.createForClass(CustomerStockModel);
CustomerStockSchema.add(childSchema.obj);

CustomerStockSchema.pre('findOneAndUpdate', preUpdateHook);
CustomerStockSchema.pre('updateOne', preUpdateHook);
CustomerStockSchema.pre('updateMany', preUpdateHook);

export { CustomerStockSchema };
