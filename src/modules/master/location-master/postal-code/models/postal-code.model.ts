import { Prop, Schema, SchemaFactory, } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { ParentSchema } from 'src/common/schema/parent.schema';
import { COLLECTION_CONST } from 'src/config/collection.constant';
import { preUpdateHook } from 'src/common/hooks/pre-update';
import { s3BucketIdType } from 'aws-sdk/clients/workmailmessageflow';

@Schema({ collection: COLLECTION_CONST().CRM_POSTAL_CODE })
export class Base extends Document { }
const PostalCodeSchema = SchemaFactory.createForClass(Base);
PostalCodeSchema.add(ParentSchema.obj);

@Schema()
export class PostalCodeModel extends Document {
    @Prop({ type: String, required: true })
    country: string;

    @Prop({ type: String, required: true })
    state: string;

    @Prop({ type: String, required: true })
    district: string;

    @Prop({ type: String })
    city: string;

    @Prop({ type: String, required: true })
    pincode: string;
}

const childSchema = SchemaFactory.createForClass(PostalCodeModel);
PostalCodeSchema.add(childSchema.obj);

// Applying the same update hook for all the update operations
PostalCodeSchema.pre('findOneAndUpdate', preUpdateHook);
PostalCodeSchema.pre('updateOne', preUpdateHook);
PostalCodeSchema.pre('updateMany', preUpdateHook);


export { PostalCodeSchema };
