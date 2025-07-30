import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';
import { preUpdateHook } from 'src/common/hooks/pre-update';
import { ParentSchema } from 'src/common/schema/parent.schema';
import { COLLECTION_CONST } from 'src/config/collection.constant';
@Schema({ collection: COLLECTION_CONST().CRM_DISCOUNT })
export class Base extends Document { }
const DiscountSchema = SchemaFactory.createForClass(Base);
DiscountSchema.add(ParentSchema.obj);

@Schema()
export class DiscountModel extends Document {

    @Prop({ type: Number, required: true })
    org_id: number;

    @Prop({ type: String })
    discount_type?: string;

    @Prop({ type: MongooseSchema.Types.ObjectId, required: true })
    discount_id: MongooseSchema.Types.ObjectId;

    @Prop({ type: String })
    discount_name: string;

    @Prop({ type: MongooseSchema.Types.ObjectId })
    customer_id?: MongooseSchema.Types.ObjectId;

    @Prop({ type: String })
    customer_type_name?: string;

    @Prop({ type: MongooseSchema.Types.ObjectId })
    customer_type_id?: MongooseSchema.Types.ObjectId;

    @Prop({ type: Object, required: true })
    form_data: Record<string, any>

}

const childSchema = SchemaFactory.createForClass(DiscountModel);
DiscountSchema.add(childSchema.obj);
DiscountSchema.pre('findOneAndUpdate', preUpdateHook);
DiscountSchema.pre('updateOne', preUpdateHook);
DiscountSchema.pre('updateMany', preUpdateHook);
export { DiscountSchema };
