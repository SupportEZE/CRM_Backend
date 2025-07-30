import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema, Types } from 'mongoose';
import { ParentSchema } from 'src/common/schema/parent.schema';
import { COLLECTION_CONST } from 'src/config/collection.constant';

@Schema({ collection: COLLECTION_CONST().CRM_BRAND_REQUEST })
export class Base extends Document { }
const BrandRequestModelSchema = SchemaFactory.createForClass(Base);
BrandRequestModelSchema.add(ParentSchema.obj);

@Schema()
export class BrandRequestModel extends Document {
    @Prop({ type: Number })
    org_id: number;
    
    @Prop({ type: String, required: true })
    brand_req_id: string;
    
    @Prop({ type: Types.ObjectId, required: true })
    customer_type_id: Types.ObjectId;
    
    @Prop({ type: String, required: true })
    customer_type_name: string;
    
    @Prop({ type: Types.ObjectId, required: true })
    customer_id: string;
    
    @Prop({ type: String, required: true })
    customer_name: string;
    
    @Prop({ type: String, required: true })
    branding_product: string;
    
    @Prop({ type: String, required: true })
    remark: string;
    
    @Prop({ type: String, default: 'Pending' })
    status: string;
    
    @Prop({ type: String })
    reason: string;
    
    @Prop({ type: Object })
    form_data?: Record<string, any>;
}

const childSchema = SchemaFactory.createForClass(BrandRequestModel);
BrandRequestModelSchema.add(childSchema.obj);

export { BrandRequestModelSchema };