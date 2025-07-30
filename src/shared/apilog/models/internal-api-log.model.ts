import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import { COLLECTION_CONST } from 'src/config/collection.constant';

@Schema({ collection: COLLECTION_CONST().CRM_INTERNAL_API_LOGS, timestamps: { createdAt: 'created_at' } })
export class InternalApiLogModel extends Document {
  @Prop({ required: true })
  api_name: string;

  @Prop({ required: true })
  api_method: string;

  @Prop({ required: true })
  api_url: string;

  @Prop({ type: Object }) // Can store JSON objects
  api_request: Record<string, any>;

  @Prop({ type: Object }) // Can store JSON objects
  api_response: Record<string, any>;

  @Prop({ type: String })
  ip_address: string;

  @Prop({ type: Object }) // Can store JSON headers
  api_header: Record<string, any>;

  @Prop()
  response_time: string;
}

export const InternalApiLogSchema = SchemaFactory.createForClass(InternalApiLogModel);
