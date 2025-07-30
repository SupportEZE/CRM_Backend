import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { ParentSchema } from 'src/common/schema/parent.schema';
import { COLLECTION_CONST } from 'src/config/collection.constant';
import { preUpdateHook } from 'src/common/hooks/pre-update';
import { PriceType } from '../../product/models/product-price.model';
@Schema({ collection: COLLECTION_CONST().CRM_ORG })
export class Base extends Document { }
const OrgSchema = SchemaFactory.createForClass(Base);
OrgSchema.add(ParentSchema.obj);

@Schema()

export class AuthorizedPerson {
    @Prop({ type: String, required: true })
    name: string;

    @Prop({ type: String, required: true })
    mobile: string;
}
export class OrgModel extends Document {
    @Prop({ type: Number, required: true, unique: true, index: true })
    org_id: number;

    @Prop({ type: String, required: true, maxlength: 200 })
    org_name: string;

    @Prop({ type: String, required: true, maxlength: 100, unique: true })
    app_id: string;

    @Prop({ type: Boolean, default: false })
    sfa: boolean;

    @Prop({ type: Boolean, default: false })
    dms: boolean;

    @Prop({ type: Boolean, default: false })
    irp: boolean;

    @Prop({ type: Boolean, default: false })
    wms: boolean;

    @Prop({ type: Boolean, default: false })
    wcms: boolean;

    @Prop({ type: Boolean, default: true })
    senior_approval: boolean;

    @Prop({ type: Boolean, default: false })
    batch_auto_genrate: boolean;

    @Prop({ type: String, maxlength: 200 })
    price_type?: string;

    @Prop({ type: String, maxlength: 200 })
    order_type?: string;

    @Prop({ type: String, maxlength: 200 })
    firebase_key?: string;

    @Prop({ type: String, enum: ['CLIENT', 'EZEONE'] })
    sms_api: string;

    @Prop({ type: String, enum: ['CLIENT', 'EZEONE'] })
    qr_printing?: string;

    @Prop({ type: String, enum: ['YES', 'NO'] })
    scanning_geo_location?: string;

    @Prop({ type: String, enum: ['GATEWAY', 'MANUAL'] })
    payment_gateway?: string;

    @Prop({ type: Number, default: 200 })
    visit_radius: number;

    @Prop({ type: Types.ObjectId })
    user_id: string;

    @Prop({ type: [String] })
    logo: string[];

    @Prop({ type: String })
    sub_domain?: string;

    @Prop({ type: String })
    play_store_link?: string;

    @Prop({ type: String })
    app_store_link?: string;

    @Prop({ type: [String] })
    web_banner?: string[];

    @Prop({ type: String })
    background_image?: string;

    @Prop({ type: String })
    theme_color?: string;

    @Prop({ type: String })
    title?: string;

    @Prop({ type: String })
    sub_title?: string;

    @Prop({ type: String })
    favicon_url?: string;

    @Prop({ type: String })
    website_url?: string;

    @Prop({ type: [AuthorizedPerson], default: [] })
    authorized_person: AuthorizedPerson[];
}

const childSchema = SchemaFactory.createForClass(OrgModel);
OrgSchema.add(childSchema.obj);

OrgSchema.pre('findOneAndUpdate', preUpdateHook);
OrgSchema.pre('updateOne', preUpdateHook);
OrgSchema.pre('updateMany', preUpdateHook);

export { OrgSchema };

