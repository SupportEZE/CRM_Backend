import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { preUpdateHook } from 'src/common/hooks/pre-update';
import { ParentSchema } from 'src/common/schema/parent.schema';
import { COLLECTION_CONST } from 'src/config/collection.constant';

@Schema({ collection: COLLECTION_CONST().CRM_USER_HIERARCHY })
export class Base extends Document { }

const UserHierarchySchema = SchemaFactory.createForClass(Base);
UserHierarchySchema.add(ParentSchema.obj);

@Schema()
export class UserHierarchyModel extends Document {

    @Prop({ type: Number, required: true, min: 1 })
    org_id: number;

    @Prop({ type: String, required: true })
    parent_user_name: string;

    @Prop({ type: Types.ObjectId, required: true })
    parent_user_id: string;

    @Prop({ type: Types.ObjectId, required: true })
    child_user_id: string;

    @Prop({ type: String, required: true })
    child_user_name: string;

}

const childSchema = SchemaFactory.createForClass(UserHierarchyModel);
UserHierarchySchema.add(childSchema.obj);

UserHierarchySchema.pre('findOneAndUpdate', preUpdateHook);
UserHierarchySchema.pre('updateOne', preUpdateHook);
UserHierarchySchema.pre('updateMany', preUpdateHook);

export { UserHierarchySchema };
