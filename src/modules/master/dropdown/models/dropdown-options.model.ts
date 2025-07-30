import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types, Schema as MongooseSchema } from 'mongoose';
import { ParentSchema } from 'src/common/schema/parent.schema';
import { COLLECTION_CONST } from 'src/config/collection.constant';
import { preUpdateHook } from 'src/common/hooks/pre-update';
@Schema({ collection: COLLECTION_CONST().CRM_DROPDOWN_OPTIONS })
export class Base extends Document { }
const OptionSchema = SchemaFactory.createForClass(Base);
OptionSchema.add(ParentSchema.obj);

@Schema()
export class OptionModel extends Document {

  @Prop({ type: Number, required: true, index: true })
  org_id: number;

  @Prop({ type: Number, required: true, index: true })
  module_id: number;

  @Prop({ type: String, required: true })
  module_name: string;

  @Prop({ type: String, enum: ['parent', 'child'], required: true })
  module_type: 'parent' | 'child';

  @Prop({ type: Types.ObjectId, required: true, ref: COLLECTION_CONST().CRM_DROPDOWNS, index: true })
  dropdown_id: Types.ObjectId;

  @Prop({ type: String, required: true })
  dropdown_name: string;

  @Prop({ type: MongooseSchema.Types.Mixed, required: true })
  option_name: string | number;

  @Prop({ type: MongooseSchema.Types.Mixed, required: true })
  value: string | number;

  @Prop({ type: MongooseSchema.Types.Mixed })
  dependent_option_name: string | number;

  @Prop({ type: MongooseSchema.Types.Mixed })
  dependent_option_value: string | number;

}

const childSchema = SchemaFactory.createForClass(OptionModel);
OptionSchema.add(childSchema.obj);

OptionSchema.pre('findOneAndUpdate', preUpdateHook);
OptionSchema.pre('updateOne', preUpdateHook);
OptionSchema.pre('updateMany', preUpdateHook);

export { OptionSchema };
