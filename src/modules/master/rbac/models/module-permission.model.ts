import { Prop, Schema, SchemaFactory} from '@nestjs/mongoose';
import { Document,Types } from 'mongoose';
import { ParentSchema } from 'src/common/schema/parent.schema';
import { COLLECTION_CONST } from 'src/config/collection.constant';
import { Schema as MongooseSchema } from 'mongoose';


@Schema({ collection: COLLECTION_CONST().CRM_MODULE_PERMISSION })
export class ModulePerModel extends Document {
    
    
    @Prop({ required: true})
    module_name: string;
    
    @Prop({ required: true})
    module_id: number;
    
    @Prop({ required: true})
    user_role_name: string;
    
    @Prop({ type: Types.ObjectId,required: true })
    user_role_id: string;
    
    @Prop({type: MongooseSchema.Types.Mixed })
    table_headers:  Record<string, any>;
    
    @Prop({type: MongooseSchema.Types.Mixed })
    app_list_access: Record<string, any>;
    
    @Prop({type: MongooseSchema.Types.Mixed })
    app_detail_access: Record<string, any>;
    
    @Prop({type: MongooseSchema.Types.Mixed })
    web_list_access: Record<string, any>;
    
    @Prop({type: MongooseSchema.Types.Mixed })
    web_detail_access: Record<string, any>;
    
    @Prop({ required: true, type: MongooseSchema.Types.Mixed })
    default_access: Record<string, any>;
    
    @Prop({ required: true })
    SFA: boolean;
    
    @Prop({ required: true })
    DMS: boolean;
    
    @Prop({ required: true })
    IRP: boolean;
    
    @Prop({ required: true })
    WMS: boolean;
    
    @Prop({ required: true })
    WCMS: boolean;
    
}

const ModulePerSchema = SchemaFactory.createForClass(ModulePerModel);
ModulePerSchema.add(ParentSchema.obj);
export { ModulePerSchema };
