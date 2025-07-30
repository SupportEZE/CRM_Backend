import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema, Types } from 'mongoose';
import { ParentSchema } from 'src/common/schema/parent.schema';
import { COLLECTION_CONST } from 'src/config/collection.constant';
@Schema({ collection: COLLECTION_CONST().CRM_SPARE_STOCK_MANAGE })
export class Base extends Document { }
const SpareStockManageSchema = SchemaFactory.createForClass(Base);
SpareStockManageSchema.add(ParentSchema.obj);

@Schema()
export class SpareStockManageModel extends Document {
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

const childSchema = SchemaFactory.createForClass(SpareStockManageModel);
SpareStockManageSchema.add(childSchema.obj);
export { SpareStockManageSchema };