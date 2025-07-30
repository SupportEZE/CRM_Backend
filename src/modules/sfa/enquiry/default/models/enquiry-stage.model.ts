import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { ParentSchema } from 'src/common/schema/parent.schema';
import { COLLECTION_CONST } from 'src/config/collection.constant';
@Schema({ collection: COLLECTION_CONST().CRM_ENQUIRY_STAGE })
export class Base extends Document { }
const EnquiryStageSchema = SchemaFactory.createForClass(Base);
EnquiryStageSchema.add(ParentSchema.obj);
@Schema()
export class EnquiryStageModel extends Document {

  @Prop({ type: Number })
  org_id: number;

  @Prop({ type: Types.ObjectId })
  enquiry_id: string;

  @Prop({ type: String })
  stage: string;

  @Prop({ type: Boolean, default: false })
  checked: boolean;

}

const childSchema = SchemaFactory.createForClass(EnquiryStageModel);
EnquiryStageSchema.add(childSchema.obj);
export { EnquiryStageSchema };