import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { ParentSchema } from 'src/common/schema/parent.schema';
import { COLLECTION_CONST } from 'src/config/collection.constant';
import { preUpdateHook } from 'src/common/hooks/pre-update';
@Schema({ collection: COLLECTION_CONST().CRM_DROPDOWNS })
export class Base extends Document { }
const DropdownSchema = SchemaFactory.createForClass(Base);
DropdownSchema.add(ParentSchema.obj);

@Schema()
export class DropdownModel extends Document {

  @Prop({ type: Number, required: true, index: true })
  org_id: number;

  @Prop({ type: Number, required: true, index: true })
  module_id: number;

  @Prop({ type: String, required: true })
  module_name: string;

  @Prop({ type: String, enum: ['parent', 'child'], required: true })
  module_type: 'parent' | 'child';

  @Prop({ type: Boolean, default: false })
  dropdown_editable: boolean;

  @Prop({ type: String, required: true, maxlength: 100 })
  dropdown_name: string;

  @Prop({ type: String, required: true, maxlength: 100 })
  dropdown_display_name: string;

  @Prop({ type: String, maxlength: 100 })
  dependent_dropdown_name: string;

  @Prop({ type: Types.ObjectId })
  dependent_dropdown_id: string;

  @Prop({ type: String, maxlength: 100 })
  api_path: string;

  @Prop({ type: Number, default: 1 })
  status: number;
}

const childSchema = SchemaFactory.createForClass(DropdownModel);
DropdownSchema.add(childSchema.obj);

DropdownSchema.pre('findOneAndUpdate', preUpdateHook);
DropdownSchema.pre('updateOne', preUpdateHook);
DropdownSchema.pre('updateMany', preUpdateHook);

export { DropdownSchema };
