import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { ParentSchema } from 'src/common/schema/parent.schema';
import { COLLECTION_CONST } from 'src/config/collection.constant';
@Schema({ collection: COLLECTION_CONST().CRM_SITE_COMPETETOR })
export class Base extends Document { }
const SitesCompetetorSchema = SchemaFactory.createForClass(Base);
SitesCompetetorSchema.add(ParentSchema.obj);
@Schema()
export class SitesComptetorModel extends Document {

  @Prop({ type: Number })
  org_id: number;

  @Prop({ type: Types.ObjectId })
  site_project_id: string;

  @Prop({ type: String })
  competitor: string;

  @Prop({ type: Boolean, default: false })
  checked: boolean;

}

const childSchema = SchemaFactory.createForClass(SitesComptetorModel);
SitesCompetetorSchema.add(childSchema.obj);
export { SitesCompetetorSchema };