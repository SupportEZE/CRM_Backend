import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import { COLLECTION_CONST } from 'src/config/collection.constant';

@Schema({ collection: COLLECTION_CONST().CRM_EXTERNAL_API_LOGS })
export class ExternalApiLogsModel extends Document {
  @Prop({ required: true })
  api_status: string;

  @Prop({ required: true })
  api_method: string;

  @Prop({ required: true })
  api_name: string;

  @Prop({ required: true })
  api_url: string;

  @Prop({ type: Object }) // Supports JSON request data
  api_request: Record<string, any>;

  @Prop({ type: Object }) // Supports JSON response data
  api_response: Record<string, any>;

  @Prop({ type: Object }) // Supports JSON headers
  api_header: Record<string, any>;

  @Prop()
  response_time: string;
}

export const ExternalApiLogsSchema = SchemaFactory.createForClass(ExternalApiLogsModel);
