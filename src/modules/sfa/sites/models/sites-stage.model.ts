import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { ParentSchema } from 'src/common/schema/parent.schema';
import { COLLECTION_CONST } from 'src/config/collection.constant';
@Schema({ collection: COLLECTION_CONST().CRM_SITE_STAGE })
export class Base extends Document { }
const SitesStageSchema = SchemaFactory.createForClass(Base);
SitesStageSchema.add(ParentSchema.obj);
@Schema()
export class SitesStageModel extends Document {

  @Prop({ type: Number })
  org_id: number;

  @Prop({ type: Types.ObjectId })
  site_project_id: string;

  @Prop({ type: String })
  stage: string;

  @Prop({ type: Boolean, default: false })
  checked: boolean;

}

const childSchema = SchemaFactory.createForClass(SitesStageModel);
SitesStageSchema.add(childSchema.obj);
export { SitesStageSchema };