import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import { ParentSchema } from 'src/common/schema/parent.schema';
import { COLLECTION_CONST } from 'src/config/collection.constant';
import { Schema as MongooseSchema } from 'mongoose';

@Schema({ collection: COLLECTION_CONST().CRM_SUB_MODULE_MASTER })
export class SubModuleMasterModel extends Document {
  @Prop({ required: true })
  module_type: string;

  @Prop({ required: true })
  module_id: number;

  @Prop({ required: true })
  sub_module_name: string;


  @Prop({ required: true })
  sub_module_id: number;

  @Prop({ required: true })
  form_name: string;

  @Prop({ required: true })
  form_id: number;

  @Prop({ required: true })
  table_name: string;

  @Prop({ required: true })
  table_id: number;

  @Prop({ required: true })
  route_path: string;

  @Prop({ required: true })
  collection_name: string;

  @Prop({ required: true, type: MongooseSchema.Types.Mixed })
  department_name: Record<string, any>;

  @Prop({ required: true, type: MongooseSchema.Types.Mixed })
  app_list_access: Record<string, any>;

  @Prop({ required: true, type: MongooseSchema.Types.Mixed })
  app_detail_access: Record<string, any>;

  @Prop({ required: true, type: MongooseSchema.Types.Mixed })
  web_list_access: Record<string, any>;

  @Prop({ required: true, type: MongooseSchema.Types.Mixed })
  web_detail_access: Record<string, any>;

  @Prop({ required: true })
  super_admin_access: boolean;

  @Prop({ required: true })
  sequence: number;

  @Prop({ required: true, type: MongooseSchema.Types.Mixed })
  api_paths: Record<string, any>;
}

const SubModuleMasterMSchema = SchemaFactory.createForClass(SubModuleMasterModel);
SubModuleMasterMSchema.add(ParentSchema.obj);

export { SubModuleMasterMSchema };
