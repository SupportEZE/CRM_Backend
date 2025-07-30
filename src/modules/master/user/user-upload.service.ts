import { HttpStatus, Injectable, forwardRef, Inject } from '@nestjs/common';
import { InjectConnection, InjectModel } from '@nestjs/mongoose';
import { UserModel } from './models/user.model';
import { ClientSession, Model } from 'mongoose';
import { ResponseService } from 'src/services/response.service';
import { toObjectId, generatePassword, generateUsername, commonFilters, Like } from 'src/common/utils/common.utils';
import { UserHierarchyModel } from './models/user-hierarchy.model';
import { SharedUserService } from './shared-user.service';
import { Readable } from 'stream';
import * as csvParser from 'csv-parser';
import { FormBuilderService } from 'src/shared/form-builder/form-builder.service';
import { CsvService } from 'src/shared/csv/csv.service';
import { DropdownService } from '../dropdown/web/dropdown.service';
import { Connection } from 'mongoose';
import { PostalCodeService } from '../location-master/postal-code/web/postal-code.service';

@Injectable()
export class UserUploadService {
    constructor(
        @InjectModel(UserModel.name) private userModel: Model<UserModel>,
        @InjectModel(UserHierarchyModel.name) private userHierarchyModel: Model<UserHierarchyModel>,
        private readonly res: ResponseService,
        private readonly sharedUserService: SharedUserService,
        private readonly formBuilderService: FormBuilderService,
        @Inject(forwardRef(() => CsvService))
        private readonly csvService: CsvService,
        private readonly dropdownService: DropdownService,
        private readonly postalCodeService: PostalCodeService,
        @InjectConnection() private connection: Connection,




    ) { }

    async uploadUserData(req: Request, file: Express.Multer.File): Promise<any> {
        if (!file || !file.buffer) return this.res.error(HttpStatus.BAD_REQUEST, 'ERROR.BAD_REQ', 'file is required');
        const orgId = req['user']['org_id'];
        const createdId = req['user']['_id'];
        const createdName = req['user']['name'];
        const now = new Date();
        const insertedIds: string[] = [];


        if (req.body['type'] === 'mapping') {
            return await this.uploadUserMappingData(req, file);
        }

        try {
            const stream = Readable.from(file.buffer);
            const rows: any[] = [];
            const updatedUsers: string[] = [];
            await new Promise<void>((resolve, reject) => {
                stream
                    .pipe(csvParser())
                    .on('data', (row) => rows.push(row))
                    .on('end', resolve)
                    .on('error', reject);
            });

            for (const row of rows) {

                const moment = require('moment');
                const dateCreated = row['Date Created'];
                const createdAt = moment.utc(dateCreated, "YYYY-MM-DD", true);

                const mobile = row['Mobile No.']?.trim();

                if (!mobile) {
                    continue;
                }

                const existingMobile = await this.userModel.findOne({
                    mobile: mobile,
                    org_id: orgId,
                    is_delete: 0,
                });

                if (existingMobile) {
                    updatedUsers.push(mobile);
                    const updateObj = {
                        name: row['Name'],
                        mobile: row['Mobile No.'],
                        email: row['Email Id'],
                        user_code: row['Employee Code']?.trim(),
                        designation: '',
                        weekly_off: row['Weekly Off'],
                        state: '',
                        district: '',
                        city: '',
                        pincode: '',
                        form_data: {
                            date_of_joining: row['Date of Joining'],
                            brand: row['Brand'] ? [row['Brand']] : [],
                            order_type: "Both"
                        },
                    };

                    await this.userModel.updateOne(
                        { _id: existingMobile._id },
                        updateObj
                    );
                    continue;
                }

                const doc = {
                    created_id: createdId,
                    created_name: createdName,
                    is_delete: 0,
                    source: 'web',
                    org_id: orgId,
                    login_type_id: 4,
                    login_type_name: "Field User",
                    name: row['Name'],
                    mobile: row['Mobile No.'],
                    email: row['Email Id'],
                    user_code: row['Employee Code']?.trim(),
                    designation: 'Field User',
                    weekly_off: row['Weekly Off'],
                    state: '',
                    district: '',
                    city: '',
                    pincode: '',
                    language_code: "en",
                    username: row['Username'],
                    password: row['Password'],
                    form_data: {
                        date_of_joining: row['Date of Joining'],
                        brand: row['Brand'] ? [row['Brand']] : [],
                        order_type: "Both"
                    },
                    status: row['Status'] === 'Active' ? 'Active' : 'Inactive',
                    created_at: new Date(createdAt) ?? new Date()
                };

                const userDoc = new this.userModel(doc);
                const insert = await userDoc.save();
            }

            return this.res.success('SUCCESS.UPLOAD', { insertedCount: insertedIds.length, insertedIds, updatedCount: updatedUsers.length, updatedUsers });
        } catch (error) {
            return this.res.error(HttpStatus.BAD_REQUEST, 'ERROR.BAD_REQ', error);
        }
    }

