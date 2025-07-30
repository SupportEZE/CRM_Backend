import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { preUpdateHook } from 'src/common/hooks/pre-update';
import { ParentSchema } from 'src/common/schema/parent.schema';
import { COLLECTION_CONST } from 'src/config/collection.constant';

@Schema({ collection: COLLECTION_CONST().CRM_USERS })
export class Base extends Document { }

const UserSchema = SchemaFactory.createForClass(Base);
UserSchema.add(ParentSchema.obj);

@Schema()
export class UserModel extends Document {

    @Prop({ type: Number, required: true })
    org_id: number;

    @Prop({ type: Number, required: true })
    login_type_id: number;

    @Prop({ type: String, required: true })
    login_type_name: string;

    @Prop({ type: Types.ObjectId })
    user_role_id: string;

    @Prop({ type: String })
    user_role_name: string;

    @Prop({ type: String, required: true })
    name: string;

    @Prop({ type: String, required: true })
    mobile: string;

    @Prop({ type: String, unique: true, match: /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,4}$/, sparse: true })
    email: string;

    @Prop({ type: String, unique: true, required: true })
    username: string;

    @Prop({ type: String, required: true })
    password: string;

    @Prop({ type: String, required: true })
    user_code: string;

    @Prop({ type: String, required: true })
    designation: string;

    @Prop({ type: String })
    weekly_off: string;

    @Prop({ type: String, default: null })
    profile_pic: string;

    @Prop({ type: Types.ObjectId })
    reporting_manager_id: string;

    @Prop({ type: String })
    reporting_manager_name: string;

    @Prop({ type: String })
    data_rights: string;

    @Prop({ type: Object })
    data_right_values: any[];

    @Prop({ type: Object })
    data_right_value_names: any[];

    @Prop({ type: String })
    country: string;

    @Prop({ type: String })
    state: string;

    @Prop({ type: String })
    district: string;

    @Prop({ type: String })
    city: string;

    @Prop({ type: Number })
    pincode: number;

    @Prop({ type: String })
    address: string;

    @Prop({ type: String, default: 'Active' })
    status: string;

    @Prop({ type: String })
    ip_bypass_date: string;

    @Prop({ type: String, default: null })
    jwt_app_token: string;

    @Prop({ type: String, default: null })
    jwt_web_token: string;

    @Prop({ type: String, default: null })
    fcm_token: string;

    @Prop({ type: String })
    fake_app_name: string;

    @Prop({ type: Date, default: null })
    first_app_login: Date;

    @Prop({ type: Date, default: null })
    latest_app_login: Date;

    @Prop({ type: String, default: 'en' })
    language_code: string;

    @Prop({ type: Object, default: {} })
    form_data?: Record<string, any>;

    @Prop({ type: Object, default: {} })
    device_info?: Record<string, any>;

    @Prop({ type: Object })
    beat_route_code?: Record<string, any>;
}

const childSchema = SchemaFactory.createForClass(UserModel);
UserSchema.add(childSchema.obj);

UserSchema.pre('findOneAndUpdate', preUpdateHook);
UserSchema.pre('updateOne', preUpdateHook);
UserSchema.pre('updateMany', preUpdateHook);

export { UserSchema };
