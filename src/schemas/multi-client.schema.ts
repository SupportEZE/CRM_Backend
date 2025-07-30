import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import { COLLECTION_CONST } from 'src/config/collection.constant';

@Schema({ collection: COLLECTION_CONST().CRM_MULTI_CLIENT_CONFIG })
export class MultiClientRouting extends Document {
  @Prop({ required: true })
  entity: string; // e.g., 'loginType', 'user', 'gift'

  @Prop({ required: true })
  org_id: string; // org ID for the client

  @Prop({ type: Object, default: {} })
  match: Record<string, any>; // e.g., { login_type_id: 5, location_code: 'IND' }

  @Prop({ required: true })
  connection: string; // DB name

  @Prop()
  prefix?: string;

  @Prop({ default: 0 })
  priority?: number; // to handle multiple matches
}

export const MultiClientRoutingSchema =
  SchemaFactory.createForClass(MultiClientRouting);
