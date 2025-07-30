import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document,Types } from 'mongoose';
import { ParentSchema } from 'src/common/schema/parent.schema';
import { COLLECTION_CONST } from 'src/config/collection.constant';


@Schema({ collection: COLLECTION_CONST().CRM_DEFAULT_TABLES })
export class Base extends Document {}
const DefaultTableSchema = SchemaFactory.createForClass(Base);
DefaultTableSchema.add(ParentSchema.obj);

@Schema()
export class DefaultTableModel extends Document {

  @Prop({ type: Number,default:0 })
  org_id: number;

  @Prop({ required: true, maxlength: 20, enum: ['app', 'web'] })
  platform: string;

  @Prop({ required: true,})
  table_id: number;

  @Prop({ required: true, type: Object })
  table_data: Record<string, any>;

  @Prop({default:'default'})
  table_source?:string
}

const childSchema = SchemaFactory.createForClass(DefaultTableModel);
DefaultTableSchema.add(childSchema.obj);
export { DefaultTableSchema };

