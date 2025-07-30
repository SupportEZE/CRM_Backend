import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { ParentSchema } from 'src/common/schema/parent.schema';
import { COLLECTION_CONST } from 'src/config/collection.constant';
@Schema({ collection: COLLECTION_CONST().CRM_COMMENT })
export class Base extends Document { }
const CommentSchema = SchemaFactory.createForClass(Base);
CommentSchema.add(ParentSchema.obj);
@Schema()
export class CommentModel extends Document {

  @Prop({ type: Number })
  org_id: number;

  @Prop({ type: Types.ObjectId, required: true })
  row_id: string;

  @Prop({ type: Number })
  module_id: number;

  @Prop({ type: String })
  module_name: string;

  @Prop({ type: String })
  module_type: string;

  @Prop({ type: Types.ObjectId })
  user_id: string;

  @Prop({ type: String })
  user_name: string;

  @Prop({ type: String, required: true })
  comment: string;

}

const childSchema = SchemaFactory.createForClass(CommentModel);
CommentSchema.add(childSchema.obj);
export { CommentSchema };