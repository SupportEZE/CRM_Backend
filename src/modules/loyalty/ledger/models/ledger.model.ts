import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types, Number } from 'mongoose';
import { ParentSchema } from 'src/common/schema/parent.schema';
import { COLLECTION_CONST } from 'src/config/collection.constant';
import { preUpdateHook } from 'src/common/hooks/pre-update';


export enum TransactionType {
  CREDIT = 'credit',
  DEBIT = 'debit',
}

@Schema({ collection: COLLECTION_CONST().CRM_LEDGER })
export class Base extends Document {
}

const LedgerSchema = SchemaFactory.createForClass(Base);
LedgerSchema.add(ParentSchema.obj);
@Schema()
export class LedgerModel extends Document {
  @Prop({ type: Number, required: true, index: true })
  org_id: number;

  @Prop({ type: Number, default: () => Date.now(), index: true })
  timestamp: number;

  @Prop({ type: Types.ObjectId, required: true, index: true })
  customer_id: Types.ObjectId;

  @Prop({ type: String, required: true, index: true })
  customer_name: string;

  @Prop({ type: String, required: true })
  login_type_id: string;

  @Prop({ type: Types.ObjectId, required: true, index: true })
  customer_type_id: Types.ObjectId;

  @Prop({ type: String, enum: TransactionType, required: true })
  transaction_type: TransactionType;

  @Prop({ type: Number, required: true, min: 0 })
  balance: number;

  @Prop({ type: Number, required: true, min: 0 })
  points: number;

  @Prop({ type: String, maxlength: 500 })
  remark: string;

  @Prop({ type: String, index: true })
  transaction_id: string;

  @Prop({ type: String })
  creation_type: string;
}

const childSchema = SchemaFactory.createForClass(LedgerModel);
LedgerSchema.add(childSchema.obj);

// LedgerSchema.index({ customer_id: 1, transaction_id: 1 }, { unique: true });

LedgerSchema.pre('findOneAndUpdate', preUpdateHook);
LedgerSchema.pre('updateOne', preUpdateHook);
LedgerSchema.pre('updateMany', preUpdateHook);

export { LedgerSchema };
