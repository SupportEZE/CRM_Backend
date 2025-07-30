import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { ParentSchema } from 'src/common/schema/parent.schema';
import { COLLECTION_CONST } from 'src/config/collection.constant';
@Schema({ collection: COLLECTION_CONST().CRM_SITE_CONTACT })
export class Base extends Document { }
const SitesContactSchema = SchemaFactory.createForClass(Base);
SitesContactSchema.add(ParentSchema.obj);
@Schema()
export class SitesContactModel extends Document {

  @Prop({ type: Number })
  org_id: number;

  @Prop({ type: Types.ObjectId })
  site_project_id: string;

  @Prop({ type: String })
  designation: string;

  @Prop({ type: String, required: true })
  contact_person_name: string;

  @Prop({ type: String, required: true })
  contact_person_mobile: string;

}

const childSchema = SchemaFactory.createForClass(SitesContactModel);
SitesContactSchema.add(childSchema.obj);
export { SitesContactSchema };