import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { ParentSchema } from 'src/common/schema/parent.schema';
import { COLLECTION_CONST } from 'src/config/collection.constant';

@Schema({ collection: COLLECTION_CONST().CRM_CUSTOMER_LEADERBOARD })
export class Base extends Document { }
const CustomerLeaderBoardSchema = SchemaFactory.createForClass(Base);
CustomerLeaderBoardSchema.add(ParentSchema.obj);

@Schema()
export class CustomerLeaderBoardModel extends Document {

    @Prop({ type: Number })
    org_id: number;

    @Prop({ type: Number, default: () => Date.now() })
    timestamp: number;

    @Prop({ type: Types.ObjectId })
    customer_id: number;

    @Prop({ type: String })
    customer_name: string;

    @Prop({ type: Types.ObjectId })
    leader_board_id: number;

    @Prop({ type: Number })
    total_points: number;

    @Prop({ type: Number })
    rank: number;

    @Prop({ type: String })
    state: string;

    @Prop({ type: String })
    profile_pic: string;
}

const childSchema = SchemaFactory.createForClass(CustomerLeaderBoardModel);
CustomerLeaderBoardSchema.add(childSchema.obj);
export { CustomerLeaderBoardSchema };
