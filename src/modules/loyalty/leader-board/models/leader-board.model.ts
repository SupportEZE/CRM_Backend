import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema, Types } from 'mongoose';
import { ParentSchema } from 'src/common/schema/parent.schema';
import { COLLECTION_CONST } from 'src/config/collection.constant';
import { preUpdateHook } from 'src/common/hooks/pre-update';


@Schema({ collection: COLLECTION_CONST().CRM_LEADER_BOARD })
export class Base extends Document { }
const LeaderBoardSchema = SchemaFactory.createForClass(Base);
LeaderBoardSchema.add(ParentSchema.obj);

export enum LeaderBoardStatus {
    ACTIVE = 'Active',
    INACTIVE = 'Inactive',
}
@Schema()
export class LeaderBoardModel extends Document {
    @Prop({ type: Number, required: true, index: true })
    org_id: number;

    @Prop({ type: String, required: true, index: true })
    title: string;

    @Prop({ type: Date, required: true, index: true })
    start_date: Date;

    @Prop({ type: Date, required: true, index: true })
    end_date: Date;

    @Prop({ type: [Types.ObjectId], required: true })
    customer_type_id: Types.ObjectId[];

    @Prop({ type: [String], required: true })
    customer_type_name: string[];

    @Prop({ type: [String], required: true })
    ledger_creation_type: string[];

    @Prop({ type: String, required: true })
    country: string;

    @Prop({ type: [String], required: true })
    state: string[];

    @Prop({ type: String, required: true, maxlength: 500 })
    terms_condition: string;

    @Prop({ type: Number, min: 0 })
    min_eligiblity_points: number;

    @Prop({ type: String, enum: LeaderBoardStatus, default: LeaderBoardStatus.ACTIVE })
    status: LeaderBoardStatus;
}

const childSchema = SchemaFactory.createForClass(LeaderBoardModel);
LeaderBoardSchema.add(childSchema.obj);

LeaderBoardSchema.pre('findOneAndUpdate', preUpdateHook);
LeaderBoardSchema.pre('updateOne', preUpdateHook);
LeaderBoardSchema.pre('updateMany', preUpdateHook);

export { LeaderBoardSchema };