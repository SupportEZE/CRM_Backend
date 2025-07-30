import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema, Types } from 'mongoose';
import { ParentSchema } from 'src/common/schema/parent.schema';
import { COLLECTION_CONST } from 'src/config/collection.constant';

@Schema({ collection: COLLECTION_CONST().CRM_BRAND_AUDIT })
export class Base extends Document { }
const BrandAuditSchema = SchemaFactory.createForClass(Base);
BrandAuditSchema.add(ParentSchema.obj);

@Schema()
export class BrandAuditModel extends Document {
    @Prop({ type: Number })
    org_id: number;
    
    @Prop({ type: String, required: true })
    brand_audit_id: string;

    @Prop({ type: Types.ObjectId, required: true })
    customer_type_id: Types.ObjectId;

    @Prop({ type: String, required: true })
    customer_type_name: string;

    @Prop({ type: Types.ObjectId, required: true })
    customer_id: string;

    @Prop({ type: String, required: true })
    customer_name: string;

    @Prop({ type: String, required: true })
    competitors: string;

    @Prop({ type: String, required: true })
    remark: string;

    @Prop({ type: Types.ObjectId })
    visit_activity_id: Types.ObjectId;
    
    @Prop({ type: Object })
    form_data?: Record<string, any>;
}

const childSchema = SchemaFactory.createForClass(BrandAuditModel);
BrandAuditSchema.add(childSchema.obj);

export { BrandAuditSchema };