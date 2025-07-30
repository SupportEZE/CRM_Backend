import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema, Types } from 'mongoose';
import { ParentSchema } from 'src/common/schema/parent.schema';
import { COLLECTION_CONST } from 'src/config/collection.constant';
import { preUpdateHook } from 'src/common/hooks/pre-update';

export enum expenseTypeUnit{
    KM='km',
    AMOUNT='amount',
    NULL = 'NULL'
} 
@Schema({ collection: COLLECTION_CONST().CRM_EXPENSES })
export class Base extends Document { }
const ExpenseSchema = SchemaFactory.createForClass(Base);
ExpenseSchema.add(ParentSchema.obj);

@Schema()
export class ExpenseModel extends Document {
    @Prop({ type: Number })
    org_id: number;
    
    @Prop({ type: Types.ObjectId })
    user_id: Types.ObjectId;
    
    @Prop({ type: Types.ObjectId })
    event_plan_id: Types.ObjectId;
    
    @Prop({ type: String })
    expense_id: string;
    
    @Prop({ type: String, required: true })
    expense_type: string;
    
    @Prop({ type: String, required: true })
    description: string;
    
    @Prop({ type: Date, required: true })
    start_date: Date;
    
    @Prop({ type: Date, required: true })
    end_date: Date;
    
    @Prop({ type: Number, default: 0 })
    approved_amount: number;
    
    @Prop({ type: Number, default: 0 })
    claim_amount: number;
    
    @Prop({ type: Number, default: 0 })
    total_item: number;
    
    @Prop({ type: String, default: 'Draft' })
    status: string;
    
    @Prop({ type: String})
    senior_status: string;
    
    @Prop({ type: Date})
    senior_status_updated_at: Date;
    
    @Prop({ type: Types.ObjectId})
    senior_status_updated_id: Types.ObjectId;
    
    @Prop({ type: String})
    senior_status_updated_name: string;
    
    @Prop({ type: String})
    senior_status_remark: string;
    
    @Prop({ type: String })
    status_remark: string;
    
    @Prop({ type: String })
    reason: string;
    
    @Prop({ type: Object })
    sub_expense: Record<string, any>;
}

const childSchema = SchemaFactory.createForClass(ExpenseModel);
ExpenseSchema.add(childSchema.obj);

ExpenseSchema.pre('findOneAndUpdate', preUpdateHook);
ExpenseSchema.pre('updateOne', preUpdateHook);
ExpenseSchema.pre('updateMany', preUpdateHook);

export { ExpenseSchema };