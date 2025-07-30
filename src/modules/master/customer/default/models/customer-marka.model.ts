import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types, Schema as MongooseSchema } from 'mongoose';
import { ParentSchema } from 'src/common/schema/parent.schema';
import { COLLECTION_CONST } from 'src/config/collection.constant';

@Schema({ collection: COLLECTION_CONST().CRM_CUSTOMER_MARKA })
export class Base extends Document { }
const CustomerMarkaSchema = SchemaFactory.createForClass(Base);
CustomerMarkaSchema.add(ParentSchema.obj);

@Schema()
export class CustomerMarkaModel extends Document {

    @Prop({ type: Number })
    org_id: number;

    @Prop({ type: Types.ObjectId, required: true })
    customer_id: Types.ObjectId;

    @Prop({ type: String })
    marka: string;
}

const childSchema = SchemaFactory.createForClass(CustomerMarkaModel);
CustomerMarkaSchema.add(childSchema.obj);

export { CustomerMarkaSchema };
