import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document,Types } from 'mongoose';
import { ParentSchema } from 'src/common/schema/parent.schema';
import { COLLECTION_CONST } from 'src/config/collection.constant';


@Schema({ collection: COLLECTION_CONST().CRM_CUSTOM_TABLES })
export class Base extends Document {}
const CustomTableSchema = SchemaFactory.createForClass(Base);
CustomTableSchema.add(ParentSchema.obj);

@Schema()
export class CustomTableModel extends Document {

  @Prop({ type: Number })
  org_id: number;

  @Prop({ required: true, maxlength: 20, enum: ['app', 'web'] })
  platform: string;

  @Prop({ required: true,})
  table_id: number;

  @Prop({ required: true, type: Object })
  table_data: Record<string, any>;

  @Prop({default:'custom'})
  table_source?:string
}

const childSchema = SchemaFactory.createForClass(CustomTableModel);
CustomTableSchema.add(childSchema.obj);
export { CustomTableSchema };



