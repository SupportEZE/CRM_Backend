import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { ParentSchema } from 'src/common/schema/parent.schema';
import { COLLECTION_CONST } from 'src/config/collection.constant';
import { preUpdateHook } from 'src/common/hooks/pre-update';
@Schema({ collection: COLLECTION_CONST().CRM_BONUS_REFERRAL_MASTER })
export class Base extends Document {
}

const ReferralBonusSchema = SchemaFactory.createForClass(Base);
ReferralBonusSchema.add(ParentSchema.obj);
@Schema()
export class ReferralBonusModel extends Document {

  @Prop({ type: Number, required: true, index: true })
  org_id: number;

  @Prop({
    type: String,
    required: true,
    index: true
  })
  bonus_type: string;

  @Prop({ type: Number, required: true })
  login_type_id: number;

  @Prop({ type: [String], default: [] })
  customer_type_name: string[];

  @Prop({ type: Types.ObjectId, default: null })
  customer_type_id: string;

  @Prop({ type: Number, default: 0, min: 0 })
  bonus_point: number;

  @Prop({ type: String })
  template: string;

  @Prop({
    type: String,
    required: true,
    enum: ['Active', 'Inactive'],
    default: 'Active',
    index: true
  })
  status: string;
}

const childSchema = SchemaFactory.createForClass(ReferralBonusModel);
ReferralBonusSchema.add(childSchema.obj);


ReferralBonusSchema.pre('findOneAndUpdate', preUpdateHook);
ReferralBonusSchema.pre('updateOne', preUpdateHook);
ReferralBonusSchema.pre('updateMany', preUpdateHook);

export { ReferralBonusSchema };