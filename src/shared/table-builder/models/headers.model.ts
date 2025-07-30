import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document,Types } from 'mongoose';
import { ParentSchema } from 'src/common/schema/parent.schema';
import { COLLECTION_CONST } from 'src/config/collection.constant';


@Schema({ collection: COLLECTION_CONST().CRM_HEADERS })
export class Base extends Document {}
const HeadersSchema = SchemaFactory.createForClass(Base);
HeadersSchema.add(ParentSchema.obj);

@Schema()
export class HeadersModel extends Document {

    @Prop({ required: true })
    org_id: number;

    @Prop({ required: true })
    level: number;

    @Prop({ required: true })
    table_id: number;

    @Prop({ type: Types.ObjectId,required: true })
    user_id: number;

    @Prop({ required: true,type:String })
    field_name: string
}

const childSchema = SchemaFactory.createForClass(HeadersModel);
HeadersSchema.add(childSchema.obj);
export { HeadersSchema };


