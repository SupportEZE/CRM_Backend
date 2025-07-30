import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import { ParentSchema } from 'src/common/schema/parent.schema';
import { COLLECTION_CONST } from 'src/config/collection.constant';
import { preUpdateHook } from 'src/common/hooks/pre-update';


@Schema({ collection: COLLECTION_CONST().CRM_ABOUT })
export class Base extends Document {
}
const AboutSchema = SchemaFactory.createForClass(Base);
AboutSchema.add(ParentSchema.obj);
@Schema()
export class AboutModel extends Document {
  @Prop({ type: Number, required: true, min: 1 })
  org_id: number;

  @Prop({ type: String, required: true, trim: true })
  about_us: string;
}

const childSchema = SchemaFactory.createForClass(AboutModel);
AboutSchema.add(childSchema.obj);

AboutSchema.pre('findOneAndUpdate', preUpdateHook);
AboutSchema.pre('updateOne', preUpdateHook);
AboutSchema.pre('updateMany', preUpdateHook);

export { AboutSchema };
