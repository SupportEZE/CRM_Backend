import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import { ParentSchema } from 'src/common/schema/parent.schema';
import { preUpdateHook } from 'src/common/hooks/pre-update';
import { COLLECTION_CONST } from 'src/config/collection.constant';
@Schema({ collection: COLLECTION_CONST().CRM_FAQ })
export class Base extends Document {
}

const FaqSchema = SchemaFactory.createForClass(Base);
FaqSchema.add(ParentSchema.obj);
@Schema()
export class FaqModel extends Document {
  @Prop({ type: Number, required: true, min: 1 })
  org_id: number;

  @Prop({ type: Number, enum: [0, 1], default: 1 })
  status: number;

  @Prop({ type: String, required: true, trim: true })
  question: string;

  @Prop({ type: String, required: true, trim: true })
  answer: string;
}

const childSchema = SchemaFactory.createForClass(FaqModel);
FaqSchema.add(childSchema.obj);

FaqSchema.pre('findOneAndUpdate', preUpdateHook);
FaqSchema.pre('updateOne', preUpdateHook);
FaqSchema.pre('updateMany', preUpdateHook);

export { FaqSchema };
