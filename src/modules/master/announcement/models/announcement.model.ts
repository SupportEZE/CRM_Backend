import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { ParentSchema } from 'src/common/schema/parent.schema';
import { COLLECTION_CONST } from 'src/config/collection.constant';
import { preUpdateHook } from 'src/common/hooks/pre-update';

@Schema({ collection: COLLECTION_CONST().CRM_ANNOUNCEMENT })
export class Base extends Document {
}

const AnnouncementSchema = SchemaFactory.createForClass(Base);
AnnouncementSchema.add(ParentSchema.obj);
@Schema()
export class AnnouncementModel extends Document {

  @Prop({ type: Number, required: true })
  org_id: number;

  @Prop({ type: String })
  customer_type_name: string;

  @Prop({ type: Types.ObjectId, required: true })
  customer_type_id: Types.ObjectId;

  @Prop({ type: String })
  login_type_name: string;

  @Prop({ type: Number })
  login_type_id: number;

  @Prop({ type: String })
  title: string;

  @Prop({ type: String })
  description: string;

  @Prop({ type: String })
  status: string;

  @Prop({ type: Boolean })
  push_notification: boolean;

  @Prop({ type: Boolean })
  in_app_notification: boolean;

  @Prop({ type: [String] })
  state: string[];
}

const childSchema = SchemaFactory.createForClass(AnnouncementModel);
AnnouncementSchema.add(childSchema.obj);

AnnouncementSchema.pre('findOneAndUpdate', preUpdateHook);
AnnouncementSchema.pre('updateOne', preUpdateHook);
AnnouncementSchema.pre('updateMany', preUpdateHook);

export { AnnouncementSchema };
