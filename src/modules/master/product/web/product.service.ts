import { forwardRef, HttpStatus, Inject, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { ResponseService } from 'src/services/response.service';
import { ProductModel } from '../models/product.model';
import { Lts } from 'src/shared/translate/translate.service';
import {
  eMatch,
  toObjectId,
  commonFilters,
  commonSearchFilter,
  Like,
} from 'src/common/utils/common.utils';
import { COLLECTION_CONST } from 'src/config/collection.constant';
import { S3Service } from 'src/shared/rpc/s3.service';
import { FormBuilderService } from 'src/shared/form-builder/form-builder.service';
import { CsvService } from 'src/shared/csv/csv.service';
import { ProductDocsModel } from '../models/product-docs.model';
import { PointCategoryMapModel } from '../../point-category/models/point-category-map.model';
import { DiscountModel } from '../models/discount.model';
import { SharedProductService } from '../shared-product-service';
import { ProductDispatchModel } from '../models/product-dispatch.model';
import { ProductPriceModel } from '../models/product-price.model';

@Injectable()
export class ProductService {
  constructor(
    @InjectModel(ProductPriceModel.name)
    private productPriceModel: Model<ProductPriceModel>,
    @InjectModel(ProductModel.name) private productModel: Model<ProductModel>,
    @InjectModel(ProductDocsModel.name)
    private productDocsModel: Model<ProductDocsModel>,
    @InjectModel(PointCategoryMapModel.name)
    private pointCategoryMapModel: Model<PointCategoryMapModel>,
    @InjectModel(DiscountModel.name)
    private discountModel: Model<DiscountModel>,
    @InjectModel(ProductDispatchModel.name)
    private productDispatchModel: Model<ProductDispatchModel>,

    private readonly res: ResponseService,
    private readonly lts: Lts,
    private readonly s3Service: S3Service,
    private readonly formBuilderService: FormBuilderService,
    @Inject(forwardRef(() => CsvService))
    private readonly csvService: CsvService,
    @Inject(forwardRef(() => SharedProductService))
    private readonly sharedProductService: SharedProductService,
  ) { }

  async create(req: Request, params: any): Promise<any> {
    try {
      params.duplicacyCheck = true;
      const exist: any = await this.duplicate(req, params);
      if (exist.status)
        return this.res.error(HttpStatus.BAD_REQUEST, exist.message);
      params.org_id = req['user']['org_id'];
      const saveObj = {
        ...req['createObj'],
        ...params,
      };
      const document = new this.productModel(saveObj);
      const insert = await document.save();
      return this.res.success('SUCCESS.CREATE', { inserted_id: insert._id });
    } catch (error) {
      return this.res.error(HttpStatus.BAD_REQUEST, 'ERROR.BAD_REQ', error);
    }
  }

  async deleteFile(req: Request, params: any): Promise<any> {
    try {
      params._id = toObjectId(params._id);
      const exist: Record<string, any> = await this.productDocsModel
        .findOne({ _id: params._id, is_delete: 0 })
        .exec();

      if (!exist)
        return this.res.error(HttpStatus.NOT_FOUND, 'ERROR.NOT_FOUND');

      const updateObj = {
        ...req['updateObj'],
        is_delete: 1,
      };
      await this.productDocsModel.updateOne({ _id: params._id }, updateObj);

      return this.res.success('SUCCESS.FILE_DELETE');
    } catch (error) {
      return this.res.error(HttpStatus.BAD_REQUEST, 'ERROR.BAD_REQ', error);
    }
  }

  async update(req: Request, params: any): Promise<any> {
    try {
      const isSingleId = !Array.isArray(params._id);
      const ids = isSingleId
        ? [toObjectId(params._id)]
        : params._id.map(toObjectId);

      const exist: any = await this.productModel
        .find({ _id: { $in: ids } })
        .exec();
      if (!exist.length) {
        return this.res.error(HttpStatus.BAD_REQUEST, 'ERROR.NOT_EXIST');
      }

      if (params?.is_delete) {
        const allDeleted = exist.every(
          (doc) => doc.is_delete === params.is_delete,
        );
        if (allDeleted) {
          return this.res.error(
            HttpStatus.BAD_REQUEST,
            'WARNING.ALREADY_DELETE',
          );
        }
      }

      if (params?.status) {
        const allSameStatus = exist.every(
          (doc) => doc.status === params.status,
        );
        if (allSameStatus) {
          return this.res.error(
            HttpStatus.BAD_REQUEST,
            'WARNING.ALREADY_STATUS_UPDATE',
          );
        }
      }

      const updateObj: Record<string, any> = {
        ...req['updateObj'],
        is_delete: params.is_delete,
        status: params.status,
        form_data: params.form_data,
        product_name: params.product_name,
        category_name: params.category_name,
        gst_percent: params.gst_percent != null ? params.gst_percent : 0
      };

      const filter = { _id: { $in: ids } };
      await this.productModel.updateMany(filter, { $set: updateObj });

      if (params?.status) return this.res.success('SUCCESS.STATUS_UPDATE');
      if (params?.is_delete) return this.res.success('SUCCESS.DELETE');

      const updatedResponse = isSingleId ? ids[0] : ids;
      return this.res.success('SUCCESS.UPDATE', {
        updated_ids: updatedResponse,
      });
    } catch (error) {
      return this.res.error(
        HttpStatus.BAD_REQUEST,
        'ERROR.BAD_REQ',
        error?.message || error,
      );
    }
  }
  async read(req: Request, params: any): Promise<any> {
    try {
      let match: Record<string, any> = {
        is_delete: 0,
        org_id: req['user']['org_id'],
      };

      if (params.customer_segment && params.customer_segment.length > 0) {
        match['form_data.segments'] = { $in: params.customer_segment };
      }

      if (params.brand && params.brand.length > 0) {
        match['form_data.brand'] = { $in: params.brand };
      }

      let sorting: Record<string, 1 | -1> = { _id: -1 };
      if (params?.sorting && Object.keys(params.sorting).length !== 0) {
        sorting = params.sorting;
      }

      const searchableFields = ['product_name', 'product_code'];
      const searchFilters = commonSearchFilter(
        params?.filters,
        searchableFields,
      );
      match = { ...match, ...searchFilters };
      if (
        req?.url.includes(global.MODULE_ROUTES[16]) ||
        req?.url.includes(global.MODULE_ROUTES[19]) ||
        req?.url.includes(global.MODULE_ROUTES[21]) ||
        req?.url.includes(global.MODULE_ROUTES[22])
      ) {
        Object.assign(
          match,
          Object.entries(params?.filters || {}).reduce((acc, [key, values]) => {
            if (Array.isArray(values) && values.length) {
              const field =
                key === 'category_name' ? 'category_name' : `form_data.${key}`;
              acc[field] = { $in: values };
            }
            return acc;
          }, {}),
        );
      } else {
        const rootFields = [
          'category_name',
          'product_name',
          'product_code',
          'sub_category',
        ];
        Object.assign(
          match,
          Object.entries(params?.filters || {}).reduce((acc, [key, value]) => {
            if (value !== undefined && value !== null && value !== '') {
              const fieldPath = rootFields.includes(key)
                ? key
                : `form_data.${key}`;
              if (Array.isArray(value)) {
                if (value.length > 0) {
                  acc[fieldPath] = { $in: value };
                }
              } else {
                acc[fieldPath] = value;
              }
            }
            return acc;
          }, {}),
        );
      }

      if (req?.url.includes(global.MODULE_ROUTES[15])) {
        if (params?.filters?.product_name) {
          match = {
            ...match,
            $or: [
              {
                product_name: {
                  $regex: params.filters.product_name,
                  $options: 'i',
                },
              },
              {
                product_code: {
                  $regex: params.filters.product_name,
                  $options: 'i',
                },
              },
            ],
          };
        }
      }

      const page: number = params?.page || global.PAGE;
      const limit: number = params?.limit || global.LIMIT;
      const skip: number = (page - 1) * limit;

      const pipeline = [{ $match: match }, { $sort: sorting }];

      const totalCountData = await this.productModel.aggregate([
        ...pipeline,
        { $count: 'totalCount' },
      ]);
      const total: number =
        totalCountData.length > 0 ? totalCountData[0].totalCount : 0;
      let result = await this.productModel.aggregate([
        ...pipeline,
        { $skip: skip },
        { $limit: limit },
      ]);

      result = await Promise.all(
        result.map(async (item: any) => {
          let productPrice = await this.productPriceModel.findOne({ product_id: toObjectId(String(item._id)) })
          item.files = await this.getDocument(item._id, global.THUMBNAIL_IMAGE);

          if (productPrice) {
            item.product_price_type = productPrice?.price_type || "";
            item.product_price = productPrice?.form_data || "";
          }
          params.product_id = item._id;
          const pointCategory =
            await this.sharedProductService.readMapPointCategory(req, params);
          item.point_category = pointCategory?.point_category_name || '';
          return item;
        }),
      );
      return this.res.pagination(result, total, page, limit);
    } catch (error) {
      return this.res.error(HttpStatus.BAD_REQUEST, 'ERROR.BAD_REQ', error);
    }
  }

  async detail(req: Request, params: any): Promise<any> {
    try {
      const orgId = req['user']['org_id'];
      const productId = toObjectId(params._id);

      const match = {
        is_delete: 0,
        org_id: orgId,
        _id: productId,
      };

      const projection = {
        created_unix_time: 0,
      };

      const product = await this.productModel.findOne(match, projection).lean();

      if (!product) {
        return this.res.error(
          HttpStatus.NOT_FOUND,
          'ERROR.NOT_FOUND',
          'Product not found',
        );
      }

      const pointCat = await this.pointCategoryMapModel
        .findOne({
          product_id: productId,
          is_delete: 0,
          org_id: orgId,
        })
        .lean();

      product['point_category_id'] = pointCat?.point_category_id || '';
      product['point_category_name'] = pointCat?.point_category_name || '';

      const files = await this.getDocument(productId);

      const product_price = await this.sharedProductService.productPrice(req, {
        product_id: product._id,
      });

      const dispatch_config = await this.productDispatchModel
        .findOne({
          org_id: orgId,
          product_id: product._id,
          is_delete: 0,
        })
        .lean();

      const result = {
        ...product,
        product_price,
        dispatch_config,
        files: files ?? [],
      };

      return this.res.success('SUCCESS.FETCH', result);
    } catch (error) {
      return this.res.error(HttpStatus.BAD_REQUEST, 'ERROR.BAD_REQ', error);
    }
  }

  async duplicate(req: Request, params: any): Promise<any> {
    try {
      let errorObject: any = {};
      let message: string = '';
      let response: any = {};

      if (params.product_code) {
        const exist: any = await this.productModel
          .findOne({
            product_code: eMatch(params.product_code),
          })
          .exec();
        if (exist) {
          if (!params._id) errorObject['product_code'] = true;
          if (params._id && !toObjectId(params._id).equals(exist._id))
            errorObject['product_code'] = true;
        }
      }
      if (Object.keys(errorObject).length !== 0) {
        const existingFields = Object.keys(errorObject).filter(
          (key) => errorObject[key],
        );
        const fieldNames: Record<string, string> = {
          product_code: await this.lts.t('PRODUCT.PRODUCT_CODE'),
        };
        const EXIST = await this.lts.t('WARNING.EXIST');
        message =
          existingFields.map((key) => fieldNames[key]).join('/') + ' ' + EXIST;
        if (params.duplicacyCheck)
          return (response = { status: true, message: message });
        else return this.res.error(HttpStatus.BAD_REQUEST, message);
      } else {
        if (params.duplicacyCheck) return (response = { status: false });
        else return this.res.success('WARNING.NO_DUPLICACY');
      }
    } catch (error) {
      return this.res.error(HttpStatus.BAD_REQUEST, 'ERROR.BAD_REQ', error);
    }
  }

  async import(req: Request, params: any): Promise<any> {
    try {
      // Set default parameters
      params.internalCall = true;
      params.platform = 'web';

      // Read the form data and filter rows that are not read-only
      let data = await this.formBuilderService.read(req, params);
      const filteredData = data.form_data.filter(
        (row: any) =>
          row.is_show && !row?.is_duplicate && row.type !== 'UPLOAD',
      );

      // Create a list of custom form data fields (to be used for form processing)
      const formData = filteredData.map((row: any) =>
        row.key_source === 'custom' ? `${row.label}*` : row.label,
      );

      // Read and parse CSV data
      const csvData: any = await params.csv_data;

      // Collect all errors in an array
      const errors: any[] = []; // Store rows with errors

      // Arrays to store objects to be inserted or updated
      const saveObjs: any[] = [];
      const updateObjs: any[] = [];
      const productCodesToUpdate: string[] = [];

      // Process each row in the CSV data
      for (const row of csvData) {
        let rowErrors: string[] = []; // Array to store errors for the current row

        // Check if the product code already exists
        const exist = await this.productModel.findOne({
          product_code: eMatch(row['Product Code*']),
        });
        const form_data: any = {};

        // Prepare the form data object
        formData.forEach((field: string) => {
          if (row[field]) {
            form_data[field] = row[field];
          }
        });

        if (rowErrors.length > 0) {
          // If there are errors for this row, add the error messages to the 'Error' field
          row['Error'] = rowErrors.join(', '); // Join the errors as a comma-separated string
          errors.push(row); // Push the row with the errors to errors
          continue; // Skip further processing for this row
        }

        if (exist) {
          const updateObj = {
            ...req['updateObj'],
            category_name: row['category_name'],
            product_name: row['Product Name*'],
            form_data: form_data,
          };
          updateObjs.push(updateObj);
          productCodesToUpdate.push(row['Product Code*']);
        } else {
          const saveObj = {
            ...req['createObj'],
            category_name: row['category_name'],
            product_name: row['Product Name*'],
            product_code: row['Product Code*'],
            form_data: form_data,
          };
          saveObjs.push(saveObj);
        }
      }
      if (saveObjs.length > 0) {
        await this.productModel.insertMany(saveObjs);
      }

      if (updateObjs.length > 0) {
        await this.productModel.updateMany(
          { product_code: { $in: productCodesToUpdate } },
          { $set: updateObjs },
        );
      }

      let csvResponse: Record<string, any>;
      if (errors.length > 0) {
        params.filename = `producterrors${req['user']['_id']}.csv`;
        params.data = errors;
        csvResponse = await this.csvService.generateCsv(req, params);
      }

      let resObj: Record<string, any> = {
        saved: saveObjs.length,
        updated: updateObjs.length,
        errors,
        filename: csvResponse?.data?.filename,
      };
      return this.res.success('SUCCESS.IMPORT', resObj);
    } catch (error) {
      return this.res.error(HttpStatus.BAD_REQUEST, 'ERROR.BAD_REQ', error);
    }
  }

  async readDropdown(req: Request, params: any): Promise<any> {
    try {
      const { org_id, wms } = req['user'];
      const searchableFields = ['product_name', 'product_code'];
      const filters = commonSearchFilter(params.filters, searchableFields);
      const page: number = Math.max(
        1,
        parseInt(params?.page, 10) || global.PAGE,
      );
      const limit: number = Math.max(
        1,
        parseInt(params?.limit, 10) || global.LIMIT,
      );
      const skip: number = (page - 1) * limit;
      const matchStage: any = {
        is_delete: 0,
        org_id,
        ...filters,
      };
      const aggregationPipeline: any[] = [{ $match: matchStage }];
      if (params?.customer_type_id) {
        aggregationPipeline.push(
          {
            $lookup: {
              from: COLLECTION_CONST().CRM_POINT_CATEGORY_MAP,
              let: { productId: '$_id' },
              pipeline: [
                {
                  $match: {
                    $expr: {
                      $and: [
                        { $eq: ['$product_id', '$$productId'] },
                        { $eq: ['$org_id', org_id] },
                        { $eq: ['$is_delete', 0] },
                      ],
                    },
                  },
                },
              ],
              as: 'point_category',
            },
          },
          {
            $match: {
              point_category: { $ne: [] },
            },
          },
        );
      }
      if (wms) {
        aggregationPipeline.push(
          {
            $lookup: {
              from: COLLECTION_CONST().CRM_PRODUCT_DISPATCH_CONFIG,
              localField: '_id',
              foreignField: 'product_id',
              as: 'dispatch_config',
            },
          },
          { $unwind: '$dispatch_config' },
        );
        if (params.dropdown_name === 'box') {
          aggregationPipeline.push({
            $match: {
              'dispatch_config.box_size': { $gt: 0 },
              'dispatch_config.qr_genration': true,
            },
          });
        } else {
          aggregationPipeline.push({
            $match: {
              'dispatch_config.qr_genration': true,
            },
          });
        }
      }
      aggregationPipeline.push(
        {
          $project: {
            _id: 1,
            product_name: 1,
            product_code: 1,
            gst_percent: 1,
            uom: 1,
            form_data: 1,
          },
        },
        { $skip: skip },
        { $limit: limit },
      );
      let product: Record<string, any>[] = await this.productModel
        .aggregate(aggregationPipeline)
        .exec();
      let dropdownList: any[] = [];
      if (Array.isArray(product)) {
        if (params?.customer_type_id) {
          const customer_type_id = params.customer_type_id;
          const list = await Promise.all(
            product.map(async (item: any) => {
              let point_value = null;
              try {
                const pointData =
                  await this.sharedProductService.fetchPointCatgoryByProductId(
                    req,
                    item._id,
                    customer_type_id,
                  );
                if (!pointData) {
                  return null;
                }
                point_value = pointData?.point_value ?? null;
                return {
                  label: `${item.product_name} - ${item.product_code}`,
                  value: item._id,
                  product_code: item.product_code,
                  gst_percent: item.gst_percent,
                  uom: item.uom,
                  point_value,
                  gst: '18%',
                };
              } catch (err) {
                return null;
              }
            }),
          );
          if (list.some((item) => item === null)) {
            dropdownList = [];
          } else {
            dropdownList = list;
          }
        } else {
          dropdownList = product.map((item: any) => ({
            label: `${item.product_name} - ${item.product_code}`,
            value: item._id,
            product_code: item.product_code,
            gst_percent: '18',
            uom: item.form_data.uom,
            price: item.form_data.price_inr,

            color: Array.isArray(item.form_data?.colors)
              ? item.form_data.colors.map((color: string) => ({
                label: color,
                value: color,
              }))
              : [],

            brand: Array.isArray(item.form_data?.brand)
              ? item.form_data.brand.map((brand: string) => ({
                label: brand,
                value: brand,
              }))
              : [],
          }));
        }
      }
      return this.res.success('SUCCESS.FETCH', dropdownList);
    } catch (error) {
      return this.res.error(HttpStatus.BAD_REQUEST, 'ERROR.BAD_REQ', error);
    }
  }

  async upload(files: Express.Multer.File[], req: any): Promise<any> {
    try {
      req.body.module_name = Object.keys(global.MODULES).find(
        (key) => global.MODULES[key] === global.MODULES['Products'],
      );
      let response = await this.s3Service.uploadMultiple(
        files,
        req,
        this.productDocsModel,
      );
      return this.res.success('SUCCESS.CREATE', response);
    } catch (error) {
      return this.res.error(
        HttpStatus.BAD_REQUEST,
        'Error uploading files to S3',
        error?.message || error,
      );
    }
  }

  async getDocument(
    id: any,
    type:
      | typeof global.FULL_IMAGE
      | typeof global.THUMBNAIL_IMAGE
      | typeof global.BIG_THUMBNAIL_IMAGE = global.FULL_IMAGE,
  ): Promise<any> {
    return this.s3Service.getDocumentsByRowId(this.productDocsModel, id, type);
  }

  async getDocumentByDocsId(req: any, params: any): Promise<any> {
    const doc = await this.s3Service.getDocumentsById(
      this.productDocsModel,
      params._id,
    );
    return this.res.success('SUCCESS.FETCH', doc);
  }
}
