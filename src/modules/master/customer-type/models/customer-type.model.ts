import { Prop, Schema, SchemaFactory, } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { ParentSchema } from 'src/common/schema/parent.schema';
import { COLLECTION_CONST } from 'src/config/collection.constant';
import { preUpdateHook } from 'src/common/hooks/pre-update';
@Schema({ collection: COLLECTION_CONST().CRM_CUSTOMER_TYPES })
export class Base extends Document { }
const CustomerTypeSchema = SchemaFactory.createForClass(Base);
CustomerTypeSchema.add(ParentSchema.obj);

@Schema()
export class CustomerTypeModel extends Document {

  @Prop({ type: Number, required: true, index: true })
  org_id: number;

  @Prop({ type: Types.ObjectId, required: true, index: true })
  login_type_id: Types.ObjectId;

  @Prop({ type: String, required: true })
  login_type_name: string;

  @Prop({ type: String, required: false })
  customer_type_name?: string;

  @Prop({ type: String, required: true, index: true })
  identifier: string;

  @Prop({ type: String, enum: ['daily', 'monthly'], required: false })
  scan_limit_type?: 'daily' | 'monthly';

  @Prop({ type: Number, required: false })
  scan_limit?: number;

  @Prop({ type: Object, enum: ['item', 'box', 'point_category'] })
  allowed_qr_type?: Record<string, any>;

  @Prop({ type: Types.ObjectId })
  purchase_from_type_id: string;

  @Prop({ type: String })
  purchase_from_type_name: string;

  @Prop({ type: Boolean })
  is_checkin: boolean;

  @Prop({ type: Boolean })
  is_order: boolean;

  @Prop({ type: Number })
  sequance: number;
  

}

const childSchema = SchemaFactory.createForClass(CustomerTypeModel);
CustomerTypeSchema.add(childSchema.obj);

CustomerTypeSchema.pre('findOneAndUpdate', preUpdateHook);
CustomerTypeSchema.pre('updateOne', preUpdateHook);
CustomerTypeSchema.pre('updateMany', preUpdateHook);

export { CustomerTypeSchema };
