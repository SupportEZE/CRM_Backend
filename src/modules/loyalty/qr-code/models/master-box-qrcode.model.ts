import { Prop, Schema, SchemaFactory, } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { ParentSchema } from 'src/common/schema/parent.schema';
import { COLLECTION_CONST } from 'src/config/collection.constant';
import { preUpdateHook } from 'src/common/hooks/pre-update';

@Schema({ collection: COLLECTION_CONST().CRM_MASTER_BOX_QRCODES })
export class Base extends Document { }
const MasterBoxQrcodeSchema = SchemaFactory.createForClass(Base);
MasterBoxQrcodeSchema.add(ParentSchema.obj);

@Schema()
export class MasterBoxQrcodeModel extends Document {
  @Prop({ type: Number, required: true, index: true })
  org_id: number;

  @Prop({
    type: String,
    required: true,
    unique: true,
    minlength: 5,
    maxlength: 100,
    index: true,
  })
  qr_master_box_code: string;

  @Prop({ type: Types.ObjectId })
  dispatch_id: Types.ObjectId;

  @Prop({ type: Types.ObjectId })
  order_id: Types.ObjectId;

  @Prop({ type: String })
  order_no: string;

  @Prop({ type: Types.ObjectId })
  item_id: Types.ObjectId;

  @Prop({ type: Types.ObjectId })
  gate_pass_id: Types.ObjectId;

  @Prop({ type: Types.ObjectId })
  customer_id: Types.ObjectId;
}

const childSchema = SchemaFactory.createForClass(MasterBoxQrcodeModel);
MasterBoxQrcodeSchema.add(childSchema.obj);

MasterBoxQrcodeSchema.pre('findOneAndUpdate', preUpdateHook);
MasterBoxQrcodeSchema.pre('updateOne', preUpdateHook);
MasterBoxQrcodeSchema.pre('updateMany', preUpdateHook);

export { MasterBoxQrcodeSchema };
