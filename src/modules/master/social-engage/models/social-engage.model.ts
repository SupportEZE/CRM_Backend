import { Prop, Schema, SchemaFactory, } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';
import { ParentSchema } from 'src/common/schema/parent.schema';
import { COLLECTION_CONST } from 'src/config/collection.constant';
import { preUpdateHook } from 'src/common/hooks/pre-update';

@Schema({ collection: COLLECTION_CONST().CRM_SOCIAL_ENGAGE })
export class Base extends Document { }
const SocialEngageSchema = SchemaFactory.createForClass(Base);
SocialEngageSchema.add(ParentSchema.obj);

@Schema()
export class SocialEngageModel extends Document {

    @Prop({ type: Number, required: true, index: true })
    org_id: number;

    @Prop({ type: String, required: true, maxlength: 200 })
    title: string;

    @Prop({ type: String, required: true, maxlength: 500 })
    social_url: string;

    @Prop({ type: String, maxlength: 300 })
    app_icon: string;

    @Prop({ type: String, maxlength: 50 })
    app_text_color: string;

    @Prop({ type: String, maxlength: 50 })
    web_text_color: string;

    @Prop({ type: String, maxlength: 300 })
    web_icon: string;

    @Prop({
        type: String,
        enum: ['Active', 'Inactive'],
        default: 'Active',
        index: true
    })
    status: string;

    @Prop({ type: Number, default: 0, min: 0 })
    subscriber: number;

    @Prop({ type: Number, default: 0, min: 0 })
    points: number;

    @Prop({ type: MongooseSchema.Types.Mixed })
    request: Record<string, any>;
}

const childSchema = SchemaFactory.createForClass(SocialEngageModel);
SocialEngageSchema.add(childSchema.obj);

SocialEngageSchema.pre('findOneAndUpdate', preUpdateHook);
SocialEngageSchema.pre('updateOne', preUpdateHook);
SocialEngageSchema.pre('updateMany', preUpdateHook);

export { SocialEngageSchema };
