import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema, Types } from 'mongoose';
import { ParentSchema } from 'src/common/schema/parent.schema';
import { COLLECTION_CONST } from 'src/config/collection.constant';
import { preUpdateHook } from 'src/common/hooks/pre-update';


@Schema({ collection: COLLECTION_CONST().CRM_ALLOWANCE_MASTER })
export class Base extends Document { }
const AllowanceSchema = SchemaFactory.createForClass(Base);
AllowanceSchema.add(ParentSchema.obj);

@Schema()
export class AllowanceModel extends Document {
    @Prop({ type: Number })
    org_id: number;

    @Prop({ type: Types.ObjectId})
    user_id: string;

    @Prop({ type: Object }) 
    form_data: Record<string, any>;

}

const childSchema = SchemaFactory.createForClass(AllowanceModel);
AllowanceSchema.add(childSchema.obj);

// Applying the same update hook for all the update operations
AllowanceSchema.pre('findOneAndUpdate', preUpdateHook);
AllowanceSchema.pre('updateOne', preUpdateHook);
AllowanceSchema.pre('updateMany', preUpdateHook);

export { AllowanceSchema };