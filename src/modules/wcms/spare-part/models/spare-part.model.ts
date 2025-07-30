import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { time } from 'console';
import { Document, Schema as MongooseSchema, Types } from 'mongoose';
import { ParentSchema } from 'src/common/schema/parent.schema';
import { COLLECTION_CONST } from 'src/config/collection.constant';
import { preUpdateHook } from 'src/common/hooks/pre-update';

@Schema({ collection: COLLECTION_CONST().CRM_SPARE_PART })
export class Base extends Document { }
const SparePartSchema = SchemaFactory.createForClass(Base);
SparePartSchema.add(ParentSchema.obj);

@Schema()
export class SparePartModel extends Document {

    @Prop({ type: Number })
    org_id: number;

    @Prop({ type: String })
    product_code: string;

    @Prop({ type: String })
    product_name: string;

    @Prop({ type: String })
    description: string;

    @Prop({ type: Number })
    mrp: number;


}

const childSchema = SchemaFactory.createForClass(SparePartModel);
SparePartSchema.add(childSchema.obj);

// Applying the same update hook for all the update operations
SparePartSchema.pre('findOneAndUpdate', preUpdateHook);
SparePartSchema.pre('updateOne', preUpdateHook);
SparePartSchema.pre('updateMany', preUpdateHook);

export { SparePartSchema };