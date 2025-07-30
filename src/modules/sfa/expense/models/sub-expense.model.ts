import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { ParentSchema } from 'src/common/schema/parent.schema';
import { COLLECTION_CONST } from 'src/config/collection.constant';
import { preUpdateHook } from 'src/common/hooks/pre-update';


@Schema({ collection: COLLECTION_CONST().CRM_SUB_EXPENSES })
export class Base extends Document { }
const SubExpenseSchema = SchemaFactory.createForClass(Base);
SubExpenseSchema.add(ParentSchema.obj);

@Schema()
export class SubExpenseModel extends Document {
    @Prop({ type: Number })
    org_id: number;

    @Prop({ type: Types.ObjectId })
    expense_id: string;

    @Prop({ type: Date, required: true })
    expense_date: Date;

    @Prop({ type: Number, required: true })
    expense_amount: number;

    @Prop({ type: String, default: null })
    description: string;

    @Prop({ type: String, required: true })
    expense_type: string;

    @Prop({ type: String,required: true })
    expense_type_unit: string;

    @Prop({ type: Number,required: true })
    expense_type_value: number;

    @Prop({ type: Number})
    km: number;
}

const childSchema = SchemaFactory.createForClass(SubExpenseModel);
SubExpenseSchema.add(childSchema.obj);

// Applying the same update hook for all the update operations
SubExpenseSchema.pre('findOneAndUpdate', preUpdateHook);
SubExpenseSchema.pre('updateOne', preUpdateHook);
SubExpenseSchema.pre('updateMany', preUpdateHook);

export { SubExpenseSchema };