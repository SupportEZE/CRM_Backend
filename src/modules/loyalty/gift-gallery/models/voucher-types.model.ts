import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { ParentSchema } from 'src/common/schema/parent.schema';
import { COLLECTION_CONST } from 'src/config/collection.constant';

@Schema({ collection: COLLECTION_CONST().CRM_VOUCHER_TYPES })
export class Base extends Document {
}

const VoucherSchema = SchemaFactory.createForClass(Base);
VoucherSchema.add(ParentSchema.obj);
@Schema()
export class VoucherModel extends Document {
    @Prop({ type: Number, required: true, index: true })
    org_id: number;

    @Prop({ type: String })
    voucher_title: string;

    @Prop({ type: String, required: true, unique: true, index: true })
    voucher_code: string;

    @Prop({ type: Number, required: true, index: true })
    voucher_amount: number;

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

const childSchema = SchemaFactory.createForClass(VoucherModel);
VoucherSchema.add(childSchema.obj);

export { VoucherSchema };
