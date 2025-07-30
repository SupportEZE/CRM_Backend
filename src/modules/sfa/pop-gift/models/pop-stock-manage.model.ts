import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema, Types } from 'mongoose';
import { preUpdateHook } from 'src/common/hooks/pre-update';
import { ParentSchema } from 'src/common/schema/parent.schema';
import { COLLECTION_CONST } from 'src/config/collection.constant';
@Schema({ collection: COLLECTION_CONST().CRM_POP_STOCK_MANAGE })
export class Base extends Document { }
const PopStockManageSchema = SchemaFactory.createForClass(Base);
PopStockManageSchema.add(ParentSchema.obj);

@Schema()
export class PopStockManageModel extends Document {
    @Prop({ type: Number })
    org_id: number;

    @Prop({ type: Number })
    assigned_to_login_id: number;

    @Prop({ type: Types.ObjectId })
    assigned_to_id: Types.ObjectId;

    @Prop({ type: String })
    assigned_to_name: string;

    @Prop({ type: Number })
    stock_qty: number;

    @Prop({ type: Types.ObjectId })
    product_id: Types.ObjectId;

    @Prop({ type: String })
    product_name: string;
}

const childSchema = SchemaFactory.createForClass(PopStockManageModel);
PopStockManageSchema.add(childSchema.obj);
PopStockManageSchema.pre('findOneAndUpdate', preUpdateHook);
PopStockManageSchema.pre('updateOne', preUpdateHook);
PopStockManageSchema.pre('updateMany', preUpdateHook);
export { PopStockManageSchema };