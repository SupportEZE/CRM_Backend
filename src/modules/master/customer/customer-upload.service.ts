import { forwardRef, HttpStatus, Inject, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { ResponseService } from 'src/services/response.service';
import { Lts } from 'src/shared/translate/translate.service';
import { CustomerModel } from './default/models/customer.model';
import { ReferralBonusModel } from './../referral-bonus/models/referral-bonus.model';
import { LedgerService } from 'src/modules/loyalty/ledger/web/ledger.service';
import { UserModel } from './../user/models/user.model';
import { CustomerBankDetailModel } from './default/models/customer-bank-detail.model';
import { CustomerContactPersonModel } from './default/models/customer-contact-person.model';
import { CustomerDocsModel } from './default/models/customer-docs.model';
import { CustomerOtherDetailModel } from './default/models/customer-other-detail.model';
import { CustomerShopGalleryModel } from './default/models/customer-shop-gallery.model';
import { CustomerTypeModel } from './../customer-type/models/customer-type.model';
import { UserToCustomerMappingModel } from './default/models/user-to-customer-mapping.model';
import { CustomerToCustomerMappingModel } from './default/models/customer-to-customer-mapping.dto';
import { CustomerShippingAddressModel } from './default/models/customer-shipping-address.model';
import { CustomerKycDetailModel } from './default/models/customer-kyc-details.model';
import { CryptoService } from 'src/services/crypto.service';
import { LoginTypeModel } from './../rbac/models/login-type.model';
import { NotificationService } from 'src/shared/rpc/notification.service';
import { S3Service } from 'src/shared/rpc/s3.service';
import { UserRoleModel } from './../rbac/models/user-role.model';
import { SharedCustomerService } from './shared-customer.service';
import { CustomerService } from './default/web/customer.service';
import { SharedUserService } from './../user/shared-user.service';
import { Readable } from 'stream';
import * as csvParser from 'csv-parser';
import { FormBuilderService } from 'src/shared/form-builder/form-builder.service';
import { CsvService } from 'src/shared/csv/csv.service';

@Injectable()
export class CustomerUploadService {
  constructor(
    @InjectModel(CustomerModel.name)
    private customerModel: Model<CustomerModel>,
    @InjectModel(UserModel.name) private userModel: Model<UserModel>,
    @InjectModel(CustomerBankDetailModel.name)
    private customerBankDetailModel: Model<CustomerBankDetailModel>,
    @InjectModel(CustomerContactPersonModel.name)
    private customerContactPersonModel: Model<CustomerContactPersonModel>,
    @InjectModel(CustomerDocsModel.name)
    private customerDocsModel: Model<CustomerDocsModel>,
    @InjectModel(CustomerOtherDetailModel.name)
    private customerOtherDetailModel: Model<CustomerOtherDetailModel>,
    @InjectModel(CustomerShopGalleryModel.name)
    private customerShopGalleryModel: Model<CustomerShopGalleryModel>,
    @InjectModel(CustomerTypeModel.name)
    private customerTypeModel: Model<CustomerTypeModel>,
    @InjectModel(UserToCustomerMappingModel.name)
    private userToCustomerMappingModel: Model<UserToCustomerMappingModel>,
    @InjectModel(CustomerToCustomerMappingModel.name)
    private customerToCustomerMappingModel: Model<CustomerToCustomerMappingModel>,
    @InjectModel(CustomerShippingAddressModel.name)
    private customerShippingAddressModel: Model<CustomerShippingAddressModel>,
    @InjectModel(CustomerKycDetailModel.name)
    private customerKycDetailModel: Model<CustomerKycDetailModel>,
    @InjectModel(ReferralBonusModel.name)
    private referralBonusModel: Model<ReferralBonusModel>,
    @InjectModel(LoginTypeModel.name)
    private loginTypeModel: Model<LoginTypeModel>,
    @InjectModel(UserRoleModel.name)
    private userRoleModel: Model<UserRoleModel>,
    private readonly res: ResponseService,
    private readonly s3Service: S3Service,
    private readonly lts: Lts,
    private readonly cryptoService: CryptoService,
    private readonly ledgerService: LedgerService,
    private readonly customerService: CustomerService,
    private readonly notificationService: NotificationService,
    @Inject(forwardRef(() => SharedCustomerService))
    private readonly sharedCustomerService: SharedCustomerService,
    private readonly sharedUserService: SharedUserService,
    private readonly formBuilderService: FormBuilderService,
    private readonly csvService: CsvService,
  ) {}

  // for testing purpose use temp models mention below
  // cust customerModel,customerContactPersonModel,customerTypeModel,customerOtherDetailModel
  // if you tested userModel data properly then user crm_users else crm_users_temp,

  async uploadCustomerData(
    req: Request,
    file: Express.Multer.File,
  ): Promise<any> {
    try {
      //TODO:login_type_id
      const login_type_id = req.body['login_type_id'];
      const customer_type_name = req.body['customer_type_name']; // like plumber, Distributer, Dealder etc.
      const org_id = req['user']['org_id'];
      if (!file) throw Error('Please provide CSV file.');
      const stream = Readable.from(file.buffer);
      const rows: any[] = [];

      // Parsing csv file and converting into row-column
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
      const typeAllowed: String[] = ['5', '6', '7', '10'];

      if (!typeAllowed.includes(login_type_id)) {
        return this.res.error(
          HttpStatus.BAD_REQUEST,
          'ERROR.BAD_REQ',
          'type not allowed',
        );
      }

      const customerTypeData = await this.customerTypeModel.findOne(
        {
          customer_type_name,
          is_delete: 0,
          org_id,
        },
        { customer_type_name: 1 },
      );

      return await this.saveCustomerData(req, rows, customerTypeData);
    } catch (error) {
      return this.res.error(HttpStatus.BAD_REQUEST, 'ERROR.BAD_REQ', error);
    }
  }

  async saveCustomerData(
    req: Request,
    rows: any[],
    customerTypeData: any,
  ): Promise<any> {
    try {
      const login_type_id = req.body['login_type_id'];
      const orgId = req['user']['org_id'];
      const createdId = req['user']['_id'];
      const createdName = req['user']['name'];
      const moment = require('moment');
      const insertedIds: string[] = [];
      const skippedUsers: string[] = [];
      const processedRows: any[] = [];
      let params = { org_id: orgId, form_id: req.body['form_id'] };
      let form_schema = await this.formBuilderService.read(req, params);
      form_schema = form_schema?.data?.form_data;

      for (const row of rows) {
        let statusMessage = 'Done';
        try {
          const validationResult = this.validateAndMapRow(row, form_schema);
          if ('errors' in validationResult) {
            statusMessage = `Error: ${validationResult.errors.join(', ')}`;
            throw new Error(statusMessage);
          }

          const newDoc = validationResult;

          const existingMobile = await this.customerModel.findOne({
            mobile: validationResult.mobile,
            org_id: orgId,
            is_delete: 0,
          });
          if (!customerTypeData?._id) {
            statusMessage = 'Error: Customer type not found';
            throw new Error(statusMessage);
          }

          const customer_type_id = customerTypeData._id;
          const customer_type_name = customerTypeData.customer_type_name;

          const exist = await this.customerService.identifier(req, {
            customer_type_id,
          });

          if (existingMobile) {
            skippedUsers.push(validationResult.mobile);
            statusMessage = 'Error: Mobile already exists';
            throw new Error(statusMessage);
          }

          const loginType = {
            '5': 'Primary',
            '6': 'Sub Primary',
            '7': 'Secondary',
            '10': 'Influencer',
          };

          const doc = {
            ...newDoc,
            ...req['createObj'],
            login_type_id: req.body['login_type_id'],
            login_type_name: loginType[`${req.body['login_type_id']}`],
            customer_type_id,
            customer_type_name,
            identifier: exist?.identifier,
            identifier_number: exist?.identifierNumber,
            profile_status: global.APPROVAL_STATUS[0],
            form_data: newDoc['custome_form_data'],
          };

          const customerDoc = new this.customerModel(doc);
          const insert = await customerDoc.save();
          insertedIds.push(`${insert._id}`);

          const otherObj = {
            ...req['createObj'],
            gst_number: doc?.gst_number || null,
            customer_id: insert._id,
          };
          const otherDoc = new this.customerOtherDetailModel(otherObj);
          await otherDoc.save();

          if (['5', '6', '7'].includes(login_type_id)) {
            const contact_person_mobile = doc?.mobile?.trim();
            const contact_person_name = doc?.customer_type_name;
            const match = {
              org_id: orgId,
              is_delete: 0,
              contact_person_mobile,
              customer_id: insert._id,
            };

            const existContact = await this.customerContactPersonModel
              .findOne(match)
              .lean();

            if (!existContact && contact_person_mobile && contact_person_name) {
              const contactObj = {
                ...req['createObj'],
                customer_id: insert._id,
                contact_person_mobile,
                contact_person_name,
              };
              const contactDoc = new this.customerContactPersonModel(
                contactObj,
              );
              await contactDoc.save();
            }
            //TODO: static field replace to dynamic if have differentiator
            const userCodeArr = row?.['Employee Code']
              ? row['Employee Code']
                  .split(',')
                  .map((code: string) => code.trim())
                  .filter(Boolean)
              : [];

            for (let code of userCodeArr) {
              const userData: any = await this.userModel.findOne(
                {
                  is_delete: 0,
                  org_id: orgId,
                  user_code: code,
                },
                {
                  name: 1,
                  email: 1,
                  user_code: 1,
                  designation: 1,
                  login_type_id: 1,
                },
              );

              if (userData) {
                const userDataForSave = {
                  label: userData.name,
                  value: userData._id,
                  user_code: userData.user_code,
                  login_type_id: userData.login_type_id,
                };

                const saveObj = {
                  ...req['createObj'],
                  customer_id: insert._id,
                  customer_name: doc.company_name,
                  customer_type_id,
                  customer_type_name,
                  user_id: userData._id,
                  user_data: userDataForSave,
                };

                const mapDoc = new this.userToCustomerMappingModel(saveObj);
                await mapDoc.save();
              }
            }
          }

          //TODO: static field replace to dynamic if have differentiator
          if (login_type_id === '7' && row?.['Assign Distributor Mobile No.']) {
            const existingDistributor = await this.customerModel.findOne({
              mobile: row['Assign Distributor Mobile No.'],
              org_id: orgId,
              login_type_id: 5,
              is_delete: 0,
            });

            if (existingDistributor) {
              const mapping = {
                ...req['createObj'],
                child_customer_id: insert._id,
                child_customer_name: row.child_customer_name,
                child_customer_type_name: customer_type_name,
                child_customer_type_id: customer_type_id,
                parent_customer_id: existingDistributor._id,
                parent_customer_name: existingDistributor.customer_name,
                parent_customer_type_name:
                  existingDistributor.customer_type_name,
                parent_customer_type_id: existingDistributor.customer_type_id,
              };

              const mapDoc = new this.customerToCustomerMappingModel(mapping);
              await mapDoc.save();
            }
          }

          if (login_type_id === '10') {
            const kycDate = moment.utc(
              row['Date Created'] || new Date(),
              'YYYY-MM-DD',
              true,
            );
            const kycObj = {
              created_id: createdId,
              created_name: createdName,
              is_delete: 0,
              created_at: new Date(kycDate) ?? new Date(),
              kyc_status: row?.kyc_status || null,
              status_remark: row?.status_remark || null,
              customer_id: insert._id,
            };
            const kycDoc = new this.customerKycDetailModel(kycObj);
            await kycDoc.save();

            const bankObj = {
              ...req['createObj'],
              account_no: row?.account_no || null,
              upi_id: null,
              beneficiary_name: row?.beneficiary_name || null,
              branch_name: null,
              bank_name: row?.bank_name || null,
              ifsc_code: row?.ifsc_code || null,
              customer_id: insert._id,
            };
            const bankDoc = new this.customerBankDetailModel(bankObj);
            await bankDoc.save();
          }
        } catch (err) {
          statusMessage = err.message || 'Error processing row';
        }

        processedRows.push({
          ...row,
          Status: statusMessage,
        });
      }

      // generate CSV report
      const filename = `Customer_upload_status_${req['user']['_id']}.csv`;
      const csvParams = { filename, data: processedRows };
      const csvResponse = await this.csvService.generateCsv(req, csvParams);

      const hasErrors = processedRows.some((row) =>
        row.Status.startsWith('Error'),
      );

      if (hasErrors) {
        return this.res.error(
          HttpStatus.BAD_REQUEST,
          `Some rows failed. See CSV: ${csvResponse?.data?.filename}`,
          {
            filename: csvResponse?.data?.filename,
          },
        );
      }

      return this.res.success('SUCCESS.UPLOAD', {
        insertedCount: insertedIds.length,
        insertedIds,
        skippedCount: skippedUsers.length,
        skippedUsers,
        filename: csvResponse?.data?.filename,
      });
    } catch (error) {
      return this.res.error(HttpStatus.BAD_REQUEST, 'ERROR.BAD_REQ', error);
    }
  }

  async updateSubPrimaryCustomerData(
    req: Request,
    row: any,
    exist_id: any,
  ): Promise<any> {
    try {
      let rawPincode = row['Pincode']?.trim();
      let pincode: number | null = null;

      if (rawPincode && /^[0-9]{6}$/.test(rawPincode)) {
        pincode = Number(rawPincode);
      } else {
        pincode = null;
      }

      const updateObj = {
        company_name: row['Company Name'],
        customer_name: row['Contact Person'],
        customer_code: row['Dealer Id']?.trim(),
        mobile: row['Contact Number'],
        alt_mobile_no: row?.['alt_mobile_no'] || null,
        country: 'India',
        state: row?.['State Name'].trim() || null,
        district: row?.['District'].trim() || null,
        city: row?.['City'].trim() || null,
        email: row['Email Address'],
        pincode: pincode,
        address: row?.['Address'] || null,
        form_data: {
          brand: row['Brand']
            ? row['Brand'].split(',').map((brand) => brand.trim())
            : [],
        },
      };

      await this.userModel.updateOne({ _id: exist_id }, updateObj);

      let otherDetailsexist: Record<string, any> =
        await this.customerOtherDetailModel
          .findOne({ customer_id: exist_id })
          .lean();

      if (otherDetailsexist) {
        const otherObj = {
          ...req['updateObj'],
          gst_number: row?.['GST'] || null,
        };

        await this.customerOtherDetailModel.updateOne(
          { customer_id: exist_id },
          otherObj,
        );
      }

      const contact_person_mobile = row?.['Contact Number'];
      const contact_person_name = row?.['Contact Person'];
      let match = {
        org_id: req['user']['org_id'],
        is_delete: 0,
        contact_person_mobile,
        customer_id: exist_id,
      };
      let exist: Record<string, any> = await this.customerContactPersonModel
        .findOne(match)
        .lean();
      if (!exist) {
        if (contact_person_mobile && contact_person_name) {
          const contactObj = {
            ...req['createObj'],
            customer_id: exist_id,
            contact_person_mobile,
            contact_person_name: row?.['Contact Person'],
          };
          const contactDoc = new this.customerContactPersonModel(contactObj);
          await contactDoc.save();
        }
      }
    } catch (error) {
      return this.res.error(HttpStatus.BAD_REQUEST, 'ERROR.BAD_REQ', error);
    }
  }

  async updateSecondaryCustomerData(
    req: Request,
    row: any,
    exist_id: any,
  ): Promise<any> {
    try {
      let rawPincode = row['Pincode']?.trim();
      let pincode: number | null = null;

      if (rawPincode && /^[0-9]{6}$/.test(rawPincode)) {
        pincode = Number(rawPincode);
      } else {
        pincode = null;
      }

      const updateObj = {
        company_name: row['Company Name'],
        customer_name: row['Contact Person'],
        customer_code: row['Dealer Id']?.trim(),
        mobile: row['Contact Number'],
        alt_mobile_no: row?.['alt_mobile_no'] || null,
        country: 'India',
        state: row?.['State Name'].trim() || null,
        district: row?.['District'].trim() || null,
        city: row?.['City'].trim() || null,
        email: row['Email Address'],
        pincode: pincode,
        address: row?.['Address'] || null,
        form_data: {
          brand: row['Brand']
            ? row['Brand'].split(',').map((brand) => brand.trim())
            : [],
        },
      };

      await this.userModel.updateOne({ _id: exist_id }, updateObj);

      let otherDetailsexist: Record<string, any> =
        await this.customerOtherDetailModel
          .findOne({ customer_id: exist_id })
          .lean();

      if (otherDetailsexist) {
        const otherObj = {
          ...req['updateObj'],
          gst_number: row?.['GST'] || null,
        };

        await this.customerOtherDetailModel.updateOne(
          { customer_id: exist_id },
          otherObj,
        );
      }

      const contact_person_mobile = row?.['Contact Number'];
      const contact_person_name = row?.['Contact Person'];
      let match = {
        org_id: req['user']['org_id'],
        is_delete: 0,
        contact_person_mobile,
        customer_id: exist_id,
      };
      let exist: Record<string, any> = await this.customerContactPersonModel
        .findOne(match)
        .lean();
      if (!exist) {
        if (contact_person_mobile && contact_person_name) {
          const contactObj = {
            ...req['createObj'],
            customer_id: exist_id,
            contact_person_mobile,
            contact_person_name: row?.['Contact Person'],
          };
          const contactDoc = new this.customerContactPersonModel(contactObj);
          await contactDoc.save();
        }
      }
    } catch (error) {
      return this.res.error(HttpStatus.BAD_REQUEST, 'ERROR.BAD_REQ', error);
    }
  }

  validateAndMapRow(row: any, schema: any) {
    const errors = [];
    const mappedRow: any = {};
    const custome_form_data: any = {};

    for (const field of schema) {
      const label = field.required ? `${field.label}*` : field.label;
      const name = field.name;
      const required = field.required;
      const minLen = field.min_length;
      const maxLen = field.max_length;
      const pattern = field.pattern;
      const type = field.type;
      const key_source = field.key_source;
      const is_duplicate = field.is_duplicate;

      // continue if is_duplicate
      if (is_duplicate) continue;
      const value = row[label];

      if (key_source === 'custom') {
        custome_form_data[name] = value;
      }

      if (required && (!value || value.toString().trim() === '')) {
        errors.push(`${label} is required`);
        continue;
      }

      if (
        value &&
        (value.length < minLen || (maxLen && value.length > maxLen))
      ) {
        errors.push(
          `${label} should be between ${minLen}-${maxLen} characters, found ${value.length}`,
        );
        continue;
      }

      if (pattern && value && !new RegExp(pattern).test(value)) {
        errors.push(`${label} format is invalid`);
        continue;
      }

      if (type === 'EMAIL' && value && !/^\S+@\S+\.\S+$/.test(value)) {
        errors.push(`${label} is not a valid email`);
        continue;
      }

      if (type === 'DATE' && value) {
        const isValidDate =
          /^\d{4}-\d{2}-\d{2}$/.test(value) ||
          /^\d{2}-\d{2}-\d{4}$/.test(value);
        if (!isValidDate || isNaN(new Date(value).getTime())) {
          errors.push(`${label} is not a valid date`);
          continue;
        }
      }

      if (value !== undefined) {
        mappedRow[name] = value;
      }
    }

    mappedRow['custome_form_data'] = custome_form_data;
    return errors.length ? { errors } : mappedRow;
  }
}
