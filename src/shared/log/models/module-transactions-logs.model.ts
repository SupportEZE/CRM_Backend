import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document,Types } from 'mongoose';
import { ParentSchema } from 'src/common/schema/parent.schema';
import { COLLECTION_CONST } from 'src/config/collection.constant';

@Schema({ collection: COLLECTION_CONST().CRM_MODULE_TRANSACTION_LOG })
export class Base extends Document {}
const ModuleTransactionLogSchema = SchemaFactory.createForClass(Base);
ModuleTransactionLogSchema.add(ParentSchema.obj);

@Schema()
export class ModuleTransactionLogModel extends Document {

  @Prop({ type: Number, required: true })
  org_id: number;

  @Prop({ type: Number, required: true })
  module_id: number;

  @Prop({ type: String, required: true })
  module_name: string;

  @Prop({ type: String, required: true })
  module_type: string;

  @Prop({ type: String, required: true })
  action: string;

  @Prop({ type: Object })
  changes?: Record<string, any>;

  @Prop({ type: String})
  message: string;

  @Prop({ type: Types.ObjectId})
  row_id: string;

}

const childSchema = SchemaFactory.createForClass(ModuleTransactionLogModel);
ModuleTransactionLogSchema.add(childSchema.obj);
export { ModuleTransactionLogSchema };
