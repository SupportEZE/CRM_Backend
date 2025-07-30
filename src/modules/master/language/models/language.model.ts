import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types, Number } from 'mongoose';
import { ParentSchema } from 'src/common/schema/parent.schema';
import { COLLECTION_CONST } from 'src/config/collection.constant';
import { preUpdateHook } from 'src/common/hooks/pre-update';

@Schema({ collection: COLLECTION_CONST().CRM_LANGUAGE })
export class Base extends Document {
}

const LanguageSchema = SchemaFactory.createForClass(Base);
LanguageSchema.add(ParentSchema.obj);
@Schema()
export class LanguageModel extends Document {

  @Prop({ type: String, required: true, maxlength: 100 })
  language_label: string;

  @Prop({ type: String, required: true, maxlength: 10, unique: true, index: true })
  language_code: string;

}

const childSchema = SchemaFactory.createForClass(LanguageModel);
LanguageSchema.add(childSchema.obj);

LanguageSchema.pre('findOneAndUpdate', preUpdateHook);
LanguageSchema.pre('updateOne', preUpdateHook);
LanguageSchema.pre('updateMany', preUpdateHook);

export { LanguageSchema };
