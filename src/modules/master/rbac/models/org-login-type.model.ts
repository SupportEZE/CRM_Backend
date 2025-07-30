import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import { ParentSchema } from 'src/common/schema/parent.schema';
import { COLLECTION_CONST } from 'src/config/collection.constant';
import { preUpdateHook } from 'src/common/hooks/pre-update';

@Schema({ collection: COLLECTION_CONST().CRM_ORG_LOGIN_TYPE })
export class Base extends Document { }
const OrgLoginTypeSchema = SchemaFactory.createForClass(Base);
OrgLoginTypeSchema.add(ParentSchema.obj);

@Schema()
export class OrgLoginTypeModel extends Document {

    @Prop({ required: true })
    org_id: number;

    @Prop({ required: true })
    login_type_ids: number[];

}

const childSchema = SchemaFactory.createForClass(OrgLoginTypeModel);
OrgLoginTypeSchema.add(childSchema.obj);
OrgLoginTypeSchema.pre('findOneAndUpdate', preUpdateHook);
OrgLoginTypeSchema.pre('updateOne', preUpdateHook);
OrgLoginTypeSchema.pre('updateMany', preUpdateHook);
export { OrgLoginTypeSchema };


