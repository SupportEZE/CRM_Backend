import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { ParentSchema } from 'src/common/schema/parent.schema';
import { COLLECTION_CONST } from 'src/config/collection.constant';

export const CustomerContactPersonCryptoFields = ['contact_person_mobile']

@Schema({ collection: COLLECTION_CONST().CRM_CUSTOMER_CONTACT_PERSON })
export class Base extends Document {}
const CustomerContactPersonSchema = SchemaFactory.createForClass(Base);
CustomerContactPersonSchema.add(ParentSchema.obj);

@Schema()
export class CustomerContactPersonModel extends Document {

  @Prop({ type: Number })
  org_id: number;

  @Prop({ type: Types.ObjectId, required: true })
  customer_id: number;

  @Prop({ type: String })
  designation: string;

  @Prop({ type: String, required: true })
  contact_person_name: string;

  @Prop({ type: String, required: true })
  contact_person_mobile: string;
}

const childSchema = SchemaFactory.createForClass(CustomerContactPersonModel);
CustomerContactPersonSchema.add(childSchema.obj);
export { CustomerContactPersonSchema };
