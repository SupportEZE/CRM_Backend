import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema, Types } from 'mongoose';
import { ParentSchema } from 'src/common/schema/parent.schema';
import { COLLECTION_CONST } from 'src/config/collection.constant';
import { preUpdateHook } from 'src/common/hooks/pre-update';

@Schema({ collection: COLLECTION_CONST().CRM_COMPLAINT })
export class Base extends Document { }
const ComplaintSchema = SchemaFactory.createForClass(Base);
ComplaintSchema.add(ParentSchema.obj);

@Schema()
export class ComplaintModel extends Document {

    @Prop({ type: Number })
    org_id: number;
    
    @Prop({ type: String })
    complaint_no: string;

    @Prop({ type: Types.ObjectId })
    customer_id: Types.ObjectId;

    @Prop({ type: String })
    customer_name: string;

    @Prop({ type: String, required: true })
    customer_mobile: string;

    @Prop({ type: String })
    alternate_mobile_no?: string;

    @Prop({ type: String })
    state: string;

    @Prop({ type: String })
    district: string;

    @Prop({ type: String })
    city: string;

    @Prop({ type: Number })
    pincode: number;

    @Prop({ type: String })
    address: string;

    @Prop({ type: Types.ObjectId, required: true })
    service_engineer_id: Types.ObjectId;

    @Prop({ type: String })
    service_engineer_name: string;

    @Prop({ type: String })
    service_engineer_mobile: string;
    
    @Prop({ type: String })
    nature_of_problem: string;

    @Prop({ type: String })
    priority: string;

    @Prop({ type: Date })
    visit_date: Date;  

    @Prop({ type: Date })
    date_of_purchase: Date;

    @Prop({ type: String })
    product_description: string;

    @Prop({ type: String })
    product_code: string;

    @Prop({ type: Types.ObjectId })
    product_id: Types.ObjectId;

    @Prop({ type: String })
    product_name: string;

    @Prop({ type: MongooseSchema.Types.Mixed })
    form_data?: Record<string, any>;

    @Prop({ type: String, default: 'Pending'})
    status: string;

    @Prop({ type: Date })
    inspection_date: Date; 

    @Prop({ type: String, default: 'Pending'})
    inspection_status: string;

    @Prop({ type: Date })
    status_updated_date: Date; 
 
    @Prop({ type: String })
    reschedule_reason: string;

    @Prop({ type: String })
    reason: string;

    @Prop({ type: Boolean, default: false })
    visit_flag: boolean;
    
}

const childSchema = SchemaFactory.createForClass(ComplaintModel);
ComplaintSchema.add(childSchema.obj);

ComplaintSchema.pre('findOneAndUpdate', preUpdateHook);
ComplaintSchema.pre('updateOne', preUpdateHook);
ComplaintSchema.pre('updateMany', preUpdateHook);

export { ComplaintSchema };