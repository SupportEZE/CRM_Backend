import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { ParentSchema } from 'src/common/schema/parent.schema';
import { COLLECTION_CONST } from 'src/config/collection.constant';

// Base schema definition
@Schema({ collection: COLLECTION_CONST().CRM_GIFT_GALLERY_LIKES })
export class Base extends Document {
    // You can add other fields for the Base schema here, if needed
}

const GiftGalleryLikeSchema = SchemaFactory.createForClass(Base);

// Adding ParentSchema to Base schema
GiftGalleryLikeSchema.add(ParentSchema.obj);

// GiftGallery model class definition
@Schema()
export class GiftGalleryLikeModel extends Document {
    // Define the fields for GiftGalleryLikeModel schema if needed

    @Prop({ type: Number, required: true })
    org_id: number;

    @Prop({ type: Types.ObjectId })
    customer_id: Types.ObjectId;

    @Prop({ type: Types.ObjectId, required: true })
    gift_id: Types.ObjectId;

}

const childSchema = SchemaFactory.createForClass(GiftGalleryLikeModel);

// Add GiftGalleryLikeModel schema properties to base schema if required
GiftGalleryLikeSchema.add(childSchema.obj);

export { GiftGalleryLikeSchema };
