import { Prop, Schema, SchemaFactory, } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { ParentSchema } from 'src/common/schema/parent.schema';
import { COLLECTION_CONST } from 'src/config/collection.constant';
import { preUpdateHook } from 'src/common/hooks/pre-update';

@Schema({ collection: COLLECTION_CONST().CRM_SOCIAL_ENGAGE_DEFAULT })
export class Base extends Document { }
const SocialEngageDefaultSchema = SchemaFactory.createForClass(Base);
SocialEngageDefaultSchema.add(ParentSchema.obj);

@Schema()
export class SocialEngageDefaultModel extends Document {
    @Prop({ type: String, required: true, maxlength: 200 })
    title: string;

    @Prop({ type: String, required: true, maxlength: 300 })
    app_icon: string;

    @Prop({ type: String, required: true, maxlength: 300 })
    web_icon: string;

    @Prop({ type: String, maxlength: 50 })
    app_text_color: string;

    @Prop({ type: String, maxlength: 50 })
    web_text_color: string;
}

const childSchema = SchemaFactory.createForClass(SocialEngageDefaultModel);
SocialEngageDefaultSchema.add(childSchema.obj);

SocialEngageDefaultSchema.pre('findOneAndUpdate', preUpdateHook);
SocialEngageDefaultSchema.pre('updateOne', preUpdateHook);
SocialEngageDefaultSchema.pre('updateMany', preUpdateHook);


export { SocialEngageDefaultSchema };
