import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { ParentSchema } from 'src/common/schema/parent.schema';
import { COLLECTION_CONST } from 'src/config/collection.constant';

@Schema({ collection: COLLECTION_CONST().CRM_INVALID_BACKGROUND_LOCATION })
export class Base extends Document { }
const InvalidBackgroundLocationSchema = SchemaFactory.createForClass(Base);
InvalidBackgroundLocationSchema.add(ParentSchema.obj);

@Schema()
export class InvalidBackgroundLocationModel extends Document {

    @Prop({ type: Number })
    org_id: number;

    @Prop({ type: Types.ObjectId, required: true })
    user_id: Types.ObjectId;

    @Prop({ type: String })
    error_reason: String
    
    @Prop({ type: Object })
    data: Record<string,any>;

}

const childSchema = SchemaFactory.createForClass(InvalidBackgroundLocationModel);
InvalidBackgroundLocationSchema.add(childSchema.obj);
export { InvalidBackgroundLocationSchema };