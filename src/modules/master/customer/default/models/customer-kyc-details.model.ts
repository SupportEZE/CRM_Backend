import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { ParentSchema } from 'src/common/schema/parent.schema';
import { COLLECTION_CONST } from 'src/config/collection.constant';


export enum KycStatusEnum {
  PENDING = 'Pending',
  APPROVED = 'Approved',
  REJECT = 'Reject',
}

@Schema({ collection: COLLECTION_CONST().CRM_CUSTOMER_KYC_DETAIL })
export class Base extends Document {}
const CustomerKycDetailSchema = SchemaFactory.createForClass(Base);
CustomerKycDetailSchema.add(ParentSchema.obj);

@Schema()
export class CustomerKycDetailModel extends Document {
  @Prop({ type: Number })
  org_id: number;

  @Prop({ type: Types.ObjectId, required: true })
  customer_id: number;

  @Prop({ type: String, enum: Object.values(KycStatusEnum) })
  kyc_status: KycStatusEnum;

  @Prop({ type: String })
  status_remark: string;
}

const childSchema = SchemaFactory.createForClass(CustomerKycDetailModel);
CustomerKycDetailSchema.add(childSchema.obj);

export { CustomerKycDetailSchema };
