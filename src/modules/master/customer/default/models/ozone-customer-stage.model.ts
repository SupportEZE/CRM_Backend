import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { ParentSchema } from 'src/common/schema/parent.schema';
import { COLLECTION_CONST } from 'src/config/collection.constant';

@Schema({ collection: COLLECTION_CONST().CRM_OZONE_CUSTOMER_STAGAE })
export class Base extends Document { }
const OzoneProspectStageSchema = SchemaFactory.createForClass(Base);
OzoneProspectStageSchema.add(ParentSchema.obj);
@Schema()
export class OzoneProspectStageModel extends Document {
  @Prop({ type: Types.ObjectId })
  customer_id: string;

  @Prop({ type: String })
  stage: string;

  @Prop({ type: Boolean, default: false })
  checked: boolean;
}

const childSchema = SchemaFactory.createForClass(OzoneProspectStageModel);
OzoneProspectStageSchema.add(childSchema.obj);
export { OzoneProspectStageSchema };