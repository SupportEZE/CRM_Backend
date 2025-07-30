import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';
import { preUpdateHook } from 'src/common/hooks/pre-update';
import { ParentSchema } from 'src/common/schema/parent.schema';
import { COLLECTION_CONST } from 'src/config/collection.constant';

@Schema({ collection: COLLECTION_CONST().CRM_PRODUCT_DISPATCH_CONFIG })
export class Base extends Document { }
const ProductDispatchSchema = SchemaFactory.createForClass(Base);
ProductDispatchSchema.add(ParentSchema.obj);

@Schema()
export class ProductDispatchModel extends Document {

    @Prop({ type: Number, required: true })
    org_id: number;

    @Prop({ type: Number })
    master_box_size: number;

    @Prop({ type: Number, required: true })
    box_size: number;

    @Prop({ type: String })
    uom: string;

    @Prop({ type: Boolean, required: true })
    box_with_item: boolean;

    @Prop({ type: Boolean, required: true })
    qr_genration: boolean;

    @Prop({ type: MongooseSchema.Types.ObjectId, required: true, ref: COLLECTION_CONST().CRM_PRODUCTS })
    product_id: MongooseSchema.Types.ObjectId;
}

const childSchema = SchemaFactory.createForClass(ProductDispatchModel);
ProductDispatchSchema.add(childSchema.obj);
ProductDispatchSchema.pre('findOneAndUpdate', preUpdateHook);
ProductDispatchSchema.pre('updateOne', preUpdateHook);
ProductDispatchSchema.pre('updateMany', preUpdateHook);
export { ProductDispatchSchema };
