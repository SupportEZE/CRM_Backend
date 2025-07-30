import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { ParentSchema } from 'src/common/schema/parent.schema';
import { COLLECTION_CONST } from 'src/config/collection.constant';
import { preUpdateHook } from 'src/common/hooks/pre-update';

@Schema({ collection: COLLECTION_CONST().CRM_ANNOUNCEMENT_READ })
export class Base extends Document {
}

const AnnouncementReadSchema = SchemaFactory.createForClass(Base);
AnnouncementReadSchema.add(ParentSchema.obj);
@Schema()
export class AnnouncementReadModel extends Document {
  @Prop({ type: Number, required: true, min: 1 })
  org_id: number;

  @Prop({ type: Types.ObjectId, required: true })
  announcement_id: Types.ObjectId;

  @Prop({ type: String, maxlength: 100, required: true })
  customer_name: string;

  @Prop({ type: Types.ObjectId, required: true })
  customer_id: Types.ObjectId;

  @Prop({ type: Boolean, default: false })
  is_read: boolean;
}

const childSchema = SchemaFactory.createForClass(AnnouncementReadModel);
AnnouncementReadSchema.add(childSchema.obj);

AnnouncementReadSchema.pre('findOneAndUpdate', preUpdateHook);
AnnouncementReadSchema.pre('updateOne', preUpdateHook);
AnnouncementReadSchema.pre('updateMany', preUpdateHook);

export { AnnouncementReadSchema };
