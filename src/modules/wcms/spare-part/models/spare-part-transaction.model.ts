import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { time } from 'console';
import { Document, Schema as MongooseSchema, Types } from 'mongoose';
import { ParentSchema } from 'src/common/schema/parent.schema';
import { COLLECTION_CONST } from 'src/config/collection.constant';
import { preUpdateHook } from 'src/common/hooks/pre-update';


@Schema({ collection: COLLECTION_CONST().CRM_SPARE_PART_TRANSACTION })
export class Base extends Document { }
const SparePartTransactionSchema = SchemaFactory.createForClass(Base);
SparePartTransactionSchema.add(ParentSchema.obj);

@Schema()
export class SparePartTransactionModel extends Document {

    @Prop({ type: Number })
    org_id: number;

    @Prop({ type: Number })
    created_login_id: number;

    @Prop({ type: Number })
    assigned_to_login_id: number;

    @Prop({ type: Types.ObjectId })
    assigned_to_id: Types.ObjectId;

    @Prop({ type: String })
    assigned_to_name: string;

    @Prop({ type: String })
    assign_to_type: string;

    @Prop({ type: Types.ObjectId })
    assigned_from_id: Types.ObjectId;

    @Prop({ type: String })
    assigned_from_name: string;

    @Prop({ type: String })
    assign_from_type: string;

    @Prop({ type: Number })
    assigned_from_login_id: number;

    @Prop({ type: String })
    transaction_type: string;

    @Prop({ type: Number })
    transaction_qty: number;

    @Prop({ type: Types.ObjectId })
    product_id: Types.ObjectId;

    @Prop({ type: String })
    product_name: string;

    @Prop({ type: String })
    delivery_note: string;

}

const childSchema = SchemaFactory.createForClass(SparePartTransactionModel);
SparePartTransactionSchema.add(childSchema.obj);

// Applying the same update hook for all the update operations
SparePartTransactionSchema.pre('findOneAndUpdate', preUpdateHook);
SparePartTransactionSchema.pre('updateOne', preUpdateHook);
SparePartTransactionSchema.pre('updateMany', preUpdateHook);

export { SparePartTransactionSchema };