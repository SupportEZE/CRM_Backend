import { Prop, Schema, SchemaFactory, } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { ParentSchema } from 'src/common/schema/parent.schema';
import { COLLECTION_CONST } from 'src/config/collection.constant';
import { preUpdateHook } from 'src/common/hooks/pre-update';
@Schema({ collection: COLLECTION_CONST().CRM_CUSTOMER_STOCK_ITEM })
export class Base extends Document { }
const CustomerStockItemSchema = SchemaFactory.createForClass(Base);
CustomerStockItemSchema.add(ParentSchema.obj);

@Schema()
export class CustomerStockItemModel extends Document {
    @Prop({ type: Number, required: true })
    org_id: number;

    @Prop({ type: Types.ObjectId, required: true })
    customer_id: Types.ObjectId;

    @Prop({ type: Types.ObjectId, required: true })
    product_id: Types.ObjectId;

    @Prop({ type: String })
    product_name: string;

    @Prop({ type: String })
    product_code: string;

    @Prop({ type: Number })
    total_quantity: number;

}

const childSchema = SchemaFactory.createForClass(CustomerStockItemModel);
CustomerStockItemSchema.add(childSchema.obj);

CustomerStockItemSchema.pre('findOneAndUpdate', preUpdateHook);
CustomerStockItemSchema.pre('updateOne', preUpdateHook);
CustomerStockItemSchema.pre('updateMany', preUpdateHook);

export { CustomerStockItemSchema };
