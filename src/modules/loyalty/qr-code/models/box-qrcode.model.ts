import { Prop, Schema, SchemaFactory, } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { ParentSchema } from 'src/common/schema/parent.schema';
import { COLLECTION_CONST } from 'src/config/collection.constant';
import { preUpdateHook } from 'src/common/hooks/pre-update';

@Schema({ collection: COLLECTION_CONST().CRM_BOX_QRCODES })
export class Base extends Document { }
const BoxQrcodeSchema = SchemaFactory.createForClass(Base);
BoxQrcodeSchema.add(ParentSchema.obj);

@Schema()
export class BoxQrcodeModel extends Document {
    @Prop({ type: Number, required: true, index: true })
    org_id: number;

    @Prop({ type: String, unique: true, required: true, minlength: 5, maxlength: 100 })
    qr_box_code: string;

    @Prop({
        type: Types.ObjectId,
        ref: COLLECTION_CONST().CRM_MASTER_BOX_QRCODES,
        index: true,
    })
    qr_master_box_id?: Types.ObjectId;

    @Prop({ type: String, maxlength: 100 })
    qr_master_box_code?: string;

    @Prop({ type: Number })
    box_size?: number;

    @Prop({ type: Boolean })
    box_with_item?: boolean;

    @Prop({
        type: Types.ObjectId,
        ref: COLLECTION_CONST().CRM_PRODUCTS,
        required: true,
        index: true,
    })
    product_id: Types.ObjectId;

    @Prop({ type: String, maxlength: 500 })
    remark?: string;

    @Prop({
        type: Types.ObjectId,
        ref: 'QRCode',
        index: true,
    })
    qrcode_genrator_id?: Types.ObjectId;

    @Prop({ type: Types.ObjectId })
    gate_pass_id: Types.ObjectId;

    @Prop({ type: Types.ObjectId })
    dispatch_id: Types.ObjectId;

    @Prop({ type: Types.ObjectId })
    item_id: Types.ObjectId;

    @Prop({ type: Types.ObjectId })
    customer_id: Types.ObjectId;

    @Prop({ type: Types.ObjectId })
    customer_type_id: Types.ObjectId;

    @Prop({ type: String })
    customer_type_name?: string;

    @Prop({ type: String })
    customer_name?: string;

    @Prop({ type: String })
    customer_mobile?: string;

    @Prop({ type: Types.ObjectId })
    order_id: Types.ObjectId;

    @Prop({ type: String })
    order_date?: string;

    @Prop({ type: String })
    order_no?: string;

    @Prop({ type: String })
    billing_company?: string;

    @Prop({ type: Object, default: {} })
    dispatch_cycle?: Record<string, any>;
}

const childSchema = SchemaFactory.createForClass(BoxQrcodeModel);
BoxQrcodeSchema.add(childSchema.obj);

BoxQrcodeSchema.pre('findOneAndUpdate', preUpdateHook);
BoxQrcodeSchema.pre('updateOne', preUpdateHook);
BoxQrcodeSchema.pre('updateMany', preUpdateHook);

export { BoxQrcodeSchema };
