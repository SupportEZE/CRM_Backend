import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document,Types } from 'mongoose';
import { ParentSchema } from 'src/common/schema/parent.schema';
import { COLLECTION_CONST } from 'src/config/collection.constant';
import { preSaveHook } from 'src/common/hooks/pre-save';
import { preUpdateHook } from 'src/common/hooks/pre-update';


@Schema({ collection: COLLECTION_CONST().CRM_CUSTOM_FORMS })
export class Base extends Document {}
const CustomFormSchema = SchemaFactory.createForClass(Base);
CustomFormSchema.add(ParentSchema.obj);

@Schema()
export class CustomFormModel extends Document {

  @Prop({ type: Number })
  org_id: number;

  @Prop({ required: true, maxlength: 20, enum: ['app', 'web'] })
  platform: string;

  @Prop({ required: true,})
  form_id: number;

  @Prop({ required: true, type: Object })
  form_data: Record<string, any>;

  @Prop({ required: true, maxlength: 20})
  form_type: string;

  @Prop({required:true})
  form_name: string;

  @Prop({default:'custom'})
  form_source?:string
}

const childSchema = SchemaFactory.createForClass(CustomFormModel);
childSchema.index({ form_id: 1, org_id: 1 }, { unique: true });
CustomFormSchema.add(childSchema.obj);
CustomFormSchema.pre('save', preSaveHook);
CustomFormSchema.pre('findOneAndUpdate', preUpdateHook);
CustomFormSchema.pre('updateOne', preUpdateHook);
CustomFormSchema.pre('updateMany', preUpdateHook);
export { CustomFormSchema };




