import { HttpStatus, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { ResponseService } from 'src/services/response.service';
import { ProductService } from '../web/product.service';
import { ProductModel } from '../models/product.model';
import { commonFilters, toObjectId } from 'src/common/utils/common.utils';
import { PointCategoryModel } from '../../point-category/models/point-category.model';
import { PointCategoryMapModel } from '../../point-category/models/point-category-map.model';
import { ProductDocsModel } from '../models/product-docs.model';

@Injectable()
export class AppProductService {
  constructor(
    @InjectModel(PointCategoryModel.name) private pointCategoryModel: Model<PointCategoryModel>,
    @InjectModel(PointCategoryMapModel.name) private pointCategoryMapModel: Model<PointCategoryMapModel>,
    @InjectModel(ProductModel.name) private productModel: Model<ProductModel>,
    @InjectModel(ProductDocsModel.name) private productDocsModel: Model<ProductDocsModel>,
    private readonly res: ResponseService,
    private readonly productService: ProductService,
  ) { }
  
  async read(req: Request, params: any): Promise<any> {
    try {
      let match: Record<string, any> = { is_delete: 0, org_id: req['user']['org_id'], status: 'Active' };
      let sorting: Record<string, 1 | -1> = { _id: -1 };
      if (params?.sorting && Object.keys(params.sorting).length !== 0) sorting = params.sorting;
      
      const filters: Record<string, any> = commonFilters(params?.filters);
      match = { ...match, ...filters };
      
      const page: number = params?.page || global.PAGE;
      const limit: number = params?.limit || global.LIMIT;
      const skip: number = (page - 1) * limit;
      
      const pipeline = [
        {
          $project: {
            created_unix_time: 0,
          }
        },
        {
          $match: match,
        },
        { $sort: sorting }
      ];
      
      const totalCountData: Record<string, any>[] = await this.productModel.aggregate([
        ...pipeline,
        { $count: "totalCount" },
      ]);
      const total: number = totalCountData.length > 0 ? totalCountData[0].totalCount : 0;
      let result: Record<string, any>[] = await this.productModel.aggregate([
        ...pipeline,
        { $skip: skip },
        { $limit: limit },
      ]);
      
      if(result.length > 0){
        
        const productIds = result.map((row:any)=>row?._id);
        const files = await this.productService.getDocument(productIds)
        
        // Build Map<row_id, file[]> using reduce
        const fileMap = files.reduce((acc, file) => {
          const key = file.row_id?.toString();
          if (!acc.has(key)) {
            acc.set(key, []);
          }
          acc.get(key).push(file);
          return acc;
        }, new Map<string, any[]>());
        
        // Attach files array to each row
        result = result.map(row => ({
          ...row,
          files: fileMap.get(row._id?.toString()) || []
        }));
      }
      return this.res.pagination(result, total, page, limit);
    } catch (error) {
      return this.res.error(HttpStatus.BAD_REQUEST, 'ERROR.BAD_REQ', error);
    }
  }
  
  async detail(req: Request, params: any): Promise<any> {
    try {
      const orgId = req['user']['org_id'];
      const productId = toObjectId(params._id);
      const customerTypeId = req['user']['customer_type_id']?.toString();
      
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
        return this.res.error(HttpStatus.NOT_FOUND, 'ERROR.NOT_FOUND', 'Product not found');
      }
      
      const pointCat = await this.pointCategoryMapModel.findOne({
        product_id: productId,
        is_delete: 0,
        org_id: orgId,
      }).lean();
      
      let pointValue = null;
      
      if (pointCat?.point_category_id) {
        const pointCatData = await this.pointCategoryModel.findOne({
          _id: pointCat.point_category_id,
          is_delete: 0,
        }).lean();
        
        if (Array.isArray(pointCatData?.point)) {
          const matched = pointCatData.point.find(
            (p: any) => p.customer_type_id?.toString() === customerTypeId
          );
          pointValue = matched?.point_value ?? null;
        }
        
        product['point_category_id'] = pointCat.point_category_id;
        product['point_category_name'] = pointCat.point_category_name || '';
      }
      
      product['points'] = pointValue;
      product['files'] = await this.productService.getDocument(productId);
      return this.res.success('SUCCESS.FETCH', product);
    } catch (error) {
      return this.res.error(HttpStatus.BAD_REQUEST, 'ERROR.BAD_REQ', error);
    }
  }
  
}
