import { Module } from '@nestjs/common';
import { ContactController } from './web/contact.controller';
import { ContactService } from './web/contact.service';
import { AppContactController } from './app/app-contact.controller';
import { AppContactService } from './app/app-contact.service';
import { MongooseModule } from '@nestjs/mongoose';
import { ContactModel,ContactSchema } from './models/contact.model';
import { ResponseService } from 'src/services/response.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: ContactModel.name, schema: ContactSchema },
    ]),
  ],
  controllers: [ContactController,AppContactController],
  providers: [ContactService,AppContactService,ResponseService],
})
export class ContactModule {}
