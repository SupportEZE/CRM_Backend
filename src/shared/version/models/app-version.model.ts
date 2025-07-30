import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document,Types } from 'mongoose';
import { COLLECTION_CONST } from 'src/config/collection.constant';

@Schema({ collection: COLLECTION_CONST().CRM_APP_VERSION })
export class Base extends Document {}
const AppVersionSchema = SchemaFactory.createForClass(Base);

@Schema()
export class AppVersionModel extends Document {

  @Prop({ type: Number, required: true })
  org_id: number;

  @Prop({ type: String, required: true })
  app_id: string;

  @Prop({ type: String, required: true })
  ios_version: string;

  @Prop({ type: String, required: true })
  android_version: string;

  @Prop({ type: String, required: true })
  ios_url: string;

  @Prop({ type: String, required: true })
  android_url: string;

  @Prop({ type: String, required: true })
  message: string;

  @Prop({ type: Number, required: true })
  update_flag: number;
}

const childSchema = SchemaFactory.createForClass(AppVersionModel);
AppVersionSchema.add(childSchema.obj);
export { AppVersionSchema };
