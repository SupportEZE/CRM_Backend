import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Schema as MongooseSchema,Types } from 'mongoose';
import { Document } from 'mongoose';

@Schema({ timestamps: false })
export class Parent extends Document {
  @Prop({ default: () => Date.now() })
  created_at: Date;
  
  @Prop({ type: Types.ObjectId,required: true })
  created_id: string;
  
  @Prop({ required: true, maxlength: 50 })
  created_name: string;
  
  @Prop({ default: () => Date.now() })
  updated_at: Date;
  
  @Prop({type: Types.ObjectId})
  updated_id?: string;
  
  @Prop({ maxlength: 100 })
  updated_name?: string;
  
  @Prop({ default: 0, enum: [0, 1] })
  is_delete: number;
  
  @Prop( {type:String})
  source: string;
  
}

export const ParentSchema = SchemaFactory.createForClass(Parent);