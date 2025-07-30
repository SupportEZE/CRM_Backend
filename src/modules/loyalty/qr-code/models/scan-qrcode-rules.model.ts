import { Prop, Schema, SchemaFactory, } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { ParentSchema } from 'src/common/schema/parent.schema';
import { COLLECTION_CONST } from 'src/config/collection.constant';
import { preUpdateHook } from 'src/common/hooks/pre-update';

@Schema({ collection: COLLECTION_CONST().CRM_SCAN_QRCODES_RULES })
export class Base extends Document { }
const QrcodeRuleSchema = SchemaFactory.createForClass(Base);
QrcodeRuleSchema.add(ParentSchema.obj);

@Schema()
export class QrcodeRuleModel extends Document {
    @Prop({ type: Number, required: true, index: true })
    org_id: number;

    @Prop({
        type: String,
        required: true,
        enum: ['item', 'box', 'point_category'],
        index: true,
    })
    qrcode_type: string;

    @Prop({ type: [Types.ObjectId], ref: 'CustomerType', default: [] })
    shared_customer_type_ids: Types.ObjectId[];
}
const childSchema = SchemaFactory.createForClass(QrcodeRuleModel);
QrcodeRuleSchema.add(childSchema.obj);

QrcodeRuleSchema.pre('findOneAndUpdate', preUpdateHook);
QrcodeRuleSchema.pre('updateOne', preUpdateHook);
QrcodeRuleSchema.pre('updateMany', preUpdateHook);
export { QrcodeRuleSchema };