    async uploadUserMappingData(req: Request, file: Express.Multer.File): Promise<any> {
        if (!file || !file.buffer) return this.res.error(HttpStatus.BAD_REQUEST, 'ERROR.BAD_REQ', 'file is required');
        const orgId = req['user']['org_id'];
        const createdId = req['user']['_id'];
        const createdName = req['user']['name'];
        const now = new Date();
        const insertedIds: string[] = [];

        try {
            const stream = Readable.from(file.buffer);
            const rows: any[] = [];
            const skippedUsers: string[] = [];

            await new Promise<void>((resolve, reject) => {
                stream
                    .pipe(csvParser())
                    .on('data', (row) => rows.push(row))
                    .on('end', resolve)
                    .on('error', reject);
            });

            for (const row of rows) {

                const mobile = row['Mobile No.']?.trim();

                if (!mobile) {
                    continue;
                }

                const existingMobile = await this.userModel.findOne({
                    mobile: mobile,
                    org_id: orgId,
                    is_delete: 0,
                });


                if (existingMobile) {
                    const managerData = await this.userModel.findOne({
                        user_code: row['Manager Code']?.trim(),
                        org_id: orgId,
                        is_delete: 0,
                    });

                    const existinguser = await this.userModel.findOne({
                        user_code: row['Employee Code'],
                        org_id: orgId,
                        is_delete: 0,
                    });

                    if (managerData) {

                        await this.userModel.updateOne({ _id: existinguser._id }, {
                            reporting_manager_id: managerData._id,
                            reporting_manager_name: managerData.name
                        });

                        const managerMap = {
                            org_id: orgId,
                            created_id: createdId,
                            created_name: createdName,
                            is_delete: 0,
                            source: 'web',
                            parent_user_name: managerData.name,
                            parent_user_id: managerData._id,
                            child_user_id: existinguser._id,
                            child_user_name: row['Name'],
                            created_at: now,
                        };

                        const mapManagerDoc = new this.userHierarchyModel(managerMap);
                        await mapManagerDoc.save();
                    }
                }
            }

            return this.res.success('SUCCESS.UPLOAD', { insertedCount: insertedIds.length, insertedIds, skippedCount: skippedUsers.length, skippedUsers });
        } catch (error) {
            return this.res.error(HttpStatus.BAD_REQUEST, 'ERROR.BAD_REQ', error);
        }
    }

    async getFormSchema(req: Request, params: { form_id: string}): Promise<any> {
      try {
        return await this.formBuilderService.read(req, params);
      } catch (error) {
        return this.res.error(HttpStatus.BAD_REQUEST, 'ERROR.BAD_REQ', error);
      }
    }

