import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document} from 'mongoose';
import { ParentSchema } from 'src/common/schema/parent.schema';
import { COLLECTION_CONST } from 'src/config/collection.constant';
import { preUpdateHook } from 'src/common/hooks/pre-update';

@Schema({ collection: COLLECTION_CONST().CRM_POP_GIFT })
export class Base extends Document { }
const PopGiftSchema = SchemaFactory.createForClass(Base);
PopGiftSchema.add(ParentSchema.obj);

@Schema()
export class PopGiftModel extends Document {
    
    @Prop({ type: Number })
    org_id: number;
    
    @Prop({ type: String })
    product_code: string;
    
    @Prop({ type: String })
    product_name: string;
    
    @Prop({ type: String })
    description: string;    
    
}

const childSchema = SchemaFactory.createForClass(PopGiftModel);
PopGiftSchema.add(childSchema.obj);

PopGiftSchema.pre('findOneAndUpdate', preUpdateHook);
PopGiftSchema.pre('updateOne', preUpdateHook);
PopGiftSchema.pre('updateMany', preUpdateHook);

export { PopGiftSchema };