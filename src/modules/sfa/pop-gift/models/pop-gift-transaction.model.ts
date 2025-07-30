import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema, Types } from 'mongoose';
import { ParentSchema } from 'src/common/schema/parent.schema';
import { COLLECTION_CONST } from 'src/config/collection.constant';
import { preUpdateHook } from 'src/common/hooks/pre-update';

@Schema({ collection: COLLECTION_CONST().CRM_POP_GIFT_TRANSACTION })
export class Base extends Document { }
const PopGiftTransactionSchema = SchemaFactory.createForClass(Base);
PopGiftTransactionSchema.add(ParentSchema.obj);

@Schema()
export class PopGiftTransactionModel extends Document {
    
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
    
    @Prop({ type: Types.ObjectId })
    visit_activity_id: Types.ObjectId;
    
}

const childSchema = SchemaFactory.createForClass(PopGiftTransactionModel);
PopGiftTransactionSchema.add(childSchema.obj);

// Applying the same update hook for all the update operations
PopGiftTransactionSchema.pre('findOneAndUpdate', preUpdateHook);
PopGiftTransactionSchema.pre('updateOne', preUpdateHook);
PopGiftTransactionSchema.pre('updateMany', preUpdateHook);

export { PopGiftTransactionSchema };