import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { ParentSchema } from 'src/common/schema/parent.schema';
import { COLLECTION_CONST } from 'src/config/collection.constant';
import { preUpdateHook } from 'src/common/hooks/pre-update';

@Schema({ collection: COLLECTION_CONST().CRM_BONUS_POINT_CATEGORY })
export class Base extends Document {
}

const BonusPointCategorySchema = SchemaFactory.createForClass(Base);
BonusPointCategorySchema.add(ParentSchema.obj);
@Schema()
export class BonusPointCategoryModel extends Document {
    @Prop({ type: Types.ObjectId, required: true, ref: COLLECTION_CONST().CRM_BONUS })
    bonus_id: Types.ObjectId;

    @Prop({ type: Types.ObjectId, required: true, ref: COLLECTION_CONST().CRM_POINT_CATEGORY })
    point_category_id: Types.ObjectId;

    @Prop({ type: String, required: true, minlength: 3, maxlength: 100 })
    point_category_name: string;

    @Prop({ type: Number, required: true, min: 1 })
    point_category_value: number;

}

const childSchema = SchemaFactory.createForClass(BonusPointCategoryModel);
BonusPointCategorySchema.add(childSchema.obj);

BonusPointCategorySchema.pre('findOneAndUpdate', preUpdateHook);
BonusPointCategorySchema.pre('updateOne', preUpdateHook);
BonusPointCategorySchema.pre('updateMany', preUpdateHook);

export { BonusPointCategorySchema };
