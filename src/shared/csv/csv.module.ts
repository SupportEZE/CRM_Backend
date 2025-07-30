import { forwardRef, Module } from '@nestjs/common';
import { CsvService } from './csv.service';
import { ResponseService } from 'src/services/response.service';
import { CsvController } from './csv.controller';
import { FormBuilderModule } from '../form-builder/form-builder.module';
import { ProductModule } from 'src/modules/master/product/product.module';
import { UserModule } from 'src/modules/master/user/user.module';

@Module({
  imports:[
    FormBuilderModule,
    forwardRef(() => ProductModule),
    forwardRef(() => UserModule),
  ],
  providers: [CsvService,ResponseService],
  controllers: [CsvController],
  exports:[CsvService]
})
export class CsvModule {}
