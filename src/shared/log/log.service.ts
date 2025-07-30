import { HttpStatus, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { FormBuilderLogModel } from './models/form-builder-logs.model';
import { ModuleTransactionLogModel } from './models/module-transactions-logs.model';
import { toObjectId } from 'src/common/utils/common.utils';
import { ResponseService } from 'src/services/response.service';
import { ModuleTransactionEnum } from './dto/log.dto';
import { DB_NAMES } from 'src/config/db.constant';
@Injectable()
export class LogService {
  constructor
    (
      @InjectModel(FormBuilderLogModel.name, DB_NAMES().SUPPORT_DB) private formBuilderLogModel: Model<FormBuilderLogModel>,
      @InjectModel(ModuleTransactionLogModel.name, DB_NAMES().SUPPORT_DB) private moduleTransactionLogModel: Model<ModuleTransactionLogModel>,
      private readonly res: ResponseService
    ) { }

  async formAction(req: Request, params: any): Promise<any> {
    let saveObj: object = {
      ...req['createObj'],
      ...params
    }
    const document = new this.formBuilderLogModel(saveObj);
    await document.save();
    return this.res.success('SUCCESS.LOG_SAVE');
  }

  async transactionAction(req: Request, params: any): Promise<any> {
    try {
      if (params.action === ModuleTransactionEnum.ADD || params.action === ModuleTransactionEnum.UPDATE || params.action === ModuleTransactionEnum.DELETE) {
        if (!params?.row_id) return this.res.error(HttpStatus.BAD_REQUEST, 'ERROR.BAD_REQ', 'row_id is required');
      }


      if (Array.isArray(params.row_id)) {
        params.row_id = params.row_id.map(id => toObjectId(id));
      } else {
        params.row_id = toObjectId(params.row_id);
      }

      const saveObj: object = {
        ...req['createObj'],
        ...params,
      };

      await this.moduleTransactionLogModel.insertOne(saveObj);
      return this.res.success('SUCCESS.LOG_SAVE');
    } catch (error) {
      return this.res.error(HttpStatus.BAD_REQUEST, 'ERROR.BAD_REQ', error);
    }
  }




  async read(req: Request, params: any): Promise<any> {
    try {

      let match: Record<string, any> = {
        is_delete: 0,
        org_id: req['user']['org_id'],
        module_id: params.module_id,
        module_type: params.module_type
      };

      if (params?.row_id) {
        match.row_id = toObjectId(params.row_id);
      } else {
        match.$or = [
          { row_id: { $exists: false } },
          { action: "delete" } // Include rows with "delete" action when row_id is not provided
        ];
      }

      const projection: Record<string, any> = {
        created_at: 1,
        created_name: 1,
        message: 1,
        changes: 1,
      };
      const sorting: Record<string, any> = {
        created_at: -1,
      };
      // Prepare query for both moduleData and formData
      const moduleData: Record<string, any>[] = await this.moduleTransactionLogModel.find(match, projection).sort(sorting).limit(500).exec();

      let formData: Record<string, any>[];
      if (!params.row_id) formData = await this.formBuilderLogModel.find(match, projection).sort(sorting).limit(500).exec();

      // Combine both moduleData and formData
      let data: Record<string, any>[] = [...moduleData, ...formData || []];

      // Sort by created_at in descending order, checking for valid dates
      data.sort((a: any, b: any) => {
        const dateA = a.created_at;
        const dateB = b.created_at
        return dateB - dateA;
      });

      // Return success with the sorted data
      return this.res.success('SUCCESS.FETCH', data);
    } catch (error) {
      return this.res.error(HttpStatus.BAD_REQUEST, 'ERROR.BAD_REQ', error);
    }
  }













}
