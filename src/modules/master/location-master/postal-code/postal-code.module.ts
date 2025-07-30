import { Module } from '@nestjs/common';
import { PostalCodeController } from './web/postal-code.controller';
import { PostalCodeService } from './web/postal-code.service';
import { MongooseModule } from '@nestjs/mongoose';
import { PostalCodeModel, PostalCodeSchema } from './models/postal-code.model';
import { ResponseService } from 'src/services/response.service';
import { OrgModel, OrgSchema } from '../../org/models/org.model';

@Module({
    imports: [
        MongooseModule.forFeature([
            { name: PostalCodeModel.name, schema: PostalCodeSchema }
        ])
    ],
    controllers: [PostalCodeController],
    providers: [PostalCodeService, ResponseService],
    exports: [PostalCodeService],
})
export class PostalCodeModule { }
