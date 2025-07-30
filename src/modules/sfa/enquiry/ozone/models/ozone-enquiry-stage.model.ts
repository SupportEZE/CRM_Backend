import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { ParentSchema } from 'src/common/schema/parent.schema';
import { COLLECTION_CONST } from 'src/config/collection.constant';

@Schema({ collection: COLLECTION_CONST().CRM_OZONE_ENQUIRY_STAGE })
export class Base extends Document { }
const OzoneEnquiryStageSchema = SchemaFactory.createForClass(Base);
OzoneEnquiryStageSchema.add(ParentSchema.obj);
@Schema()
export class OzoneEnquiryStageModel extends Document {
  @Prop({ type: Types.ObjectId })
  enquiry_id: string;

  @Prop({ type: String })
  stage: string;

  @Prop({ type: Boolean, default: false })
  checked: boolean;
}

const childSchema = SchemaFactory.createForClass(OzoneEnquiryStageModel);
OzoneEnquiryStageSchema.add(childSchema.obj);
export { OzoneEnquiryStageSchema };