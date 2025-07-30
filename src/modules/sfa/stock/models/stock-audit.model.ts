import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { ParentSchema } from 'src/common/schema/parent.schema';
import { COLLECTION_CONST } from 'src/config/collection.constant';
import { preUpdateHook } from 'src/common/hooks/pre-update';

@Schema({ collection: COLLECTION_CONST().CRM_STOCK_AUDIT })
export class Base extends Document {}
const StockAuditSchema = SchemaFactory.createForClass(Base);
StockAuditSchema.add(ParentSchema.obj);
@Schema()
export class StockAuditModel extends Document {
  
  @Prop({ type: Number, required: true })
  org_id: number;
  
  @Prop({ type: Types.ObjectId, required: true })
  customer_id: Types.ObjectId;
  
  @Prop({ type: String })
  customer_name: string;
  
  @Prop({ type: Types.ObjectId })
  customer_type_id: Types.ObjectId;
  
  @Prop({ type: String })
  customer_type_name: string;
  
  @Prop({ type: Types.ObjectId })
  audit_by_id: Types.ObjectId;
  
  @Prop({ type: String })
  audit_by_name: string;
  
  @Prop({ type: [Object], default: [] }) 
  audit_report: Record<string, any>[];
  
  @Prop({ type: String })
  audit_no: string;

  @Prop({ type: Types.ObjectId })
  visit_activity_id: Types.ObjectId;
  
}

const childSchema = SchemaFactory.createForClass(StockAuditModel);
StockAuditSchema.add(childSchema.obj);
StockAuditSchema.pre('findOneAndUpdate', preUpdateHook);
StockAuditSchema.pre('updateOne', preUpdateHook);
StockAuditSchema.pre('updateMany', preUpdateHook);

export { StockAuditSchema };
