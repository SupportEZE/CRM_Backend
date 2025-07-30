import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import { ParentSchema } from 'src/common/schema/parent.schema';
import { COLLECTION_CONST } from 'src/config/collection.constant';
import { preUpdateHook } from 'src/common/hooks/pre-update';

@Schema({ collection: COLLECTION_CONST().CRM_CONTACT })
export class Base extends Document {
}

const ContactSchema = SchemaFactory.createForClass(Base);
ContactSchema.add(ParentSchema.obj);
@Schema()
export class ContactModel extends Document {
  @Prop({ type: Number, required: true, min: 1 })
  org_id: number;

  @Prop({ type: String, trim: true, maxlength: 15, default: null })
  mobile?: string;

  @Prop({ type: String, trim: true, maxlength: 15, default: null })
  mobile_1?: string;

  @Prop({
    type: String,
    trim: true,
    lowercase: true,
    match: /^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$/,
    default: null,
  })
  email?: string;

  @Prop({ type: String, trim: true, default: null })
  website?: string;

  @Prop({ type: String, trim: true, default: null })
  address?: string;

  @Prop({ type: Number, default: null })
  latitude?: number;

  @Prop({ type: Number, default: null })
  longitude?: number;
}

const childSchema = SchemaFactory.createForClass(ContactModel);
ContactSchema.add(childSchema.obj);

ContactSchema.pre('findOneAndUpdate', preUpdateHook);
ContactSchema.pre('updateOne', preUpdateHook);
ContactSchema.pre('updateMany', preUpdateHook);

export { ContactSchema };
