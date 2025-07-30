import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { ParentSchema } from 'src/common/schema/parent.schema';
import { preUpdateHook } from 'src/common/hooks/pre-update';
import { COLLECTION_CONST } from 'src/config/collection.constant';

@Schema({ collection: COLLECTION_CONST().CRM_DOCUMENTS })
export class Base extends Document { }

const DocumentSchema = SchemaFactory.createForClass(Base);
DocumentSchema.add(ParentSchema.obj);

@Schema()
export class DocumentModel extends Document {

  @Prop({ type: Number, required: true, min: 1 })
  org_id: number;

  @Prop({ type: [Number], default: [] })
  login_type_id?: number[];

  @Prop({ type: [String], default: [] })
  login_type_name?: string[];

  @Prop({ type: [String], default: [] })
  customer_type_name?: string[];

  @Prop({ type: Types.ObjectId, default: null })
  customer_type_id?: string;

  @Prop({ type: String, trim: true, required: true })
  title: string;

  @Prop({ type: String, trim: true, required: true })
  country: string;

  @Prop({ type: Object, default: {} })
  form_data?: Record<string, any>;
}

const childSchema = SchemaFactory.createForClass(DocumentModel);
DocumentSchema.add(childSchema.obj);

DocumentSchema.pre('findOneAndUpdate', preUpdateHook);
DocumentSchema.pre('updateOne', preUpdateHook);
DocumentSchema.pre('updateMany', preUpdateHook);

export { DocumentSchema };
