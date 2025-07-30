import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { ParentSchema } from 'src/common/schema/parent.schema';
import { COLLECTION_CONST } from 'src/config/collection.constant';
@Schema({ collection: COLLECTION_CONST().CRM_ORDERS_SCHEME })
export class Base extends Document {
}

const OrderSchemeSchema = SchemaFactory.createForClass(Base);
OrderSchemeSchema.add(ParentSchema.obj);
@Schema()
export class OrderSchemeModel extends Document {

    @Prop({ type: Number })
    org_id: number;

    @Prop({ type: String })
    scheme_id: string;

    @Prop({ type: Date, index: true })
    date_from: Date;

    @Prop({ type: Date, index: true })
    date_to: Date;

    @Prop({ type: Object })
    product_data?: Record<string, any>;

    @Prop({ type: String, default: 'Active' })
    status: string;

    @Prop({ type: String })
    description: string;
}
const childSchema = SchemaFactory.createForClass(OrderSchemeModel);
OrderSchemeSchema.add(childSchema.obj);
export { OrderSchemeSchema };