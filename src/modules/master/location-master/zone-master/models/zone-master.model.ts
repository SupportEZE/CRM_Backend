import { Prop, Schema, SchemaFactory, } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { ParentSchema } from 'src/common/schema/parent.schema';
import { COLLECTION_CONST } from 'src/config/collection.constant';
import { preUpdateHook } from 'src/common/hooks/pre-update';
import { s3BucketIdType } from 'aws-sdk/clients/workmailmessageflow';

@Schema({ collection: COLLECTION_CONST().CRM_ZONE_MASTER })
export class Base extends Document { }
const ZoneMasterSchema = SchemaFactory.createForClass(Base);
ZoneMasterSchema.add(ParentSchema.obj);

@Schema()
export class ZoneMasterModel extends Document {

    @Prop({ type: Number })
    org_id: number;

    @Prop({ type: Object })
    state: Record<string, any>;

    @Prop({ type: String, required: true })
    zone: string;

    @Prop({ type: Object })
    country: Record<string, any>;
}

const childSchema = SchemaFactory.createForClass(ZoneMasterModel);
ZoneMasterSchema.add(childSchema.obj);

// Applying the same update hook for all the update operations
ZoneMasterSchema.pre('findOneAndUpdate', preUpdateHook);
ZoneMasterSchema.pre('updateOne', preUpdateHook);
ZoneMasterSchema.pre('updateMany', preUpdateHook);


export { ZoneMasterSchema };
