import { HttpStatus, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { ResponseService } from 'src/services/response.service';
import { Lts } from 'src/shared/translate/translate.service';
import { CsvService } from 'src/shared/csv/csv.service';
import { BeatRouteModel } from './models/beat-route.model';
import { Readable } from 'stream';
import * as csvParser from 'csv-parser';
import { FormBuilderService } from 'src/shared/form-builder/form-builder.service';
import { UserService } from '../../user/web/user.service';
import { PostalCodeService } from '../postal-code/web/postal-code.service';

@Injectable()
export class BeatRouteUploadService {
    constructor(
        @InjectModel(BeatRouteModel.name) private beatRouteModel: Model<BeatRouteModel>,
        private readonly res: ResponseService,
        private readonly lts: Lts,
        private readonly csvService: CsvService,
        private readonly formBuilderService: FormBuilderService,
        private readonly userService: UserService,
        private readonly postalCodeService: PostalCodeService,
    ) { }

    async uploadBeatData(req: Request, file: Express.Multer.File): Promise<any> {
        const orgId = req['user']['org_id'];
        const createdId = req['user']['_id'];
        const createdName = req['user']['name'];
        const now = new Date();
        const insertedIds: string[] = [];
        const skippedBeatCodes: string[] = [];

        try {
            const stream = Readable.from(file.buffer);
            const rows: any[] = [];

            await new Promise<void>((resolve, reject) => {
                stream
                    .pipe(csvParser())
                    .on('data', (row) => rows.push(row))
                    .on('end', resolve)
                    .on('error', reject);
            });

            for (const row of rows) {
                const beatCode = row['Beat Code']?.trim();
                if (!beatCode) continue;

                const existingBeat = await this.beatRouteModel.findOne({
                    beat_route_code: beatCode,
                    org_id: orgId,
                    is_delete: 0,
                });

                if (existingBeat) {
                    skippedBeatCodes.push(beatCode);
                    continue;
                }

                const doc = {
                    org_id: orgId,
                    created_id: createdId,
                    created_name: createdName,
                    is_delete: 0,
                    source: 'web',
                    district: row['District'],
                    state: row['State'],
                    description: row['Description'],
                    beat_route_code: beatCode,
                    created_at: now,
                };

                const beatDoc = new this.beatRouteModel(doc);
                const insert = await beatDoc.save();
                insertedIds.push(insert._id.toString());
            }

            return this.res.success('SUCCESS.UPLOAD', {
                insertedCount: insertedIds.length,
                insertedIds,
                skippedBeatCodesCount: skippedBeatCodes.length,
                skippedBeatCodes,
            });
        } catch (error) {
            return this.res.error(HttpStatus.BAD_REQUEST, 'ERROR.BAD_REQ', error);
        }
    }

    // Upload Beat routes with status tracking
    async uploadBeatDataV2(req: Request, file: Express.Multer.File): Promise<any> {
      try {
        const org_id = req['user']['org_id'];
        const createdId = req['user']['_id'];
        const createdName = req['user']['name'];
        const form_id = req.body['form_id'];
        const now = new Date();
        const insertedIds: string[] = [];
        const skippedBeatCodes: string[] = [];

        let schema = await this.formBuilderService.read(req, { form_id });
        schema = schema?.data?.form_data;



        const rows: any[] = [];
        const stream = Readable.from(file.buffer);

        await new Promise<void>((resolve, reject) => {
          stream
            .pipe(csvParser())
            .on('data', (row) => {
              row = Object.entries(row).reduce((acc, [item, value]) => {
                acc[item] = value;
                return acc;
              }, {});
              rows.push(row);
            })
            .on('end', resolve)
            .on('error', reject);
        });


        const processedRows: any[] = [];

        for (const row of rows) {
          let statusMessage = 'Done';

          try {
            const validatedRow = await this.validateRow(row, schema);

            if ('errors' in validatedRow) {
              throw new Error(`Validation Error: ${validatedRow.errors.join(', ')}`);
            }

            const existing = await this.beatRouteModel.findOne({
              org_id,
              description: validatedRow.description
            }).exec();

           if (existing) {
              skippedBeatCodes.push(validatedRow.description);
              throw new Error('Error: Beat description already exists');
            }

            // Validate exixting beat code or beat name
            const isBeatCodeExist = await this.beatRouteModel.findOne(
              {
                beat_route_code: validatedRow.beat_route_code,
                org_id,
                is_delete: 0,
              }
            );

            if (isBeatCodeExist) {
              throw new Error('Error: Beat code is already exist.');
            }

            const isPostalCodeDataExist = await this.postalCodeService.isPostalDataExist(org_id, {
              country: validatedRow?.country,
              state: validatedRow?.state,
              district: validatedRow?.district,
            });

            if (!isPostalCodeDataExist) {
              throw new Error('Error: Invalid postal data (country/state/district)');
            }

            const params = { user_codes: validatedRow.assign_employee_code };
            const users = await this.userService.findUsersByUserCodes(org_id, params);

            if (validatedRow.assign_employee_code.length !== users.length) {
              throw new Error('Error: Some user_codes are invalid');
            }

            validatedRow.assigned_users = users;


            const doc = {
              org_id,
              created_id: createdId,
              created_name: createdName,
              is_delete: 0,
              created_at: now,
              ...validatedRow,
            };

            const beatDoc = new this.beatRouteModel(doc);
            const insert = await beatDoc.save();
            insertedIds.push(insert._id.toString());

          } catch (err) {
            statusMessage = err.message || 'Error processing row';
          }

          processedRows.push({ ...row, Status: statusMessage });
        }

        const filename = `BeatRoute_upload_status_${req['user']['_id']}.csv`;
        const csvResponse = await this.csvService.generateCsv(req, {
          filename,
          data: processedRows
        });

        const hasErrors = processedRows.some((row) => row.Status.startsWith('Error'));

        return hasErrors
          ? this.res.error(HttpStatus.BAD_REQUEST, `Some rows failed. See CSV: ${csvResponse?.data?.filename}`, {
            filename: csvResponse?.data?.filename
          })
          : this.res.success('SUCCESS.UPLOAD', {
            insertedCount: insertedIds.length,
            insertedIds,
            skippedBeatCodesCount: skippedBeatCodes.length,
            skippedBeatCodes,
            filename: csvResponse?.data?.filename
          });

      } catch (error) {
        return this.res.error(HttpStatus.BAD_REQUEST, 'ERROR.BAD_REQ', error);
      }
    }

    // Validate Row against form schema
    async validateRow(row: any, schema: any) {
      try {
      const errors = [];
      const mappedRow: any = {};
      for (const field of schema) {
        const required = field?.required;
        const label = required ? `${field.label}*` : field.label;
        const name = field.name;
        const isCommaSeperated  = field.isCommaSeperated;
        let value = row[`${label}`];

        if (required && (!value || value.toString().trim() === '')) {
          errors.push(`${label} is required`);
          continue;
        }

        // split comma seperated and convert it into array string
        if(isCommaSeperated && required) {
          value = value.split(',').map((item:string) => item.trim())
        }

        if (value !== undefined) {
          mappedRow[name] = value;
        }
      }

      return errors.length ? { errors } : mappedRow;
      } catch (err) {
        console.log('Error during Validating row\n', row, '\nagainst this schema \n', schema, '\nError: ', err)
      }
    }
}

