import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { ParentSchema } from 'src/common/schema/parent.schema';
import { COLLECTION_CONST } from 'src/config/collection.constant';
export const CustomerBankDetailCryptoFields = ['upi_id', 'account_no', 'beneficiary_name', 'branch_name', 'bank_name', 'ifsc_code'];

@Schema({ collection: COLLECTION_CONST().CRM_CUSTOMER_BANK_DETAIL })

export class CustomerBankDetailModel extends Document {
  @Prop({ type: Number })
  org_id: number;

  @Prop({ type: Types.ObjectId, required: true })
  customer_id: Types.ObjectId;

  @Prop({ type: String })
  upi_id: string;

  @Prop({ type: String })
  account_no: string;

  @Prop({ type: String })
  beneficiary_name: string;

  @Prop({ type: String })
  branch_name: string;

  @Prop({ type: String })
  bank_name: string;

  @Prop({ type: String })
  ifsc_code: string;

  @Prop({ type: String })
  doc_file: string;

}

const CustomerBankDetailSchema = SchemaFactory.createForClass(CustomerBankDetailModel);
CustomerBankDetailSchema.add(ParentSchema.obj);
export { CustomerBankDetailSchema };
