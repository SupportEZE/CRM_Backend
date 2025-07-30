import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema, Types } from 'mongoose';
import { ParentSchema } from 'src/common/schema/parent.schema';
import { COLLECTION_CONST } from 'src/config/collection.constant';
import { preUpdateHook } from 'src/common/hooks/pre-update';


@Schema({ collection: COLLECTION_CONST().CRM_TARGET_MAPPING })
export class Base extends Document { }
const TargetMappingSchema = SchemaFactory.createForClass(Base);
TargetMappingSchema.add(ParentSchema.obj);

@Schema()
export class TargetMappingModel extends Document {
    @Prop({ type: Number})
    org_id: number;

    @Prop({ type: Types.ObjectId })
    target_id: Types.ObjectId;

    @Prop({ type: Types.ObjectId })
    assign_to_id: Types.ObjectId;


}

const childSchema = SchemaFactory.createForClass(TargetMappingModel);
TargetMappingSchema.add(childSchema.obj);

// Applying the same update hook for all the update operations
TargetMappingSchema.pre('findOneAndUpdate', preUpdateHook);
TargetMappingSchema.pre('updateOne', preUpdateHook);
TargetMappingSchema.pre('updateMany', preUpdateHook);

export { TargetMappingSchema };