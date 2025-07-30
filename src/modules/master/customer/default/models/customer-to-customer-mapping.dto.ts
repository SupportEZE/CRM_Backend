import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { ParentSchema } from 'src/common/schema/parent.schema';
import { COLLECTION_CONST } from 'src/config/collection.constant';

@Schema({ collection: COLLECTION_CONST().CRM_CUSTOMER_TO_CUSTOMER_MAPPING })
export class Base extends Document {}
const CustomerToCustomerMappingSchema = SchemaFactory.createForClass(Base);
CustomerToCustomerMappingSchema.add(ParentSchema.obj);

@Schema()
export class CustomerToCustomerMappingModel extends Document {

  @Prop({ type: Number })
  org_id: number;

  @Prop({ type: String,required: true})
  child_customer_type_name: string;

  @Prop({ type: Types.ObjectId,required: true})
  child_customer_type_id: string;

  @Prop({ type: Types.ObjectId, required: true })
  child_customer_id: Types.ObjectId;

  @Prop({ type: String})
  child_customer_name: string;

  @Prop({ type: String,required: true})
  parent_customer_type_name: string;

  @Prop({ type: Types.ObjectId,required: true})
  parent_customer_type_id: string;

  @Prop({ type: Types.ObjectId, required: true })
  parent_customer_id: Types.ObjectId;

  @Prop({ type: String})
  parent_customer_name: string;

}

const childSchema = SchemaFactory.createForClass(CustomerToCustomerMappingModel);
CustomerToCustomerMappingSchema.add(childSchema.obj);
export { CustomerToCustomerMappingSchema };
