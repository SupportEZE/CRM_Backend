import { Prop, Schema, SchemaFactory, } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { ParentSchema } from 'src/common/schema/parent.schema';
import { COLLECTION_CONST } from 'src/config/collection.constant';
import { preUpdateHook } from 'src/common/hooks/pre-update';

@Schema({ collection: COLLECTION_CONST().CRM_POINT_CAT_QRCODES })
export class Base extends Document { }
const PointCatQrcodeSchema = SchemaFactory.createForClass(Base);
PointCatQrcodeSchema.add(ParentSchema.obj);

@Schema()
export class PointCatQrcodeModel extends Document {
    @Prop({ type: Number, required: true, index: true })
    org_id: number;

    @Prop({
        type: String,
        required: true,
        unique: true,
        minlength: 5,
        maxlength: 100,
        index: true,
    })
    qr_item_code: string;

    @Prop({
        type: Types.ObjectId,
        required: true,
        ref: COLLECTION_CONST().CRM_POINT_CATEGORY,
        index: true,
    })
    point_category_id: Types.ObjectId;

    @Prop({ type: String, maxlength: 500 })
    remark?: string;

    @Prop({
        type: Types.ObjectId,
        ref: 'QRCode',
        index: true,
    })
    qrcode_genrator_id?: Types.ObjectId;

    @Prop({ type: Object, default: {} })
    form_data?: Record<string, any>;
}

const childSchema = SchemaFactory.createForClass(PointCatQrcodeModel);
PointCatQrcodeSchema.add(childSchema.obj);

PointCatQrcodeSchema.pre('findOneAndUpdate', preUpdateHook);
PointCatQrcodeSchema.pre('updateOne', preUpdateHook);
PointCatQrcodeSchema.pre('updateMany', preUpdateHook);

export { PointCatQrcodeSchema };
