import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { ParentSchema } from 'src/common/schema/parent.schema';
import { COLLECTION_CONST } from 'src/config/collection.constant';

@Schema({ collection: COLLECTION_CONST().CRM_USER_TO_CUSTOMER_MAPPING })
export class Base extends Document {}
const UserToCustomerMappingSchema = SchemaFactory.createForClass(Base);
UserToCustomerMappingSchema.add(ParentSchema.obj);

@Schema()
export class UserToCustomerMappingModel extends Document {

  @Prop({ type: Number })
  org_id: number;

  @Prop({ type: Types.ObjectId, required: true })
  customer_id: Types.ObjectId;

  @Prop({ type: String })
  customer_name: string;

  @Prop({ type: Types.ObjectId })
  customer_type_id: Types.ObjectId;

  @Prop({ type: String })
  customer_type_name: string;

  @Prop({ type: Types.ObjectId, required: true })
  user_id: string;

  @Prop({ required: true, type: Object })
  user_data: Record<string, any>;

}

const childSchema = SchemaFactory.createForClass(UserToCustomerMappingModel);
UserToCustomerMappingSchema.add(childSchema.obj);
export { UserToCustomerMappingSchema };
