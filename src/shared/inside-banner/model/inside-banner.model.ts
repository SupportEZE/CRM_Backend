import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import { ParentSchema } from 'src/common/schema/parent.schema';
import { COLLECTION_CONST } from 'src/config/collection.constant';
@Schema({ collection: COLLECTION_CONST().CRM_INSIDE_BANNERS })
export class Base extends Document { }
const InsideBannerSchema = SchemaFactory.createForClass(Base);
InsideBannerSchema.add(ParentSchema.obj);
@Schema()
export class InsideBannerModel extends Document {
    @Prop({ type: Number, required: true })
    org_id: number;

    @Prop({ type: String, required: true })
    banner_url: string;

    @Prop({ type: String, required: true })
    banner_name: string;

    @Prop({ type: Object })
    banner_details?: Record<string, any>;

    @Prop({ type: Number, default: 0 })
    is_delete: number;
}


const childSchema = SchemaFactory.createForClass(InsideBannerModel);
InsideBannerSchema.add(childSchema.obj);
export { InsideBannerSchema };
