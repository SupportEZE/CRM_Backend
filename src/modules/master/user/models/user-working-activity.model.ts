import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { preUpdateHook } from 'src/common/hooks/pre-update';
import { ParentSchema } from 'src/common/schema/parent.schema';
import { COLLECTION_CONST } from 'src/config/collection.constant';

export enum WorkingActivityType {
    PUNCH_IN = 'Punch In',
    EXPENSE_CLAIMED = 'Expense Claimed',
    CHECK_IN = 'Check In',
    PUNCH_ORDER_PRIMARY = 'Punch Order (Primary)',
    CHECK_OUT = 'Check Out',
    TICKET_CREATED = 'Ticket Created',
    FOLLOW_UP_COMPLETED = 'Follow-up completed',
    FOLLOW_UP_CREATE = 'Follow-up Create',
    LEAVE_SUBMITTED = 'Leave Submitted',
    LEAVE_APPROVED = 'Leave Approved',
    PUNCH_OUT = 'Punch Out',
}


export const WorkingActivityTypeColors = {
    "Punch In": '#22c55e', // Start Attendance
    "Expense Claimed": '#8b5cf6',
    "Check In": '#3b82f6',
    "Punch Order (Primary)": '#ef4444',
    "Check Out": '#f97316',
    "Ticket Created": '#06b6d4', // Ticket Created (Branding)
    "Follow-up completed": '#0ea5e9',
    "Follow-up Create": '#0ea5e9',
    "Leave Submitted": '#3b82f6',
    "Leave Approved": '#3b82f6',
    "Punch Out": '#ef4444', // Stop Attendance
};


@Schema({ collection: COLLECTION_CONST().CRM_USER_WORKING_ACTIVITY })
export class Base extends Document { }

const UserWorkingActivitySchema = SchemaFactory.createForClass(Base);
UserWorkingActivitySchema.add(ParentSchema.obj);

@Schema()
export class UserWorkingActivityModel extends Document {
    
    @Prop({ type: Number, required: true, min: 1 })
    org_id: number;
    
    @Prop({ type: String, required: true,enum:WorkingActivityType})
    working_activity_type: string;
    
    @Prop({ type: Types.ObjectId, required: true })
    working_activity_id: string;
    
    @Prop({ type: String, required: true })
    display_name: string;
    
}

const childSchema = SchemaFactory.createForClass(UserWorkingActivityModel);
UserWorkingActivitySchema.add(childSchema.obj);

UserWorkingActivitySchema.pre('findOneAndUpdate', preUpdateHook);
UserWorkingActivitySchema.pre('updateOne', preUpdateHook);
UserWorkingActivitySchema.pre('updateMany', preUpdateHook);

export { UserWorkingActivitySchema };
