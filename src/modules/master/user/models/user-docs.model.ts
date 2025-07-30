import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { ParentSchema } from 'src/common/schema/parent.schema';
import { COLLECTION_CONST } from 'src/config/collection.constant';
import { preUpdateHook } from 'src/common/hooks/pre-update';
@Schema({ collection: COLLECTION_CONST().CRM_USER_DOCS })
export class Base extends Document {
}

const UserDocsSchema = SchemaFactory.createForClass(Base);
UserDocsSchema.add(ParentSchema.obj);
@Schema()
export class UserDocsModel extends Document {

    @Prop({ type: Number })
    org_id: number;

    @Prop({ type: Types.ObjectId })
    row_id: number;

    @Prop({ type: Object })
    label: Record<string, any>;

    @Prop({ type: Object })
    doc_no: Record<string, any>;

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

const childSchema = SchemaFactory.createForClass(UserDocsModel);
UserDocsSchema.add(childSchema.obj);

UserDocsSchema.pre('findOneAndUpdate', preUpdateHook);
UserDocsSchema.pre('updateOne', preUpdateHook);
UserDocsSchema.pre('updateMany', preUpdateHook);

export { UserDocsSchema };