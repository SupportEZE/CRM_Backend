import { forwardRef, HttpStatus, Inject, Injectable } from '@nestjs/common';
import * as fs from 'fs';
import * as fastcsv from 'fast-csv';
import { InjectConnection, InjectModel } from '@nestjs/mongoose';
import { ClientSession, Connection, Model } from 'mongoose';
import { ResponseService } from 'src/services/response.service';
import { ProductModel } from './models/product.model';
import { Lts } from 'src/shared/translate/translate.service';
import { COLLECTION_CONST } from 'src/config/collection.constant';
import { CsvService } from 'src/shared/csv/csv.service';
import { Readable } from 'stream';
import * as csvParser from 'csv-parser';
import { ProductDocsModel } from './models/product-docs.model';
import { ProductPriceModel } from './models/product-price.model';
import { PointCategoryMapModel } from '../point-category/models/point-category-map.model';
import { DiscountModel } from './models/discount.model';
import { OptionModel } from '../dropdown/models/dropdown-options.model';
import { SharedProductService } from './shared-product-service';
import { ProductDispatchModel } from './models/product-dispatch.model';
import {
  eMatch,
  toObjectId,
  commonFilters,
  commonSearchFilter,
  Like,
  getPointCategorySchema,
  getProductDispatchSchema,
  getStaticMrpSchema
} from 'src/common/utils/common.utils';
import { PointCategoryModel } from '../point-category/models/point-category.model';
import { FormBuilderService } from 'src/shared/form-builder/form-builder.service';
import { CustomerTypeService } from '../customer-type/web/customer-type.service';
import {DropdownService} from '../dropdown/web/dropdown.service'
import {ZoneMasterService} from '../location-master/zone-master/web/zone-master.service'

@Injectable()
export class ProductUploadService {
    constructor(
        @InjectModel(ProductModel.name) private productModel: Model<ProductModel>,
        @InjectModel(ProductDocsModel.name) private productDocsModel: Model<ProductDocsModel>,
        @InjectModel(PointCategoryMapModel.name) private pointCategoryMapModel: Model<PointCategoryMapModel>,
        @InjectModel(DiscountModel.name) private discountModel: Model<DiscountModel>,
        @InjectModel(OptionModel.name) private optionModel: Model<OptionModel>,
        @InjectModel(ProductPriceModel.name) private productPriceModel: Model<ProductPriceModel>,
        @InjectModel(ProductDispatchModel.name) private productDispatchModel: Model<ProductDispatchModel>,
        @InjectModel(PointCategoryModel.name) private pointCategoryModel: Model<ProductDispatchModel>,
        @InjectConnection() private connection: Connection,
        private readonly res: ResponseService,
        private readonly lts: Lts,
        @Inject(forwardRef(() => CsvService))
        private readonly csvService: CsvService,
        private readonly formBuilderService: FormBuilderService,
        @Inject(forwardRef(() => SharedProductService))
        private readonly sharedProductService: SharedProductService,
        private readonly customerTypeService: CustomerTypeService,
        private readonly dropdownService: DropdownService,
        private readonly zoneMasterService: ZoneMasterService,
    ) { }
    // async uploadProductData(req: Request, file: Express.Multer.File): Promise<any> {
    //     const orgId = req['user']['org_id'];
    //     const createdId = req['user']['_id'];
    //     const createdName = req['user']['name'];
    //     const now = new Date();
    //     const insertedIds: string[] = [];

    //     try {
    //         const stream = Readable.from(file.buffer);
    //         const rows: any[] = [];
    //         const skippedProductCodes: string[] = [];

    //         await new Promise<void>((resolve, reject) => {
    //             stream
    //                 .pipe(csvParser())
    //                 .on('data', (row) => rows.push(row))
    //                 .on('end', resolve)
    //                 .on('error', reject);
    //         });

    //         for (const row of rows) {
    //             const productCode = row['Product Code']?.trim();
    //             if (!productCode) {
    //                 continue;
    //             }

    //             const existingProduct = await this.productModel.findOne({
    //                 product_code: productCode,
    //                 org_id: orgId,
    //                 is_delete: 0,
    //             });

    //             if (existingProduct) {
    //                 skippedProductCodes.push(productCode);
    //                 continue;
    //             }

