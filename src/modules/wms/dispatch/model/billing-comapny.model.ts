import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { ParentSchema } from 'src/common/schema/parent.schema';
import { COLLECTION_CONST } from 'src/config/collection.constant';
import { preUpdateHook } from 'src/common/hooks/pre-update';

@Schema({ collection: COLLECTION_CONST().CRM_BILLING_COMPANY })
export class Base extends Document {
}

const BillingCompanySchema = SchemaFactory.createForClass(Base);
BillingCompanySchema.add(ParentSchema.obj);

@Schema()
export class BillingCompanyModel extends Document {

    @Prop({ type: Number, required: true })
    org_id: number;

    @Prop({ type: Number, required: true })
    company_id: number;

    @Prop({ type: String, required: true })
    company_name: string
}

const childSchema = SchemaFactory.createForClass(BillingCompanyModel);
BillingCompanySchema.add(childSchema.obj);

BillingCompanySchema.pre('findOneAndUpdate', preUpdateHook);
BillingCompanySchema.pre('updateOne', preUpdateHook);
BillingCompanySchema.pre('updateMany', preUpdateHook);

export { BillingCompanySchema };