    // Upload Sales Users with field-name based mapping
    async uploadSalesUsers(req: Request, file: Express.Multer.File): Promise<any> {
      const session: ClientSession = await this.connection.startSession();
      const now = new Date();
      const org_id = req['user']['org_id'];
      const createdId = req['user']['_id'];
      const createdName = req['user']['name'];
      const form_id = req.body['form_id'];
      const insertedIds: string[] = [];
      const processedRows: any[] = [];

      try {
        let schema = await this.formBuilderService.read(req, { form_id });
        schema = schema?.data?.form_data;

        const rows: any[] = [];
        const stream = Readable.from(file.buffer);
        await new Promise<void>((resolve, reject) => {
          stream
            .pipe(csvParser())
            .on('data', (row) => {
              row = Object.entries(row).reduce((acc, [item, value]) => {
                acc[item.trim()] = value;
                return acc;
              }, {});
              rows.push(row);
            })
            .on('end', resolve)
            .on('error', reject);
        });

        for (const row of rows) {
          session.startTransaction();
          let statusMessage = 'Done';

          try {
            const validatedRow = await this.validateRow(row, schema);
            if ('errors' in validatedRow) {
              throw new Error(`Validation Error: ${validatedRow.errors.join(', ')}`);
            }


            //NOTE: checking all dependent dropdown exist or not if not then create or skip
            let dependent_form_data = validatedRow?.dependent_form_data;
            let form_data = validatedRow?.custome_form_data;

            for(const dependent of dependent_form_data) {
              if(['segments', 'designation', 'assign_brands'].includes(dependent?.name)) {
                // Check in dropdown modal if that key exist like brand
                let dropdown_id = await this.dropdownService.getDropdown({ org_id, dropdown_name: dependent?.name}, {_id: 1});
                dropdown_id = dropdown_id?._id;
                const dropdown_name = dependent?.name;

                if(!dropdown_id) {
                  const addedCategory = await this.dropdownService.addDropdownOptions({created_id: createdId, created_name: createdName},{org_id, dropdown_name, dropdown_options: [dropdown_name], module_id: 7 }, session)
                }

                // Check in dropdown option modal that value of brand, colors dropdown exist or not otherwise add
                let dropdown_options = form_data[dropdown_name]

                dropdown_options = Array.isArray(dropdown_options) ? dropdown_options : [dropdown_options]
                const is_dropdown_option_value_exist = await this.dropdownService.addDropdownOptions({created_id: createdId, created_name: createdName}, {org_id, dropdown_name, dropdown_options, module_id: 7 }, session)
              }
            }

            // Check unique Employee / User Code
            if(validatedRow.user_code) {
              const userExistWithUserCode = await this.userModel.findOne({user_code: validatedRow.user_code})
              if(userExistWithUserCode) {
                throw new Error(`Error: User Exist with this user_code: ${validatedRow.user_code}`)
              }
            } else {
                throw new Error(`Error: User Employee Code is required.`)
            }

            // Check For Reporting manager employee code if DNE then add user but add warning to table
            if(validatedRow.reporting_manager_name) {
              const reportingManagerExistWithUserCode = await this.userModel.findOne({reporting_manager_name: validatedRow.reporting_manager_name})
              if(!reportingManagerExistWithUserCode) {
                statusMessage = 'Waring : Reporting manager name is not find.'
              }
            } else {
              statusMessage = 'Waring : Reporting manager name is not provided.'
            }


            // Check for address by city and pincode is exist in zone or not
            const isPostalCodeDataExist = await this.postalCodeService.isPostalDataExist(org_id, {
              country: validatedRow?.country,
              state: validatedRow?.state,
              district: validatedRow?.district,
            });

            if(!isPostalCodeDataExist) {
              throw new Error(`Error: Zone does not exist with this state, country and district.`)
            }



            const password: string = `${validatedRow.name}-${validatedRow.mobile.slice(-4)}`;
            const username = generateUsername(password)
            const doc = {
              org_id,
              created_id: createdId,
              created_name: createdName,
              is_delete: 0,
              created_at: now,
              login_type_name: 'Sales Field User',
              password,
              username,
              form_data: validatedRow.custome_form_data,
              ...validatedRow,
              login_type_id: 4
            };

            const userDoc = new this.userModel(doc);
            const inserted = await userDoc.save({session});
            insertedIds.push(inserted._id.toString());
            await session.commitTransaction();
          } catch (err) {
            await session.abortTransaction();
            statusMessage = err.message || 'Error processing row';
          }

          processedRows.push({ ...row, Status: statusMessage });
        }

        const filename = `SalesUsers_upload_status_${createdId}.csv`;
        const csvResponse = await this.csvService.generateCsv(req, { filename, data: processedRows });
        const hasErrors = processedRows.some((row) => row.Status.startsWith('Error'));

        return hasErrors
          ? this.res.error(HttpStatus.BAD_REQUEST, `Some rows failed. See CSV: ${csvResponse?.data?.filename}`, {
              filename: csvResponse?.data?.filename,
            })
          : this.res.success('SUCCESS.UPLOAD', {
              insertedCount: insertedIds.length,
              insertedIds,
              filename: csvResponse?.data?.filename,
            });
      } catch (error) {
        return this.res.error(HttpStatus.BAD_REQUEST, 'ERROR.BAD_REQ', error);
      }
    }

    // Reusable Row Validation Method
    async validateRow(row: any, schema: any) {
      try {
        const errors = [];
        const mappedRow: any = {};
        const custome_form_data: any = {};
        const dependent_form_data: any = {};

        for (const field of schema) {
          const required = field?.required;
          const label = required ? `${field.label}*` : field.label;
          const name = field.name;
          const type = field.type;
          const key_source = field.key_source;
          const is_duplicate = field.is_duplicate;
          const dropdown_options = field.options;
          const isCommaSeperated  = field.isCommaSeperated;

          let value = row[`${label}`];

          if (required && (!value || value.toString().trim() === '') && !is_duplicate) {
            errors.push(`${label} is required`);
            continue;
          }

          if (key_source === 'custom') {
            custome_form_data[name] = value;
          }

          if(type === 'MULTI_SELECT') {
              value = value.split(',').map((item:string) => item.trim())
          }

          // if multi select then we get array of data available dropdown-options
          // if row custom multi select value is not in available then create in dropdown
          if((type === 'SINGLE_SELECT' || type === 'MULTI_SELECT') && key_source === 'custom') {
            const is_dropdown_option_exist = dropdown_options.find((item: any) => item?.value === value) ? true : false;
            const dropdown_type = type;
            dependent_form_data[name] = {name, is_dropdown_option_exist, dropdown_type}
          }

          if (isCommaSeperated && value) {
            value = value.split(',').map((item: string) => item.trim());
          }

          if (value !== undefined) {
            mappedRow[name] = value;
          }
        }

        mappedRow['custome_form_data'] = custome_form_data;
        mappedRow['dependent_form_data'] = [...Object.values(dependent_form_data)];

        return errors.length ? { errors } : mappedRow;
      } catch (err) {
        console.log('Error during Validating row\n', row, '\nagainst this schema \n', schema, '\nError: ', err);
        return { errors: ['Internal validation error'] };
      }
    }
}
