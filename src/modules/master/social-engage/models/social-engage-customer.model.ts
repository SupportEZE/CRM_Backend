import { Prop, Schema, SchemaFactory, } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { ParentSchema } from 'src/common/schema/parent.schema';
import { COLLECTION_CONST } from 'src/config/collection.constant';
import { preUpdateHook } from 'src/common/hooks/pre-update';

@Schema({ collection: COLLECTION_CONST().CRM_SOCIAL_ENGAGE_CUSTOMERS })
export class Base extends Document { }
const SocialEngageCustomersSchema = SchemaFactory.createForClass(Base);
SocialEngageCustomersSchema.add(ParentSchema.obj);

@Schema()
export class SocialEngageCustomersModel extends Document {

    @Prop({ type: Number, required: true })
    org_id: number;

    @Prop({ type: Types.ObjectId, required: true })
    social_engage_id: Types.ObjectId;

    @Prop({ type: String, required: true, maxlength: 200 })
    title: string;

    @Prop({ type: Types.ObjectId, required: true })
    customer_id: Types.ObjectId;

    @Prop({ type: String, required: true, maxlength: 200 })
    customer_name: string;

    @Prop({ type: String, required: true, maxlength: 100 })
    customer_type_name: string;

    @Prop({ type: String, required: true, maxlength: 20 })
    customer_mobile: string;

    @Prop({ type: String, required: true, maxlength: 100 })
    customer_state: string;

    @Prop({ type: Number, default: 0 })
    points: number;

    @Prop({ type: String, required: true })
    status: string;
}

const childSchema = SchemaFactory.createForClass(SocialEngageCustomersModel);
SocialEngageCustomersSchema.add(childSchema.obj);

SocialEngageCustomersSchema.pre('findOneAndUpdate', preUpdateHook);
SocialEngageCustomersSchema.pre('updateOne', preUpdateHook);
SocialEngageCustomersSchema.pre('updateMany', preUpdateHook);

export { SocialEngageCustomersSchema };
