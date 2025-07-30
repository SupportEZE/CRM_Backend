import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { preUpdateHook } from 'src/common/hooks/pre-update';
import { ParentSchema } from 'src/common/schema/parent.schema';
import { COLLECTION_CONST } from 'src/config/collection.constant';

@Schema({ collection: COLLECTION_CONST().CRM_USER_TO_STATE_MAPPING })
export class Base extends Document { }

const UserToStateMappingSchema = SchemaFactory.createForClass(Base);
UserToStateMappingSchema.add(ParentSchema.obj);

@Schema()
export class UserToStateMappingModel extends Document {
    @Prop({ type: Number, required: true, min: 1 })
    org_id: number;

    @Prop({ type: Types.ObjectId, required: true })
    user_id: string;

    @Prop({ type: String, required: true })
    user_name: string;

    @Prop({ type: [String], required: true })
    state: string[];

    @Prop({ type: [String], required: true })
    district: string[];
}

const childSchema = SchemaFactory.createForClass(UserToStateMappingModel);
UserToStateMappingSchema.add(childSchema.obj);

UserToStateMappingSchema.pre('findOneAndUpdate', preUpdateHook);
UserToStateMappingSchema.pre('updateOne', preUpdateHook);
UserToStateMappingSchema.pre('updateMany', preUpdateHook);

export { UserToStateMappingSchema };
