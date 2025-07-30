import { Module } from '@nestjs/common';
import { LanguageController } from './language.controller';
import { LanguageService } from './language.service';
import { UserModel, UserSchema } from '../user/models/user.model';
import { MongooseModule } from '@nestjs/mongoose';
import { LanguageModel, LanguageSchema } from './models/language.model';
import { ResponseService } from 'src/services/response.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: LanguageModel.name, schema: LanguageSchema },
      { name: UserModel.name, schema: UserSchema },
    ]),
  ],
  controllers: [LanguageController],
  providers: [LanguageService, ResponseService],
  exports: [LanguageService]
})
export class LanguageModule { }
