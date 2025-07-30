import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { ParentSchema } from 'src/common/schema/parent.schema';
import { COLLECTION_CONST } from 'src/config/collection.constant';

@Schema({ collection: COLLECTION_CONST().CRM_CUSTOMER_TO_STATE_MAPPING })
export class Base extends Document { }
const CustomerToStateMappingSchema = SchemaFactory.createForClass(Base);
CustomerToStateMappingSchema.add(ParentSchema.obj);

@Schema()
export class CustomerToStateAssigningModel extends Document {
    @Prop({ type: Number })
    org_id: number;

    @Prop({ type: Types.ObjectId, required: true })
    customer_id: Types.ObjectId;

    @Prop({ type: String })
    customer_name: string;

    @Prop({ type: [String], required: true })
    state: string[];

    @Prop({ type: [String], required: true })
    district: string[];
}
const childSchema = SchemaFactory.createForClass(CustomerToStateAssigningModel);
CustomerToStateMappingSchema.add(childSchema.obj);
export { CustomerToStateMappingSchema };