    //             const categoryName = row['Category Name'];
    //             let category_id: any
    //             if (categoryName) {
    //                 const subCategoryName = row['Sub category Name'];
    //                 const existingCategory = await this.optionModel.findOne({
    //                     org_id: orgId,
    //                     dropdown_name: 'category_name',
    //                     value: categoryName,
    //                     is_delete: 0,
    //                 });

    //                 if (!existingCategory) {
    //                     const categoryDoc = {
    //                         created_id: createdId,
    //                         created_name: createdName,
    //                         is_delete: 0,
    //                         source: 'web',
    //                         org_id: orgId,
    //                         module_id: 6,
    //                         module_name: 'Products',
    //                         module_type: 'child',
    //                         dropdown_id: toObjectId('683d81295067c53d8035c389'),
    //                         dropdown_name: 'category_name',
    //                         option_name: categoryName,
    //                         value: categoryName,
    //                         dependent_option_name: '',
    //                         created_at: now,
    //                     };

    //                     const newCategory = new this.optionModel(categoryDoc);
    //                     category_id = await newCategory.save();

    //                 } else {
    //                     category_id = existingCategory._id
    //                 }


    //                 if (subCategoryName) {

    //                     const existingSubCategory = await this.optionModel.findOne({
    //                         org_id: orgId,
    //                         dropdown_name: 'sub_category',
    //                         value: subCategoryName,
    //                         is_delete: 0,
    //                     });

    //                     if (!existingSubCategory) {
    //                         const subCategoryDoc = {
    //                             created_id: createdId,
    //                             created_name: createdName,
    //                             is_delete: 0,
    //                             source: 'web',
    //                             org_id: orgId,
    //                             module_id: 6,
    //                             module_name: 'Products',
    //                             module_type: 'child',
    //                             dropdown_id: toObjectId('683fdc2031507ebd029f0369'),
    //                             dropdown_name: 'sub_category',
    //                             option_name: subCategoryName,
    //                             value: subCategoryName,
    //                             dependent_option_name: categoryName,
    //                             created_at: now,
    //                         };
    //                         const newSubCategory = new this.optionModel(subCategoryDoc);
    //                         await newSubCategory.save();
    //                     }
    //                 }
    //             }
    //             const doc = {
    //                 org_id: orgId,
    //                 created_id: createdId,
    //                 created_name: createdName,
    //                 is_delete: 0,
    //                 source: 'web',
    //                 category_name: row['Category Name'],
    //                 sub_category: row['Sub category Name'],
    //                 product_name: row['product_detail'],
    //                 product_code: row['Product Code']?.trim(),
    //                 form_data: {
    //                     brand: row['Brand'] ? [row['Brand']] : [],
    //                     color: row['Color'] ? [row['Color']] : [],
    //                     stock_availability: row['Stock Availability'] || 'In Stock',
    //                     warranty_in_months: Number(row['Warranty Period']) || 0,
    //                     small_product_code: row['small_product_code'],
    //                     installation_responsibility: row['Installation Responsibility'] || 'Customer',
    //                     new_arrivals: row['New Arrival'] || 'No',
    //                     description: row['Description'] || '',
    //                     size: row['Size'],
    //                 },
    //                 status: row['Status'] === 'Active' ? 'Active' : 'Inactive',
    //                 created_at: now,
    //             };

    //             const productDoc = new this.productModel(doc);
    //             const insert = await productDoc.save();

    //             if (insert) {
    //                 insertedIds.push(insert._id.toString());
    //                 const dispatch = {
    //                     org_id: orgId,
    //                     created_id: createdId,
    //                     created_name: createdName,
    //                     is_delete: 0,
    //                     source: 'web',
    //                     master_box_size: row['Master Packing Size'],
    //                     box_size: row['Small Packing Size'],
    //                     uom: row['Unit Of Measurement'],
    //                     box_with_item: true,
    //                     qr_genration: row['Product Scan']?.toLowerCase() === 'yes',
    //                     product_id: insert._id,
    //                     created_at: now,
    //                 };

