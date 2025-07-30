import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { ParentSchema } from 'src/common/schema/parent.schema';
import { COLLECTION_CONST } from 'src/config/collection.constant';
import { preUpdateHook } from 'src/common/hooks/pre-update';

// Base schema definition
@Schema({ collection: COLLECTION_CONST().CRM_PAYMENT })
export class Base extends Document {
  // You can add other fields for the Base schema here, if needed
}

const PaymentSchema = SchemaFactory.createForClass(Base);

PaymentSchema.add(ParentSchema.obj);
@Schema()
export class PaymentModel extends Document {

  @Prop({ type: Number, required: true })
  org_id: number;

  @Prop({ type: Types.ObjectId ,required:true})
  customer_type_id: Types.ObjectId;

  @Prop({ type: String ,required:true})
  customer_type_name: string;

  @Prop({ type: Number, required: true })
  collected_from_login_type_id: number;

  @Prop({ type: Types.ObjectId, required: true })
  collected_from_id: Types.ObjectId;

  @Prop({ type: String, required: true })
  collected_from_name: string;

  @Prop({ type: Number, required: true })
  payment_to_login_type_id: number;

  @Prop({ type: Types.ObjectId, required: true })
  payment_to_id: Types.ObjectId;

  @Prop({ type: String, required: true })
  payment_to_name: string;

  @Prop({ type: Number, required: true })
  amount: number;

  @Prop({ type: String, required: true })
  payment_mode: string;

  @Prop({ type: String })
  transaction_id: string;

  @Prop({ type: Date })
  payment_date: Date;

  @Prop({ type: String })
  payment_no: string;

  @Prop({ type: String, default: 'Pending' })
  status: string;

  @Prop({ type: String })
  reason: string;

  @Prop({ type: Types.ObjectId })
  visit_activity_id: Types.ObjectId;

}

const childSchema = SchemaFactory.createForClass(PaymentModel);
PaymentSchema.add(childSchema.obj);
PaymentSchema.pre('findOneAndUpdate', preUpdateHook);
PaymentSchema.pre('updateOne', preUpdateHook);
PaymentSchema.pre('updateMany', preUpdateHook);

export { PaymentSchema };
