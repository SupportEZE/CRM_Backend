import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import { ParentSchema } from 'src/common/schema/parent.schema';
import { COLLECTION_CONST } from 'src/config/collection.constant';
import { preUpdateHook } from 'src/common/hooks/pre-update';

@Schema({ collection: COLLECTION_CONST().CRM_LOGIN_TYPE })
export class Base extends Document { }
const LoginTypeSchema = SchemaFactory.createForClass(Base);
LoginTypeSchema.add(ParentSchema.obj);

@Schema()
export class LoginTypeModel extends Document {

    @Prop({ required: true })
    login_type_name: string;

    @Prop({ required: true })
    login_type_id: number;

    @Prop({ type: [String], required: true })
    profile_status: string[];

}

const childSchema = SchemaFactory.createForClass(LoginTypeModel);
LoginTypeSchema.add(childSchema.obj);
LoginTypeSchema.pre('findOneAndUpdate', preUpdateHook);
LoginTypeSchema.pre('updateOne', preUpdateHook);
LoginTypeSchema.pre('updateMany', preUpdateHook);
export { LoginTypeSchema };