    //                 const dispatchDoc = new this.productDispatchModel(dispatch);
    //                 await dispatchDoc.save();
    //                 const priceDoc = {
    //                     org_id: orgId,
    //                     created_id: createdId,
    //                     created_name: createdName,
    //                     is_delete: 0,
    //                     source: 'web',
    //                     product_id: insert._id,
    //                     price_type: 'Net Price',
    //                     // form_data: ['South', 'North', 'East', 'West'].map((zone) => ({
    //                     //     zone,
    //                     //     Mrp: Number(row['MRP']) || 0,
    //                     // })),
    //                     form_data: {
    //                         Mrp: Number(row['MRP']),
    //                     },
    //                     created_at: now,
    //                 };

    //                 const priceModelDoc = new this.productPriceModel(priceDoc);
    //                 await priceModelDoc.save();
    //             }
    //         }

    //         return this.res.success('SUCCESS.UPLOAD', { insertedCount: insertedIds.length, insertedIds, skippedProductCodesCount: skippedProductCodes.length, skippedProductCodes: skippedProductCodes });
    //     } catch (error) {
    //         return this.res.error(HttpStatus.BAD_REQUEST, 'ERROR.BAD_REQ', error);
    //     }
    // }

  async mapPointCategoryData(req: Request, file: Express.Multer.File): Promise<any> {
        const orgId = req['user']['org_id'];
        const createdId = req['user']['_id'];
        const createdName = req['user']['name'];
        const now = new Date();
        const insertedIds: string[] = [];
        const skippedProductCodes: string[] = [];

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
            const productCode = row['Product Code']?.trim();
            const category = row['Product Category']?.trim();
            const fabricatorPoints = parseFloat(row['Fabricator Points']);

            if (!productCode || !category || isNaN(fabricatorPoints)) {
              console.log('Skipping row due to invalid/missing data:', row);
              skippedProductCodes.push(productCode || '[missing code]');
              continue;
            }

            const product = await this.productModel.findOne({
              product_code: productCode,
              org_id: orgId,
              is_delete: 0,
            });

            if (!product) {
              skippedProductCodes.push(productCode);
              continue;
            }

            const pointCategoryName = `${category}-${fabricatorPoints}`;
            const pointCategory:any= await this.pointCategoryModel.findOne({
              org_id: orgId,
              point_category_name: pointCategoryName,
              is_delete: 0,
            });

            if(pointCategory && pointCategory._id) {
              const existingMap = await this.pointCategoryMapModel.findOne({
                org_id: orgId,
                product_id: product._id,
                point_category_id: toObjectId(pointCategory._id),
                is_delete: 0,
              });

              if (existingMap) {
                skippedProductCodes.push(productCode);
                continue;
              }
            }


            const doc = {
              org_id: orgId,
              created_id: createdId,
              created_name: createdName,
              is_delete: 0,
              source: 'web',
              point_category_id: toObjectId(pointCategory._id),
              point_category_name: pointCategoryName,
              product_id: product._id,
              created_at: now,
            };

            const insert = await new this.pointCategoryMapModel(doc).save();
            if (insert?._id) {
                insertedIds.push(`${insert._id}`);
            }
          }

