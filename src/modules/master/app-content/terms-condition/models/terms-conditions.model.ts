import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import { ParentSchema } from 'src/common/schema/parent.schema';
import { COLLECTION_CONST } from 'src/config/collection.constant';

@Schema({ collection: COLLECTION_CONST().CRM_TERMS_CONDITION })
export class Base extends Document {}

const TermsConditionsSchema = SchemaFactory.createForClass(Base);
TermsConditionsSchema.add(ParentSchema.obj);

@Schema()
export class TermsConditionsModel extends Document {
  @Prop({ type: Number, required: true })
  org_id: number;

  @Prop({ type: String, required: true })
  terms_conditions: string;
}

const childSchema = SchemaFactory.createForClass(TermsConditionsModel);
TermsConditionsSchema.add(childSchema.obj);
export { TermsConditionsSchema };
