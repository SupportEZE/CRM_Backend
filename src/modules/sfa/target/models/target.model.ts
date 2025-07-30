import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema, Types } from 'mongoose';
import { ParentSchema } from 'src/common/schema/parent.schema';
import { COLLECTION_CONST } from 'src/config/collection.constant';
import { preUpdateHook } from 'src/common/hooks/pre-update';

export enum AdditionalTarget{
    PRIMARY_SALE_TARGET="Primary Sale Target",
    SECONDARY_SALE="Secondary Sale",
    NEW_CUSTOMER="New Customer",
    ENQUIRY_COLSE = "Enquiry Close",
    SITE_CREATION = "Site Creation",
    SITE_COLSE = "Site Close",
    CUSTOMER_VISIT = "Customer Visit",
    EVENT = "Event",
    INFLUENCER_REGISTRATION="Influencer Registration",
    PAYMENT_COLLECTION="Payment Collection",
    CATEGORY  = "Category",
    PRODUCT ="Product"
}



@Schema({ collection: COLLECTION_CONST().CRM_TARGET })
export class Base extends Document { }
const TargetSchema = SchemaFactory.createForClass(Base);
TargetSchema.add(ParentSchema.obj);

@Schema()
export class TargetModel extends Document {
    @Prop({ type: Number})
    org_id: number;
    
    @Prop({ type: String, required: true })
    title: string;
    
    @Prop({ type: Number })
    sale_value: number;
    
    @Prop({ type: Date, required: true })
    start_date: Date;
    
    @Prop({ type: Date, required: true })
    end_date: Date;
    
    // @Prop({ type: Number })
    // login_type_id: number;
    
    // @Prop({ type: String })
    // login_type_name: string;
    
    @Prop({ type: String })
    target_type: string;
    
    @Prop({ type: Boolean })
    is_additional_target: boolean;
    
    @Prop({ type: Object })
    additional_target?: Record<string, any>;
    
    @Prop({ type: Types.ObjectId })
    customer_type_id: Types.ObjectId;
    
    @Prop({ type: Types.ObjectId })
    assign_to_id: Types.ObjectId;
    
    @Prop({ type: String })
    assign_to_name: string;
    
}

const childSchema = SchemaFactory.createForClass(TargetModel);
TargetSchema.add(childSchema.obj);

// Applying the same update hook for all the update operations
TargetSchema.pre('findOneAndUpdate', preUpdateHook);
TargetSchema.pre('updateOne', preUpdateHook);
TargetSchema.pre('updateMany', preUpdateHook);

export { TargetSchema };