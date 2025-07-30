import { Prop, Schema, SchemaFactory, } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { ParentSchema } from 'src/common/schema/parent.schema';
import { COLLECTION_CONST } from 'src/config/collection.constant';
import { preUpdateHook } from 'src/common/hooks/pre-update';
import { s3BucketIdType } from 'aws-sdk/clients/workmailmessageflow';

@Schema({ collection: COLLECTION_CONST().CRM_POINT_CATEGORY_MAP })
export class Base extends Document { }
const PointCategoryMapSchema = SchemaFactory.createForClass(Base);
PointCategoryMapSchema.add(ParentSchema.obj);

@Schema()
export class PointCategoryMapModel extends Document {
    @Prop({ type: Number, required: true, index: true })
    org_id: number;

    @Prop({ type: Types.ObjectId, required: true, ref: COLLECTION_CONST().CRM_POINT_CATEGORY, index: true })
    point_category_id: Types.ObjectId;

    @Prop({ type: String, required: true, maxlength: 100 })
    point_category_name: string;

    @Prop({ type: Types.ObjectId, required: true, ref: COLLECTION_CONST().CRM_PRODUCTS, index: true })
    product_id: Types.ObjectId;
}

const childSchema = SchemaFactory.createForClass(PointCategoryMapModel);
PointCategoryMapSchema.add(childSchema.obj);

PointCategoryMapSchema.pre('findOneAndUpdate', preUpdateHook);
PointCategoryMapSchema.pre('updateOne', preUpdateHook);
PointCategoryMapSchema.pre('updateMany', preUpdateHook);

export { PointCategoryMapSchema };
