import { Module,Global } from '@nestjs/common';
import { Lts } from './translate.service';
@Global()
@Module({
  imports: [],
  controllers: [],
  providers: [Lts],
  exports:[Lts]
})
export class TranslateModule { }
