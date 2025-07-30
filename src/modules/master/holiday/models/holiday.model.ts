import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';
import { preUpdateHook } from 'src/common/hooks/pre-update';
import { ParentSchema } from 'src/common/schema/parent.schema';
import { COLLECTION_CONST } from 'src/config/collection.constant';

@Schema({ collection: COLLECTION_CONST().CRM_HOLIDAY })
export class Base extends Document { }

const HolidaySchema = SchemaFactory.createForClass(Base);

HolidaySchema.add(ParentSchema.obj);

@Schema()
export class HolidayModel extends Document {

  @Prop({ type: Number, required: true, index: true })
  org_id: number;

  @Prop({ type: String, required: true, maxlength: 50 })
  holiday_name: string;

  @Prop({ type: Date, required: true, index: true })
  holiday_date: Date;

  @Prop({ type: String, required: true })
  day: string;

  @Prop({ type: String, required: true })
  month: string;

  @Prop({ type: Number, required: true })
  year: number;

  @Prop({
    type: String,
    required: true,
    maxlength: 50,
    enum: ['National', 'Regional'],
  })
  holiday_type: 'National' | 'Regional';

  @Prop({ type: MongooseSchema.Types.Mixed })
  regional_state?: Record<string, any>;

  @Prop({ type: String })
  country: string;
}

const childSchema = SchemaFactory.createForClass(HolidayModel);
HolidaySchema.add(childSchema.obj);

HolidaySchema.pre('findOneAndUpdate', preUpdateHook);
HolidaySchema.pre('updateOne', preUpdateHook);
HolidaySchema.pre('updateMany', preUpdateHook);

export { HolidaySchema };
