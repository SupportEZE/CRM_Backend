import { Module } from '@nestjs/common';
import { BeatRouteController } from './web/beat-route.controller';
import { BeatRouteService } from './web/beat-route.service';
import { MongooseModule } from '@nestjs/mongoose';
import { BeatRouteModel, BeatRouteSchema } from './models/beat-route.model';
import { ResponseService } from 'src/services/response.service';
import { FormBuilderModule } from 'src/shared/form-builder/form-builder.module';
import { CsvModule } from 'src/shared/csv/csv.module';
import { UserModule } from '../../user/user.module';
import { BeatRouteUploadService } from './beat-route-upload.service';
import { PostalCodeModule } from '../postal-code/postal-code.module';

@Module({
    imports: [
        MongooseModule.forFeature([
            { name: BeatRouteModel.name, schema: BeatRouteSchema },
        ]),
        FormBuilderModule,
        CsvModule,
        UserModule,
        PostalCodeModule,
    ],
    controllers: [BeatRouteController],
    providers: [BeatRouteService, ResponseService, BeatRouteUploadService],
    exports: [BeatRouteService],
})
export class BeatRouteModule { }
