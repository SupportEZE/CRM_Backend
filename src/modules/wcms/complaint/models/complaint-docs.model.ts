import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { ParentSchema } from 'src/common/schema/parent.schema';
import { COLLECTION_CONST } from 'src/config/collection.constant';
import { preUpdateHook } from 'src/common/hooks/pre-update';
@Schema({ collection: COLLECTION_CONST().CRM_COMPLAINT_DOCS })
export class Base extends Document {
}

const ComplaintDocsSchema = SchemaFactory.createForClass(Base);
ComplaintDocsSchema.add(ParentSchema.obj);
@Schema()
export class ComplaintDocsModel extends Document {

    @Prop({ type: Number })
    org_id: number;

    @Prop({ type: Types.ObjectId })
    row_id: number;

    @Prop({ type: Object })
    label: Record<string, any>;

    @Prop({ type: String })
    doc_number: string;

    @Prop({ type: String })
    file_path: string;

    @Prop({ type: String })
    file_type: string;

    @Prop({ type: String })
    thumbnail_path: string;

    @Prop({ type: String })
    big_thumbnail_path: string;

    @Prop({ type: String })
    signed_url_thumbnail: string;

    @Prop({ type: Date })
    signed_url_expire_thumbnail: Date;

    @Prop({ type: String })
    signed_url_big_thumbnail: string;

    @Prop({ type: Date })
    signed_url_expire_big_thumbnail: Date;

    @Prop({ type: String })
    signed_url: string;

    @Prop({ type: Date })
    signed_url_expire: Date;
}

const childSchema = SchemaFactory.createForClass(ComplaintDocsModel);
ComplaintDocsSchema.add(childSchema.obj);

ComplaintDocsSchema.pre('findOneAndUpdate', preUpdateHook);
ComplaintDocsSchema.pre('updateOne', preUpdateHook);
ComplaintDocsSchema.pre('updateMany', preUpdateHook);

export { ComplaintDocsSchema };