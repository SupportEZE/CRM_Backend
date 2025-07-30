import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { ParentSchema } from 'src/common/schema/parent.schema';
import { COLLECTION_CONST } from 'src/config/collection.constant';


@Schema({ collection: COLLECTION_CONST().CRM_DEFAULT_FORMS })
export class Base extends Document { }
const DefaultFormSchema = SchemaFactory.createForClass(Base);
DefaultFormSchema.add(ParentSchema.obj);

@Schema()
export class DefaultFormModel extends Document {

  @Prop({ type: Number, default: 0 })
  org_id: number;

  @Prop({ required: true, maxlength: 20, enum: ['app', 'web'] })
  platform: string;

  @Prop({ required: true, unique: true })
  form_id: number;

  @Prop({ required: true, type: Object })
  form_data: Record<string, any>;

  @Prop({ required: true, maxlength: 20 })
  form_type: string;

  @Prop({required:true})
  form_name: string;

  @Prop({ default: 'default' })
  form_source?: string
}

const childSchema = SchemaFactory.createForClass(DefaultFormModel);
DefaultFormSchema.add(childSchema.obj);
export { DefaultFormSchema };
