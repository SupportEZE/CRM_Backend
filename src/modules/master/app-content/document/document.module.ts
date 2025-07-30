import { Module } from '@nestjs/common';
import { DocumentController } from './web/document.controller';
import { DocumentService } from './web/document.service';
import { MongooseModule } from '@nestjs/mongoose';
import { DocumentModel, DocumentSchema } from './models/document.model';
import { ResponseService } from 'src/services/response.service';
import { LoginTypeModel } from '../../rbac/models/login-type.model';
import { AppDocumentController } from './app/app-document.controller';
import { AppDocumentService } from './app/app-document.service';
import { DocumentDocsModel, DocumentDocsSchema } from './models/document-docs.model';
import { S3Service } from 'src/shared/rpc/s3.service';


@Module({
  imports: [
    MongooseModule.forFeature([
      { name: DocumentDocsModel.name, schema: DocumentDocsSchema },
      { name: DocumentModel.name, schema: DocumentSchema },
      { name: LoginTypeModel.name, schema: LoginTypeModel },
    ]),
  ],
  controllers: [DocumentController, AppDocumentController],
  providers: [
    DocumentService,
    ResponseService,
    AppDocumentService,
    S3Service
  ], // <-- Add service here
})
export class DocumentModule { }
