import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import { preUpdateHook } from 'src/common/hooks/pre-update';
import { ParentSchema } from 'src/common/schema/parent.schema';
import { COLLECTION_CONST } from 'src/config/collection.constant';


@Schema({ collection: COLLECTION_CONST().CRM_USER_ROLES })
export class UserRoleModel extends Document {


  @Prop({ required: true})
  org_id: number;

  @Prop({ required: true})
  login_type_id: number;

  @Prop({ required: true})
  login_type_name: string;

  @Prop({ required: true})
  user_role_name: string;

}

const UserRoleSchema = SchemaFactory.createForClass(UserRoleModel);
UserRoleSchema.add(ParentSchema.obj);
UserRoleSchema.pre('findOneAndUpdate', preUpdateHook);
UserRoleSchema.pre('updateOne', preUpdateHook);
UserRoleSchema.pre('updateMany', preUpdateHook);
export { UserRoleSchema };
