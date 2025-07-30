import { Module } from '@nestjs/common';
import { CallRequestController } from './web/call-request.controller';
import { CallRequestService } from './web/call-request.service';
import { MongooseModule } from '@nestjs/mongoose';
import { CallRequestModel,CallRequestSchema } from './models/call-request.model';
import { ResponseService } from 'src/services/response.service';
import { AppCallRequestController } from './app/app-call-request.controller';
import { AppCallRequestService } from './app/app-call-request.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: CallRequestModel.name, schema: CallRequestSchema },
    ]),
  ],
  controllers: [CallRequestController,AppCallRequestController],
  providers: [CallRequestService,AppCallRequestService,ResponseService],
})
export class CallRequestModule {}