import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema, Types } from 'mongoose';
import { ParentSchema } from 'src/common/schema/parent.schema';
import { COLLECTION_CONST } from 'src/config/collection.constant';
import { preUpdateHook } from 'src/common/hooks/pre-update';

@Schema({ collection: COLLECTION_CONST().CRM_COMPLAINT_SPARE_PART })
export class Base extends Document { }
const ComplaintSparePartSchema = SchemaFactory.createForClass(Base);
ComplaintSparePartSchema.add(ParentSchema.obj);

@Schema()
export class ComplaintSparePartModel extends Document {

    @Prop({ type: Number })
    org_id: number;
    
    @Prop({ type: String })
    complaint_no: string;

    @Prop({ type: Types.ObjectId })
    complaint_id: Types.ObjectId;

    @Prop({ type: Types.ObjectId })
    product_id: Types.ObjectId;

    @Prop({ type: String })
    product_name: string;

    @Prop({ type: String })
    transaction_qty: string;

    @Prop({ type: Types.ObjectId })
    installattion_by_id: Types.ObjectId;

    @Prop({ type: String })
    installattion_by_name: string;

    
}

const childSchema = SchemaFactory.createForClass(ComplaintSparePartModel);
ComplaintSparePartSchema.add(childSchema.obj);

ComplaintSparePartSchema.pre('findOneAndUpdate', preUpdateHook);
ComplaintSparePartSchema.pre('updateOne', preUpdateHook);
ComplaintSparePartSchema.pre('updateMany', preUpdateHook);

export { ComplaintSparePartSchema };