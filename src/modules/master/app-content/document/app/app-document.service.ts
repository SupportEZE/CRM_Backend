import { HttpStatus, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { DocumentModel } from '../models/document.model';
import { Model } from 'mongoose';
import { ResponseService } from 'src/services/response.service';
import { DocumentDocsModel } from '../models/document-docs.model';
import { DocumentService } from '../web/document.service';

@Injectable()
export class AppDocumentService {
  constructor(
    @InjectModel(DocumentDocsModel.name) private documentDocsModel: Model<DocumentDocsModel>,
    @InjectModel(DocumentModel.name) private documentModel: Model<DocumentModel>,
    private readonly res: ResponseService,
    private readonly documentService: DocumentService
  ) { }

  async read(req: Request, params: any): Promise<any> {
    try {

      let match: Record<string, any> = {
        is_delete: 0,
        org_id: req['user']['org_id']
      };
      let sorting: Record<string, 1 | -1> = { _id: -1 };


      if (req['user']['login_type_id']) match.login_type_id = req['user']['login_type_id'];
      if (req['user']['customer_type_name']) match.customer_type_name = req['user']['customer_type_name'];

      let result: Record<string, any>[] = await this.documentModel.find(match).sort(sorting)
        .lean();

      result = await Promise.all(
        result.map(async (item: any) => {
          item.files = await this.documentService.getDocument(item._id)
          return item;
        })
      );


      return this.res.success('SUCCESS.FETCH', result.length ? result : []);
    } catch (error) {
      return this.res.error(HttpStatus.BAD_REQUEST, 'ERROR.BAD_REQ', error);
    }
  }
}
