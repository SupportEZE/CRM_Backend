import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import { ParentSchema } from 'src/common/schema/parent.schema';
import { COLLECTION_CONST } from 'src/config/collection.constant';
import { Schema as MongooseSchema } from 'mongoose';


@Schema({ collection: COLLECTION_CONST().CRM_MODULE_MASTER })
export class ModuleMasterModel extends Document {

  @Prop({ required: true })
  org_id: number;

  @Prop({ required: true })
  module_name: string;

  @Prop({ required: true })
  module_id: number;

  @Prop({ required: true })
  module_type: string;

  @Prop({ required: true })
  root_id: number;

  @Prop({ required: true })
  path: string;

  @Prop({ required: true })
  type: string;


  @Prop({ required: true })
  SFA: boolean;

  @Prop({ required: true })
  DMS: boolean;

  @Prop({ required: true })
  IRP: boolean;

  @Prop({ required: true })
  WMS: boolean;

  @Prop({ required: true })
  WCMS: boolean;

  @Prop({ required: true })
  sequence: number;

  @Prop({ required: true })
  login_type_id: number[];

  @Prop({ required: true })
  icon: string;

  @Prop({ required: true })
  scan: boolean;

  @Prop({ required: true })
  purchase: boolean;
}

const ModuleMasterSchema = SchemaFactory.createForClass(ModuleMasterModel);
ModuleMasterSchema.add(ParentSchema.obj);

export { ModuleMasterSchema };
