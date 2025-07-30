import { Prop, Schema, SchemaFactory, } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';
import { ParentSchema } from 'src/common/schema/parent.schema';
import { COLLECTION_CONST } from 'src/config/collection.constant';
import { preUpdateHook } from 'src/common/hooks/pre-update';

@Schema({ collection: COLLECTION_CONST().CRM_POINT_CATEGORY })
export class Base extends Document { }
const PointCategorySchema = SchemaFactory.createForClass(Base);
PointCategorySchema.add(ParentSchema.obj);

@Schema()
export class PointCategoryModel extends Document {
    @Prop({ type: Number, required: true, index: true })
    org_id: number;

    @Prop({ type: String, required: true, maxlength: 100 })
    point_category_name: string;

    @Prop({ type: String, required: true, maxlength: 100 })
    status: string;

    @Prop({ type: MongooseSchema.Types.Mixed, required: true })
    point: Record<string, any>;
}

const childSchema = SchemaFactory.createForClass(PointCategoryModel);
PointCategorySchema.add(childSchema.obj);

PointCategorySchema.pre('findOneAndUpdate', preUpdateHook);
PointCategorySchema.pre('updateOne', preUpdateHook);
PointCategorySchema.pre('updateMany', preUpdateHook);

export { PointCategorySchema };
