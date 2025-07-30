import { Module } from '@nestjs/common';
import { FaqController } from './web/faq.controller';
import { FaqService } from './web/faq.service';
import { AppFaqController } from './app/app-faq.controller';
import { AppFaqService } from './app/app-faq.service';
import { MongooseModule } from '@nestjs/mongoose';
import { FaqModel,FaqSchema } from './models/faq.model';
import { ResponseService } from 'src/services/response.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: FaqModel.name, schema: FaqSchema },
    ]),
  ],
  controllers: [FaqController,AppFaqController],
  providers: [FaqService,AppFaqService,ResponseService],
})
export class FaqModule {}
