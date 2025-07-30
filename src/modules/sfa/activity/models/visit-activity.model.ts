import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema, Types } from 'mongoose';
import { ParentSchema } from 'src/common/schema/parent.schema';
import { COLLECTION_CONST } from 'src/config/collection.constant';

export const todayProgressKeys = [
    "order_id",
    "enquiry_id",
    "stock_audit_id",
    "payment_collection_id",
    "followup_id",
    "brand_audit_id",
    "pop_gift_id",
    "doc_flag"
];

export const siteEnquiryModule = [
    "followup_id",
    "doc_flag"
]
@Schema({ collection: COLLECTION_CONST().CRM_VISIT_ACTIVITY })
export class Base extends Document { }
const VisitActivitySchema = SchemaFactory.createForClass(Base);
VisitActivitySchema.add(ParentSchema.obj);

@Schema({ _id: false })
export class CheckOutActivity {
    @Prop({ type: Types.ObjectId })
    order_id: Types.ObjectId;

    @Prop({ type: Types.ObjectId })
    enquiry_id: Types.ObjectId;

    @Prop({ type: Types.ObjectId })
    stock_audit_id: Types.ObjectId;

    @Prop({ type: Types.ObjectId })
    payment_collection_id: Types.ObjectId;

    @Prop({ type: Types.ObjectId })
    followup_id: Types.ObjectId;

    @Prop({ type: Types.ObjectId })
    brand_audit_id: Types.ObjectId;

    @Prop({ type: Types.ObjectId })
    pop_gift_txn_id: Types.ObjectId;

    @Prop({ type: Types.ObjectId })
    support_ticket_id: Types.ObjectId;

    @Prop({ type: Boolean, default: false })
    doc_flag: boolean;
}

const CheckOutActivitySchema = SchemaFactory.createForClass(CheckOutActivity);

@Schema()
export class VisitActivityModel extends Document {

    @Prop({ type: Number })
    org_id: number;

    @Prop({ type: String })
    module_name: string;

    @Prop({ type: Number })
    module_id: number;

    @Prop({ type: Types.ObjectId })
    customer_id: Types.ObjectId;

    @Prop({ type: Types.ObjectId })
    user_id: Types.ObjectId;

    @Prop({ type: Object })
    customer_details?: Record<string, any>;

    @Prop({ type: Date })
    activity_date: Date;

    @Prop({ type: Date })
    visit_start: Date;

    @Prop({ type: Date })
    visit_end: Date;

    @Prop({ type: Number, })
    start_lat: number;

    @Prop({ type: Number, })
    start_lng: number;

    @Prop({ type: Number, })
    end_lat: number;

    @Prop({ type: Number, })
    end_lng: number;

    @Prop({ type: String })
    start_location: string;

    @Prop({ type: String })
    end_location: string;

    @Prop({ type: String })
    remark: string;

    @Prop({ type: CheckOutActivitySchema })
    check_out_activities: CheckOutActivity;

    @Prop({ type: MongooseSchema.Types.Mixed })
    check_list: any;

    @Prop({ type: Boolean, default: false })
    is_planned_visit: boolean;

    @Prop({ type: Boolean, default: false })
    is_new_counter_visit: boolean;

    @Prop({ type: String })
    avarage_meeting_time: string;

    @Prop({ type: Number, })
    accuracy_distance: number;

    @Prop({ type: Number, })
    visit_distance: number;

    @Prop({ type: [Types.ObjectId], default: [] })
    dropdown_options_id: Types.ObjectId[];

}


const childSchema = SchemaFactory.createForClass(VisitActivityModel);
VisitActivitySchema.add(childSchema.obj);

export { VisitActivitySchema };