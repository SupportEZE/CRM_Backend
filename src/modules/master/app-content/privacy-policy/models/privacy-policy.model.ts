import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import { ParentSchema } from 'src/common/schema/parent.schema';
import { COLLECTION_CONST } from 'src/config/collection.constant';
import { preUpdateHook } from 'src/common/hooks/pre-update';

@Schema({ collection: COLLECTION_CONST().CRM_PRIVACY_POLICY })
export class Base extends Document { }

const PrivacyPolicySchema = SchemaFactory.createForClass(Base);
PrivacyPolicySchema.add(ParentSchema.obj);
@Schema()
export class PrivacyPolicyModel extends Document {
  @Prop({ type: Number, required: true, min: 1 })
  org_id: number;

  @Prop({ type: String, required: true, trim: true })
  privacy_policy: string;
}

const childSchema = SchemaFactory.createForClass(PrivacyPolicyModel);
PrivacyPolicySchema.add(childSchema.obj);

PrivacyPolicySchema.pre('findOneAndUpdate', preUpdateHook);
PrivacyPolicySchema.pre('updateOne', preUpdateHook);
PrivacyPolicySchema.pre('updateMany', preUpdateHook);

export { PrivacyPolicySchema };
