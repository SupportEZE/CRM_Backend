import { Module,forwardRef } from '@nestjs/common';
import { TargetController } from './web/target.controller';
import { AppTargetController } from './app/app-target.controller';
import { TargetService } from './web/target.service';
import { AppTargetService } from './app/app-target.service';
import { MongooseModule } from '@nestjs/mongoose';
import { TargetModel, TargetSchema } from './models/target.model';
import { TargetMappingModel, TargetMappingSchema } from './models/target-mapping.model';
import { ResponseService } from 'src/services/response.service';
import { FormBuilderModule } from 'src/shared/form-builder/form-builder.module';
import { UserModule } from 'src/modules/master/user/user.module';
import { GlobalModule } from 'src/shared/global/global.module';


@Module({
    imports: [
        MongooseModule.forFeature([
            { name: TargetModel.name, schema: TargetSchema },
            { name: TargetMappingModel.name, schema: TargetMappingSchema },
        ]),
        FormBuilderModule,
        UserModule,
        forwardRef(() => GlobalModule),
        
        
    ],
    controllers: [TargetController, AppTargetController],
    providers: [TargetService, ResponseService, AppTargetService],
    exports:[AppTargetService]
})

export class TargetModule { }
