import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema, Types } from 'mongoose';
import { ParentSchema } from 'src/common/schema/parent.schema';
import { COLLECTION_CONST } from 'src/config/collection.constant';
import { preUpdateHook } from 'src/common/hooks/pre-update';

@Schema({ collection: COLLECTION_CONST().CRM_COMPLAINT_INSPECTION })
export class Base extends Document { }
const ComplaintInspectionSchema = SchemaFactory.createForClass(Base);
ComplaintInspectionSchema.add(ParentSchema.obj);

@Schema()
export class ComplaintInspectionModel extends Document {

    @Prop({ type: Number })
    org_id: number;
    
    @Prop({ type: String })
    complaint_no: string;

    @Prop({ type: Types.ObjectId })
    complaint_id: Types.ObjectId;

    @Prop({ type: Types.ObjectId })
    service_engineer_id: Types.ObjectId;

    @Prop({ type: String })
    product_verification: string;

    @Prop({ type: String })
    warranty_verification: string;

    @Prop({ type: String })
    purchase_bill: string;

    @Prop({ type: String })
    warranty_slip: string;

    @Prop({ type: String })
    purchase_location: string;

    @Prop({ type: String })
    inspection_remarks: string;

    @Prop({ type: String })
    resolution_type: string;

    
}

const childSchema = SchemaFactory.createForClass(ComplaintInspectionModel);
ComplaintInspectionSchema.add(childSchema.obj);

ComplaintInspectionSchema.pre('findOneAndUpdate', preUpdateHook);
ComplaintInspectionSchema.pre('updateOne', preUpdateHook);
ComplaintInspectionSchema.pre('updateMany', preUpdateHook);

export { ComplaintInspectionSchema };