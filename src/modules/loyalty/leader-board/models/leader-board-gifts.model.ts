import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema, Types } from 'mongoose';
import { ParentSchema } from 'src/common/schema/parent.schema';
import { COLLECTION_CONST } from 'src/config/collection.constant';
import { preUpdateHook } from 'src/common/hooks/pre-update';


@Schema({ collection: COLLECTION_CONST().CRM_LEADER_BOARD_GIFTS })
export class Base extends Document { }
const LeaderBoardGiftsSchema = SchemaFactory.createForClass(Base);
LeaderBoardGiftsSchema.add(ParentSchema.obj);

@Schema()
export class LeaderBoardGiftsModel extends Document {
    @Prop({ type: Number })
    org_id: number;

    @Prop({ type: String })
    gift_title: string;

    @Prop({ type: Types.ObjectId })
    leader_board_id: Types.ObjectId;

    @Prop({ type: String, required: true })
    rank: string;

    @Prop({ type: Array })
    doc_file: Record<string, any>;
}

const childSchema = SchemaFactory.createForClass(LeaderBoardGiftsModel);
LeaderBoardGiftsSchema.add(childSchema.obj);

// Applying the same update hook for all the update operations
LeaderBoardGiftsSchema.pre('findOneAndUpdate', preUpdateHook);
LeaderBoardGiftsSchema.pre('updateOne', preUpdateHook);
LeaderBoardGiftsSchema.pre('updateMany', preUpdateHook);

export { LeaderBoardGiftsSchema };