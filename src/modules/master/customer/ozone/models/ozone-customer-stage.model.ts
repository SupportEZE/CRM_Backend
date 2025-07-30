import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { ParentSchema } from 'src/common/schema/parent.schema';
import { COLLECTION_CONST } from 'src/config/collection.constant';

@Schema({ collection: COLLECTION_CONST().CRM_OZONE_ENQUIRY_STAGE })
export class Base extends Document {}
const OzoneCustomerStageSchema = SchemaFactory.createForClass(Base);
OzoneCustomerStageSchema.add(ParentSchema.obj);
@Schema()
export class OzoneCustomerStageModel extends Document {}

const childSchema = SchemaFactory.createForClass(OzoneCustomerStageModel);
OzoneCustomerStageSchema.add(childSchema.obj);
export { OzoneCustomerStageSchema };
