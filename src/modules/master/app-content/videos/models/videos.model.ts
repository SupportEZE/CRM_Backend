import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { ParentSchema } from 'src/common/schema/parent.schema';
import { COLLECTION_CONST } from 'src/config/collection.constant';
import { preUpdateHook } from 'src/common/hooks/pre-update';


@Schema({ collection: COLLECTION_CONST().CRM_VIDEOS })
export class Base extends Document {
}

const VideosSchema = SchemaFactory.createForClass(Base);
VideosSchema.add(ParentSchema.obj);
@Schema()
export class VideosModel extends Document {
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

  @Prop({
    type: String,
    trim: true,
    required: true,
    match: /^(https?\:\/\/)?(www\.youtube\.com|youtu\.?be)\/.+$/,
  })
  youtube_url: string;

  @Prop({ type: String, trim: true, required: true })
  country: string;
}

const childSchema = SchemaFactory.createForClass(VideosModel);
VideosSchema.add(childSchema.obj);

VideosSchema.pre('findOneAndUpdate', preUpdateHook);
VideosSchema.pre('updateOne', preUpdateHook);
VideosSchema.pre('updateMany', preUpdateHook);


export { VideosSchema };
