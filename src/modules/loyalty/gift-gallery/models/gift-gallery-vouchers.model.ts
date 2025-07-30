import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { ParentSchema } from 'src/common/schema/parent.schema';
import { COLLECTION_CONST } from 'src/config/collection.constant';
export const GiftGalleryVoucherCryptoFields = ['voucher_code'];

@Schema({ collection: COLLECTION_CONST().CRM_GIFT_GALLERY_VOUCHER })
export class Base extends Document {
}

const GiftGalleryVoucherSchema = SchemaFactory.createForClass(Base);
GiftGalleryVoucherSchema.add(ParentSchema.obj);
@Schema()
export class GiftGalleryVoucherModel extends Document {
    @Prop({ type: Number, required: true, index: true })
    org_id: number;

    @Prop({ type: Types.ObjectId, required: true, ref: COLLECTION_CONST().CRM_CUSTOMERS, index: true })
    gift_id: Types.ObjectId;

    @Prop({ type: String })
    voucher_title: string;

    @Prop({ type: String, required: true, unique: true, index: true })
    voucher_code: string;

    @Prop({ type: Number, index: true })
    login_type_id: number;

    @Prop({ type: Types.ObjectId, index: true })
    customer_type_id: Types.ObjectId;

    @Prop({ type: String })
    customer_type_name: string;

    @Prop({ type: Types.ObjectId, index: true })
    customer_id: Types.ObjectId;

    @Prop({ type: String })
    customer_name: string;

    @Prop({ type: Date })
    expiry_date: Date;

    @Prop({ type: Types.ObjectId, index: true })
    redeem_id: Types.ObjectId;

    @Prop({ type: String })
    req_id: string;
}

const childSchema = SchemaFactory.createForClass(GiftGalleryVoucherModel);
GiftGalleryVoucherSchema.add(childSchema.obj);

export { GiftGalleryVoucherSchema };
