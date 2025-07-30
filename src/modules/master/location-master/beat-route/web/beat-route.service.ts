import { HttpStatus, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { ResponseService } from 'src/services/response.service';
import { commonFilters, appCommonFilters, eMatch, Like, nextSeq } from 'src/common/utils/common.utils';
import { BeatRouteModel } from '../models/beat-route.model';
import { FormBuilderService } from 'src/shared/form-builder/form-builder.service';
import { CsvService } from 'src/shared/csv/csv.service';
import { SharedUserService } from 'src/modules/master/user/shared-user.service';

@Injectable()
export class BeatRouteService {
  constructor(
    @InjectModel(BeatRouteModel.name) private beatrouteModel: Model<BeatRouteModel>,
    private readonly res: ResponseService,
    private readonly formBuilderService: FormBuilderService,
    private readonly csvService: CsvService,
    private readonly sharedUserService: SharedUserService
  ) { }

  async create(req: any, params: any): Promise<any> {
    try {
      const orgId = req['user']['org_id'];
      let exist = await this.beatrouteModel.findOne({ org_id: orgId, description: params.description }).exec();
      if (exist) return this.res.error(HttpStatus.BAD_REQUEST, 'ERROR.BEAT_ALREADY_EXIST');

      const seq = {
        modelName: this.beatrouteModel,
        idKey: 'beat_route_code',
        prefix: 'BEAT'
      }

      const beat_route_code = await nextSeq(req, seq)

      const saveObj = {
        ...req['createObj'],
        ...params,
        beat_route_code: beat_route_code,
      };

      const document = new this.beatrouteModel(saveObj);
      await document.save();

      return this.res.success('SUCCESS.CREATE')
    } catch (error) {
      return this.res.error(HttpStatus.BAD_REQUEST, 'ERROR.BAD_REQ', error);
    }
  }

  async read(req: any, params: any): Promise<any> {
    try {
      let match: any = { is_delete: 0, org_id: req['user']['org_id'] };
      let filters: Record<string, any> = params?.filters ? commonFilters(params.filters) : {};
      match = { ...match, ...filters };

      const page: number = params?.page || global.PAGE;
      const limit: number = params?.limit || global.LIMIT;
      const skip: number = (page - 1) * limit;

      const projection = {};
      const data = await this.beatrouteModel
        .find(match, projection)
        .sort({ _id: -1 })
        .skip(skip)
        .limit(limit)
        .lean();

      const total: number = await this.beatrouteModel.countDocuments(match);
      const result = await Promise.all(
        data.map(async (beatRoute) => {
          const assigned_users = await this.sharedUserService.fetchAssignedUser(req, { beat_route_code: beatRoute.beat_route_code });
          return {
            ...beatRoute,
            assigned_users
          };
        })
      );
      return this.res.pagination(result, total, page, limit);
    } catch (error) {
      return this.res.error(HttpStatus.BAD_REQUEST, 'ERROR.BAD_REQ', error);
    }
  }

  async update(req: any, params: any): Promise<any> {
    try {
      let exist = await this.beatrouteModel.findOne({ _id: params._id, is_delete: 0 }).lean();
      if (!exist) return this.res.error(HttpStatus.BAD_REQUEST, 'WARNING.NOT_EXIST');
      if (params?.is_delete && exist['is_delete'] === params?.is_delete) return this.res.error(HttpStatus.BAD_REQUEST, 'WARNING.ALREADY_DELETE');


      const updateObj = {
        ...req['updateObj'],
        ...params
      };

      const updatedDocument = await this.beatrouteModel.updateOne(
        { _id: params._id },
        updateObj
      );
      return this.res.success('SUCCESS.UPDATE', updatedDocument);
    } catch (error) {
      return this.res.error(HttpStatus.BAD_REQUEST, 'ERROR.BAD_REQ', error);
    }
  }

  async import(req: Request, params: any): Promise<any> {
    try {
      params.internalCall = true;
      params.platform = 'web';
      let data = await this.formBuilderService.read(req, params);
      const formData = data.form_data.map((row: any) => row.status === 1 ? `${row.label}*` : row.label);

      const csvData: any = await params.csv_data;
      const errors: any[] = [];
      const saveObjs: any[] = [];
      for (const row of csvData) {
        let rowErrors: string[] = [];

        const exist: Record<string, any> = await this.beatrouteModel.findOne({
          org_id: req['user']['org_id'],
          is_delete: 0,
          beat_route_code: eMatch(row['Beat Code*'])
        });

        if (exist) {
          row['Error'] = 'Duplicate Beat Code';
          errors.push(row);
          continue;
        }

        const form_data: any = {};
        formData.forEach((field: string) => {
          if (row[field]) {
            form_data[field] = row[field];
          }
        });

        if (rowErrors.length > 0) {
          row['Error'] = rowErrors.join(', ');
          errors.push(row);
          continue;
        }

        const saveObj: Record<string, any> = {
          ...req['createObj'],
          state: row['State*'],
          district: row['District*'],
          beat_route_code: row['Beat Code*'],
          description: row['Description*'],
          form_data: form_data,
        };
        saveObjs.push(saveObj);
      }

      if (saveObjs.length > 0) {
        const result = await this.beatrouteModel.insertMany(saveObjs, { ordered: false });
      }

      let csvResponse: Record<string, any>;
      if (errors.length > 0) {
        params.filename = `beatrouteerrors${req['user']['_id']}.csv`;
        params.data = errors;
        csvResponse = await this.csvService.generateCsv(req, params);
      }

      let resObj: Record<string, any> = {
        saved: saveObjs.length,
        updated: 0,
        errors,
        filename: csvResponse?.data?.filename
      };
      return this.res.success('SUCCESS.IMPORT', resObj);
    } catch (error) {
      return this.res.error(HttpStatus.BAD_REQUEST, 'ERROR.BAD_REQ', error);
    }
  }
  async readDropdown(req: Request, params: any): Promise<any> {
    try {

      let match: Record<string, any> =
      {
        is_delete: 0,
        org_id: req['user']['org_id'],
      };

      const projection: Record<string, any> = {
        beat_route_code: 1,
        description: 1,
      }

      if (params?.filters?.search) {
        const fieldsToSearch = ["beat_route_code"];
        const searchQuery = appCommonFilters(params.filters, fieldsToSearch);
        match = { ...match, ...searchQuery };
      }


      let data: Record<string, any>[] = await this.beatrouteModel.find(match, projection).limit(global.OPTIONS_LIMIT).lean()

      data = data.map((row: any) => {
        return {
          label: row.beat_route_code,
          value: row._id,
          description: row.description,
        }
      })

      return this.res.success('SUCCESS.FETCH', data)
    } catch (error) {
      return this.res.error(HttpStatus.BAD_REQUEST, 'ERROR.BAD_REQ', error);
    }
  }
}
