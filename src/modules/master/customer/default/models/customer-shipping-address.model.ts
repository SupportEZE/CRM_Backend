import { Prop, Schema, SchemaFactory, } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { ParentSchema } from 'src/common/schema/parent.schema';
import { COLLECTION_CONST } from 'src/config/collection.constant';



@Schema({ collection: COLLECTION_CONST().CRM_CUSTOMER_SHIPPING_ADDRESS })
export class Base extends Document { }
const CustomerShippingAddressSchema = SchemaFactory.createForClass(Base);
CustomerShippingAddressSchema.add(ParentSchema.obj);

@Schema()
export class CustomerShippingAddressModel extends Document {

  @Prop({ type: Number })
  org_id: number;

  @Prop({ type: Types.ObjectId, required: true })
  customer_id: number;

  @Prop({ type: String })
  country: string;F

  @Prop({ type: String })
  shipping_state: string;

  @Prop({ type: String })
  shipping_district: string;

  @Prop({ type: String })
  shipping_city: string;

  @Prop({ type: Number })
  shipping_pincode: number;

  @Prop({ type: String })
  shipping_address: string;

  @Prop({ type: String })
  shipping_contact_name: string;

  @Prop({ type: String })
  shipping_contact_number: String;

}

const childSchema = SchemaFactory.createForClass(CustomerShippingAddressModel);
CustomerShippingAddressSchema.add(childSchema.obj);
export { CustomerShippingAddressSchema };
