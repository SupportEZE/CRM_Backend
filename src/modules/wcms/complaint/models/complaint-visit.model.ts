import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema, Types } from 'mongoose';
import { ParentSchema } from 'src/common/schema/parent.schema';
import { COLLECTION_CONST } from 'src/config/collection.constant';
import { preUpdateHook } from 'src/common/hooks/pre-update';

@Schema({ collection: COLLECTION_CONST().CRM_COMPLAINT_VISIT })
export class Base extends Document { }
const ComplaintVisitSchema = SchemaFactory.createForClass(Base);
ComplaintVisitSchema.add(ParentSchema.obj);

@Schema()
export class ComplaintVisitModel extends Document {

    @Prop({ type: Number })
    org_id: number;
    
    @Prop({ type: String })
    complaint_no: string;

    @Prop({ type: Types.ObjectId })
    complaint_id: Types.ObjectId;

    @Prop({ type: String })
    start_lat: string;

    @Prop({ type: String })
    start_lng: string;

    @Prop({ type: String })
    stop_lat: string;

    @Prop({ type: String })
    stop_lng: string;

    @Prop({ type: Date })
    visit_date: Date;  

    @Prop({ type: Date })
    visit_start_time: Date; 

    @Prop({ type: String })
    start_address: string;

    @Prop({ type: String })
    stop_address: string;

    @Prop({ type: Date })
    visit_stop_time: Date; 

    
}

const childSchema = SchemaFactory.createForClass(ComplaintVisitModel);
ComplaintVisitSchema.add(childSchema.obj);

ComplaintVisitSchema.pre('findOneAndUpdate', preUpdateHook);
ComplaintVisitSchema.pre('updateOne', preUpdateHook);
ComplaintVisitSchema.pre('updateMany', preUpdateHook);

export { ComplaintVisitSchema };