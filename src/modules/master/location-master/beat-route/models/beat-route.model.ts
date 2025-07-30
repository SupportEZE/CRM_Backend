import { Prop, Schema, SchemaFactory, } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { ParentSchema } from 'src/common/schema/parent.schema';
import { COLLECTION_CONST } from 'src/config/collection.constant';
import { preUpdateHook } from 'src/common/hooks/pre-update';
@Schema({ collection: COLLECTION_CONST().CRM_BEAT_ROUTE })
export class Base extends Document { }
const BeatRouteSchema = SchemaFactory.createForClass(Base);
BeatRouteSchema.add(ParentSchema.obj);

@Schema()
export class BeatRouteModel extends Document {

    @Prop({ type: Number })
    org_id: number;

    @Prop({ type: String, required: true })
    state: string;

    @Prop({ type: String, required: true })
    district: string;

    @Prop({ type: String, required: true })
    description: string;

    @Prop({ type: String, required: true })
    beat_route_code: string;

    @Prop({ type: String })
    country: string;
}

const childSchema = SchemaFactory.createForClass(BeatRouteModel);
BeatRouteSchema.add(childSchema.obj);

BeatRouteSchema.pre('findOneAndUpdate', preUpdateHook);
BeatRouteSchema.pre('updateOne', preUpdateHook);
BeatRouteSchema.pre('updateMany', preUpdateHook);
export { BeatRouteSchema };
