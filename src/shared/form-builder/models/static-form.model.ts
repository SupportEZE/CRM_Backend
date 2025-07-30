import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { ParentSchema } from 'src/common/schema/parent.schema';
import { COLLECTION_CONST } from 'src/config/collection.constant';


@Schema({ collection: COLLECTION_CONST().CRM_STATIC_FORMS })
export class Base extends Document { }
const StaticFormSchema = SchemaFactory.createForClass(Base);
StaticFormSchema.add(ParentSchema.obj);

@Schema()
export class StaticFormModel extends Document {

    @Prop({ type: Number, default: 0 })
    org_id: number;

    @Prop({ required: true, maxlength: 20, enum: ['app', 'web'] })
    platform: string;

    @Prop({ type: Number, required: true })
    module_id: Number;

    @Prop({ required: true, maxlength: 20 })
    module_type: string;

    @Prop({ required: true, })
    form_id: number;

    @Prop({ default: 'static' })
    form_source?: string

    @Prop({ required: true, type: Object })
    form_data: Record<string, any>;

}

const childSchema = SchemaFactory.createForClass(StaticFormModel);
StaticFormSchema.add(childSchema.obj);
export { StaticFormSchema };
