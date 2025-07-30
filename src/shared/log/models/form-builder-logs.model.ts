import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document,Types } from 'mongoose';
import { ParentSchema } from 'src/common/schema/parent.schema';
import { COLLECTION_CONST } from 'src/config/collection.constant';

@Schema({ collection: COLLECTION_CONST().CRM_FORM_BUILDER_LOG })
export class Base extends Document {}
const FormBuilderLogSchema = SchemaFactory.createForClass(Base);
FormBuilderLogSchema.add(ParentSchema.obj);

@Schema()
export class FormBuilderLogModel extends Document {

  @Prop({ type: Number, required: true })
  org_id: number;

  @Prop({ type: Number, required: true })
  module_id: number;

  @Prop({ type: String, required: true })
  module_name: string;

  @Prop({ type: String, required: true })
  module_type: string;

  @Prop({ type: Number, required: true })
  form_id: number;

  @Prop({ type: String})
  form_name: string;

  @Prop({ type: String, required: true })
  action: string;

  @Prop({ type: String, required: true })
  message: string;

}

const childSchema = SchemaFactory.createForClass(FormBuilderLogModel);
FormBuilderLogSchema.add(childSchema.obj);
export { FormBuilderLogSchema };
