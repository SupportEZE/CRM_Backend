import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Socket } from 'socket.io';
import { ProductModel } from 'src/modules/master/product/models/product.model';
import { CsvService } from 'src/shared/csv/csv.service';

interface ClientState {
  skip: number;
  batchSize: number;
  isPaused: boolean;
  totalCount:number
}

@Injectable()
export class DownloaderService {

  constructor(
    @InjectModel(ProductModel.name) private readonly productModel: Model<ProductModel>,
    private readonly csvService:CsvService

) {} 

  async fetchProductData(user:any,params: any): Promise<any> {

    try {
      let headers: Record<string, number> = {};
      if (!headers.length) {
        return {statusCode:404,statusMessage:'ERROR.NO_HEADERS_FOUND'};
      }
      (params.headers || []).forEach((key: string) => {
        headers[key] = 1;
      });
      let match: any = { is_delete: 0, org_id: user['org_id'] };
      if (params.search && Object.keys(params.search).length > 0) {
        Object.keys(params.search).forEach((key) => {
          if (params.search[key]) {
            match[key] = { $regex: new RegExp(params.search[key], 'i') };
          }
        });
      }
      const sorting: Record<string, 1 | -1> = params.sorting || { _id: -1 };
      const pipeline = [
        {
          $project: headers,
        },
        {
          $match: match,
        },
        {
          $sort: sorting,
        },
        {
          $limit: 1,
        },
      ];
      const result = await this.productModel.aggregate(pipeline);
      if (!result.length) {
        return {statusCode:404,statusMessage:'ERROR.NO_DATA_FOUND'};
      }
      const data = result.map((doc: any) => {
        delete doc._id;
        return doc;
      });

      const downloadData = {
        data: data,
        filename: `product_${user['org_id']}.csv`
      };
      const response = await this.csvService.generateCsv(user, downloadData);
      return {statusCode:200,statusMessage:'SUCCESS.DATA_SENT'};
    } catch (error) {
      return {statusCode:400,statusMessage:'ERROR.BAD_REQ'};
    }
    
  }  

  async downloadProductData(client: Socket, state: ClientState, params: any) {
    try {
      const user = (client as any).user;
      if (!user || !user.org_id) {
        return { statusCode: 401, statusMessage: 'ERROR.UNAUTHORIZED' };
      }
  
      if (state.isPaused) return { statusCode: 400, message: 'Paused' };
  
      // Fetch total count only for the first batch
      if (state.skip === 0) {
        state.totalCount = await this.productModel.countDocuments().exec();
      }
  
      const { skip, batchSize, totalCount } = state;
      const remainingCount = Math.max(totalCount - skip, 0);
      const estimatedTime = remainingCount > 0 ? (remainingCount / batchSize) * 2 : 0; // Assuming 2s per batch
  
      const records = await this.productModel.find().skip(skip).limit(batchSize).exec();
  
      // ✅ Fix: Ensure `headers` is properly initialized
      let headers: Record<string, number> = {};
      if (!params.headers || !Array.isArray(params.headers) || params.headers.length === 0) {
        return { statusCode: 404, statusMessage: 'ERROR.NO_HEADERS_FOUND' };
      }
  
      params.headers.forEach((key: string) => {
        headers[key] = 1;
      });
  
      // ✅ Fix: Ensure `match` object is correctly initialized
      let match: any = { is_delete: 0, org_id: user.org_id };
  
      if (params.search && typeof params.search === 'object') {
        Object.keys(params.search).forEach((key) => {
          if (params.search[key]) {
            match[key] = { $regex: new RegExp(params.search[key], 'i') };
          }
        });
      }
  
      // ✅ Fix: Ensure `sorting` is safely merged
      const sorting: Record<string, 1 | -1> = params.sorting && typeof params.sorting === 'object' ? params.sorting : { _id: -1 };
  
      const pipeline = [
        { $match: match },
        { $project: headers },
        { $sort: sorting },
        { $limit: batchSize },
      ];

  
      const result = await this.productModel.aggregate(pipeline).exec();
      
      if (!result || result.length === 0) {
        return { statusCode: 404, statusMessage: 'ERROR.NO_DATA_FOUND' };
      }
  
      const data = result.map((doc: any) => {
        delete doc._id;
        return doc;
      });
  
      const downloadData = {
        data: data,
        filename: `product_${user.org_id}.csv`,
        skip:state.skip
      };
  
      // ✅ Ensure CSV generation is awaited
      const response = await this.csvService.generateCsv(user, downloadData);
  
      // Emit chunk of data to client
      client.emit('dataChunk', {
        data: records,
        totalCount,
        remainingCount,
        estimatedTime: `${estimatedTime.toFixed(2)}s`,
      });
  
      state.skip += batchSize;
  
      if (remainingCount <= 0) {
        return { statusCode: 201, message: 'Download complete' };
      }
  
      return { statusCode: 200, message: 'Next batch sent', skip: state.skip };
  
    } catch (error) {
      console.error(`❌ Error in downloadProductData: ${error.message}`);
      return { statusCode: 500, statusMessage: 'ERROR.INTERNAL_SERVER_ERROR' };
    }
  }
  
    
}