          return this.res.success('SUCCESS.UPLOAD', {
              insertedCount: insertedIds.length,
              insertedIds,
              skippedProductCodesCount: skippedProductCodes.length,
              skippedProductCodes,
          });
        } catch (error) {
            console.error('Error during mapping:', error);
            return this.res.error(HttpStatus.BAD_REQUEST, 'ERROR.BAD_REQ', error);
        }
    }

  async uploadPointCategoryData(req: Request, file: Express.Multer.File): Promise<any> {
    const orgId: number = req['user']['org_id'];
    const createdId = req['user']['_id'];
    const createdName = req['user']['name'];
    const now = new Date();
    const insertedIds: string[] = [];
    const skippedProductCategoryCodes: string[] = [];

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
            const productCode = row['Product Code']?.trim();
            if (!productCode) {
                console.log('Skipped Product: Due to invalid product code row:', row);
                continue;
            }

            const category = row['Product Category']?.trim();
            const fabricatorPoints = parseFloat(row['Fabricator Points']);
            const architectPoints = parseFloat(row['Architect Points']);

            if (!category || isNaN(fabricatorPoints) || isNaN(architectPoints)) {
                console.log('Skipped Product: Missing or invalid category/points for row:', row);
                skippedProductCategoryCodes.push(productCode);
                continue;
            }

            const pointCategoryName = `${category}-${fabricatorPoints}`;

            const existingPointCategory = await this.pointCategoryModel.findOne({
                org_id: orgId,
                point_category_name: pointCategoryName,
                is_delete: 0,
            });

            if (existingPointCategory) {
                console.log('already exist')
                skippedProductCategoryCodes.push(productCode);
                continue;
            }

            const pointArray = [
                {
                    customer_type_id: '6853c1cf67b146638e6e6a50',
                    customer_type_name: 'Fabricator',
                    point_value: fabricatorPoints,
                },
                {
                    customer_type_id: '6864c40702c2054f26158868',
                    customer_type_name: 'Architect',
                    point_value: architectPoints,
                },
            ];

            const doc = {
                org_id: orgId,
                created_id: createdId,
                created_name: createdName,
                is_delete: 0,
                source: 'web',
                status: 'Active',
                point_category_name: pointCategoryName,
                point: pointArray,
                created_at: now,
            };

            const insert = await new this.pointCategoryModel(doc).save();
            if (insert?._id) {
                insertedIds.push(`${insert._id}`);
            }
        }

        return this.res.success('SUCCESS.UPLOAD', {
            insertedCount: insertedIds.length,
            insertedIds,
            skippedProductCategoryCount: skippedProductCategoryCodes.length,
            skippedProductCategoryCodes,
        });
      } catch (error) {
          console.error('Upload failed:', error);
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

  async validateAndMapRow(org_id: number, row: any, schema: any, price_type: string) {
    const errors = [];
    const mappedRow: any = {};
    const custome_form_data: any = {};
    const dependent_form_data: any = {};
    const dispatchModelDoc: any = {};
    const priceModelDoc: any = {
      org_id,
      product_id: null,
      price_type,
      form_data: [],
    };


    for (const field of schema) {
      const required = field?.required;
      const label = required ? `${field.label}*` : field.label;
      const name = field.name;
      const minLen = field.min_length;
      const maxLen = field.max_length;
      const pattern = field.pattern;
      const type = field.type;
      const key_source = field.key_source;
      const is_duplicate = field.is_duplicate;
      const dropdown_options = field.options;
      const module = field.module;
      let mrpHeader = getStaticMrpSchema(price_type);
      const options = field.options;

      let zones = await this.zoneMasterService.readDropdown(org_id, {})
      zones = zones.map((item: any)=> item.zone)

      mrpHeader = zones.map((zItem:any) => mrpHeader.map((item:any) => (
        {
          label: `${zItem}-${item}`, // only use to get row data and validate schema
          name: item,
          required: false,
          type: 'number',
          module: 'MRP-Module'
        }
      )))
      // continue if is_duplicate
      if(is_duplicate) continue
      let value = row[`${label}`];

      // validating dispatch model cols
      if(module === 'Product-Dispatch') {
        dispatchModelDoc[name] = value;
      }

      // validating mrp model cols
if (mrpHeader && mrpHeader.length) {
  mrpHeader.forEach((item: any) => {
    const temp: any = {
      zone: item[0]?.label?.split('-')[0]?.toString(),
    };

    item.forEach((cItem: any) => {
      const key = cItem?.name?.toString();
      const label = cItem?.label;
      const value = cItem?.required ? Number(row[`${label}*`]) : Number(row[`${label}`]);
      temp[key] = value;
    });

    // Optional: avoid pushing duplicate zones
    const alreadyExists = priceModelDoc.form_data.some((f: any) => f.zone === temp.zone);
    if (!alreadyExists) {
      priceModelDoc.form_data.push(temp);
    }
  });
}

      if(type === 'MULTI_SELECT') {
          value = value.split(',').map((item:string) => item.trim())
      }

      if (key_source === 'custom') {
        custome_form_data[name] = value;
      }

      if (required && (!value || value.toString().trim() === '')) {
        errors.push(`${label} is required`);
        continue;
      }

      // if multi select then we get array of data available dropdown-options
      // if row custom multi select value is not in available then create in dropdown
      if((type === 'SINGLE_SELECT' || type === 'MULTI_SELECT') && key_source === 'custom') {
        const is_dropdown_option_exist = dropdown_options.find((item: any) => item?.value === value) ? true : false;
        const dropdown_type = type;
        dependent_form_data[name] = {name, is_dropdown_option_exist, dropdown_type}
      }

      if (value && (value.length < minLen || (maxLen && value.length > maxLen))) {
        errors.push(`${label} should be between ${minLen}-${maxLen} characters, found ${value.length}`);
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
          /^\d{4}-\d{2}-\d{2}$/.test(value) || /^\d{2}-\d{2}-\d{4}$/.test(value);
        if (!isValidDate || isNaN(new Date(value).getTime())) {
          errors.push(`${label} is not a valid date`);
          continue;
        }
      }

      if (value !== undefined) {
        mappedRow[name] = Array.isArray(value) ? value.join(',') : value;
      }
    }

    mappedRow['custome_form_data'] = custome_form_data;
    mappedRow['dependent_form_data'] = [...Object.values(dependent_form_data)];
    mappedRow['dispatch_model_doc'] = dispatchModelDoc;
    mappedRow['price_model_doc'] = priceModelDoc;
    return errors.length ? { errors } : mappedRow;
  }

  // Generate Product Upload Sample CSV
  async generateProductUploadSampleCSV(req: Request): Promise<any> {
    try {
      const org_id = req['user']['org_id'];
      const isIrp = req['user']['org']['irp'];
      const form_id = req.body['form_id'];
      const params = {form_id};

      if(!org_id || !form_id) {
        return this.res.error(HttpStatus.BAD_REQUEST, 'ERROR.INVALID', 'Invalid org_id or form_id.' );
      }

      // Step -> 1 Get basic information from forms
      let header: string[] = [];
      let form_schema = await this.getFormSchema(req, params);
      form_schema = form_schema.data;


      if(!form_schema) {
        return this.res.error(HttpStatus.BAD_REQUEST, 'ERROR.INVALID', 'Form Schema Not found with this form_id.');
      }


      if (form_schema.form_source === 'static') {
        form_schema = form_schema.form_data.filter((row: any) => row.status === 1);
        header = form_schema.map((row: any) => row.required === true ? `${row.label.trim()}*` : row.label.trim());
      } else {
        form_schema = form_schema.form_data.filter((row: any) => row.is_show && !row?.is_duplicate && row.type !== 'UPLOAD')
        header = form_schema.map((row: any) => row.required === true ? `${row.label.trim()}*` : row.label.trim());
      }

      // Step -> 2: if client irp === true then attach specific header for distpatch and loyality
      if(isIrp){
        const DispatchFormSchema = getProductDispatchSchema()

        // // attaching dispatch form static schema
        header = [
          ...header,
          ...DispatchFormSchema.map((row: any) => row.required === true ? `${row.label}*` : row.label)
        ]

        // adding point category* to csv header
        header.push('Point Category');
      }

      // Step -> 3 : MRP header

      //Getting Total zones of organisation
      let zones = await this.zoneMasterService.readDropdown(org_id, {})
      zones = zones.map((item: any)=> item.zone)

      const staticMRPHeader = {
        'MRP': zones.map((item: any) => `${item}-MRP`),
        'Net Price': zones.flatMap((item: string) =>
          ['MRP', 'Channel Partner Net Price', 'Direct Dealer Net Price'].map((zItem: any) => `${item}-${zItem}`)
        ),
        'Zone Wise MRP': zones.flatMap((item: string) =>
          ['MRP'].map((zItem: any) => `${item}-${zItem}`)
        ),
        'Zone Wise Net Price': zones.flatMap((item: string) =>
          ['MRP', 'Channel Partner Net Price', 'Direct Dealer Net Price'].map((zItem: any) => `${item}-${zItem}`)
        ),
      };

      const price_type = req['user']['org']['price_type']

      header = [
        ...header,
        ...staticMRPHeader[price_type], // TODO: Test for different price_type
      ]

      const basePath = process.cwd();
      const publicFolderPath = `${basePath}/public`;
      const tmpFolderPath = `${publicFolderPath}/tmp`;
      let filePath = `${tmpFolderPath}/Product_Upload_Sample_${req['user']['_id']}.csv`
      if (!fs.existsSync(tmpFolderPath)) fs.mkdirSync(tmpFolderPath, { recursive: true });
      const ws = fs.createWriteStream(filePath);
      filePath = `tmp/Product_Upload_Sample_${req['user']['_id']}.csv`
      fastcsv
        .write([header], { headers: false })
        .pipe(ws)
        .on('finish', () => { });
      return this.res.success('CSV.GENERATE', { filename: filePath });
    } catch (err) {
      console.error('Error During generating product upload sample csv file.', err)
      return this.res.error(HttpStatus.BAD_REQUEST, 'ERROR.BAD_REQ', err);
    }
  }

  // Upload Product Data from CSV
  async uploadProductData(req: Request, file: Express.Multer.File): Promise<any> {
    const session: ClientSession = await this.connection.startSession();
    try {
      const org_id = req['user']['org_id'];
      const createdId = req['user']['_id'];
      const createdName = req['user']['name'];
      const form_id = req.body['form_id'];
      const price_type = req['user']['org']['price_type']
      const now = new Date();
      const insertedIds: string[] = [];
      const skippedProductCodes: string[] = [];
      const params = { form_id };

      let form_schema = await this.getFormSchema(req, params);
      form_schema = form_schema?.data?.form_data;

      const productDispatchSchema = getProductDispatchSchema();
      form_schema.push(...productDispatchSchema)

      const point_category_schema = getPointCategorySchema();
      form_schema.push(point_category_schema)

      let staticMRPHeader = getStaticMrpSchema(price_type);
      let zones = await this.zoneMasterService.readDropdown(org_id, {})
      zones = zones.map((item: any)=> item.zone)


      staticMRPHeader = zones.map((zItem:any) => staticMRPHeader.map((item:any) => (
        {
          label: `${zItem}-${item}`, // only use to get row data and validate schema
          name: item,
          required: false,
          type: 'number',
          module: 'MRP-Module'
        }
      )))

      form_schema.push({'staticMRPHeader' : staticMRPHeader})


      // Extracting all csv rows
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

        // transaction start
        session.startTransaction();
        let statusMessage = 'Done';

        const validateAndMapRow = await this.validateAndMapRow(org_id, row, form_schema, price_type);
        try {
          if ('errors' in validateAndMapRow) throw new Error(`Error: ${validateAndMapRow.errors.join(', ')}`);

          const newProduct = validateAndMapRow;
          const product_code = newProduct?.product_code?.trim();

          //NOTE: checking all dependent dropdown like brands, colors dropdown exist or not if not then create
          let dependent_form_data = validateAndMapRow?.dependent_form_data;
          let form_data = validateAndMapRow?.custome_form_data;

          for(const dependent of dependent_form_data) {

            // Check in dropdown modal if that key exist like brand, colors
            let dropdown_id = await this.dropdownService.getDropdown({ org_id, dropdown_name: dependent?.name}, {_id: 1});
            dropdown_id = dropdown_id?._id;
            const dropdown_name = dependent?.name;

            //NOTE: If we want to add dropdown_name if DNE then implement here
            if(dropdown_id) {
            } else {
              // add dropdown means i.e 'brand', 'color'
              const addedCategory = await this.dropdownService.addDropdownOptions({created_id: createdId, created_name: createdName},{org_id, dropdown_name, dropdown_options: [dropdown_name], module_id: 6 }, session)
            }

            // Check in dropdown option modal that value of brand, colors dropdown exist or not otherwise add
            let dropdown_options = form_data[dropdown_name]

            dropdown_options = Array.isArray(dropdown_options) ? dropdown_options : [dropdown_options]
            const is_dropdown_option_value_exist = await this.dropdownService.addDropdownOptions({created_id: createdId, created_name: createdName}, {org_id, dropdown_name, dropdown_options, module_id: 6 }, session)
          }

          if (!newProduct || !product_code) throw new Error('Error: Invalid product code');

          const existingProduct = await this.productModel.findOne({ product_code, org_id, is_delete: 0 });
          if (existingProduct) {
            skippedProductCodes.push(product_code);
            console.log('row skipped for existingProduct', existingProduct)
            throw new Error('Error: Product code already exists');
          }

          const categoryName = newProduct?.category_name;
          if (!categoryName) {
            skippedProductCodes.push(product_code);
            console.log('row skipped for invalid categoryName', categoryName)
            throw new Error('Error: Missing category_name');
          }

          let existingCategory = await this.optionModel.findOne({
            org_id,
            dropdown_name: 'category_name',
            value: categoryName,
            is_delete: 0,
          });

          let custome_form_data = Object.fromEntries(
            Object.entries(newProduct?.custome_form_data || {}).map(
              ([key, value]) => [key, Array.isArray(value) ? value.join(',') : value]
            )
          );

          const productDoc = new this.productModel({
            org_id,
            created_id: createdId,
            created_name: createdName,
            is_delete: 0,
            source: 'web',
            status: 'Active',
            created_at: now,
            ...newProduct,
            form_data: custome_form_data,
          });

          const insert = await productDoc.save({ session });
          let pointCategoryName:any;
          let pointCategory:any;
          if(newProduct.point_category !== '') {
             pointCategoryName = newProduct.point_category_name;
             pointCategory = await this.pointCategoryModel.findOne({
              org_id,
              point_category_name: pointCategoryName,
              is_delete: 0,
            });

            await new this.pointCategoryMapModel({
              org_id,
              created_id: createdId,
              created_name: createdName,
              is_delete: 0,
              source: 'web',
              point_category_id: pointCategory?._id ? pointCategory?._id : '',
              point_category_name: pointCategoryName ? pointCategoryName : '',
              product_id: insert._id,
              created_at: now,
            }).save({ session });
          }

          //TODO: nedds to be dynamic and remove box and packing inconsistancy
          try {
            const newDispatchModelDoc = newProduct?.dispatch_model_doc;
            const dispatchDoc = new this.productDispatchModel({
              org_id,
              created_id: createdId,
              created_name: createdName,
              is_delete: 0,
              source: 'web',
              price_type,
              master_box_size: Number(newProduct?.dispatch_model_doc?.master_box_size), //TODO: need to fix
              box_size: Number(newProduct?.dispatch_model_doc?.box_size), //TODO: need to fix
              uom: newProduct?.dispatch_model_doc?.uom,
              box_with_item: newProduct?.box_with_item?.toLowerCase() === 'yes',
              qr_genration: newProduct?.qr_genration?.toLowerCase() === 'yes',
              product_id: insert._id,
              created_at: now,
            });
            await dispatchDoc.save({ session });
          } catch (err) {
            console.error(`Error during creating dispatchDoc : ${err}`)
          }

          try {
            const newPriceModelDoc = newProduct?.price_model_doc;
            const priceModelDoc = new this.productPriceModel({
              ...newPriceModelDoc,
              created_id: createdId,
              created_name: createdName,
              is_delete: 0,
              source: 'web',
              product_id: insert?._id,
              created_at: now,
            });
            await priceModelDoc.save({ session });
          } catch (err) {
            console.error(`Error during creating dispatchDoc : ${err}`)
          }

          await session.commitTransaction();
          insertedIds.push(insert._id.toString());
        } catch (err) {
          await session.abortTransaction();
          statusMessage = err.message || 'Error processing row';
        }

        processedRows.push({ ...row, Status: statusMessage });
      }

      const filename = `Product_upload_status_${req['user']['_id']}.csv`;
      const csvResponse = await this.csvService.generateCsv(req, { filename, data: processedRows });
      const hasErrors = processedRows.some((row) => row.Status.startsWith('Error'));

      return hasErrors
        ? this.res.error(HttpStatus.BAD_REQUEST, `Some rows failed. See CSV: ${csvResponse?.data?.filename}`, { filename: csvResponse?.data?.filename })
        : this.res.success('SUCCESS.UPLOAD', {
            insertedCount: insertedIds.length,
            insertedIds,
            skippedCount: skippedProductCodes.length,
            skippedProductCodes,
            filename: csvResponse?.data?.filename,
          });
    } catch (error) {
      return this.res.error(HttpStatus.BAD_REQUEST, 'ERROR.BAD_REQ', error);
    } finally {
      await session.endSession();
    }
  }

}

