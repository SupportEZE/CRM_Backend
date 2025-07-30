
import { Injectable } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { lastValueFrom } from 'rxjs';
import { AxiosRequestConfig } from 'axios';
import { ApilogService } from 'src/shared/apilog/apilog.service';

@Injectable()
export class RpcService {
  constructor(
    private readonly httpService: HttpService,
    private readonly apilogService: ApilogService,

  ) { }

  async call(config: AxiosRequestConfig = {}): Promise<any> {
    const startTime = Date.now();
    try {
      const response = await lastValueFrom(
        this.httpService.request({ ...config }),
      );
      
      // this.externalApiLog(config, response?.data, startTime);
      return response.data;
    } catch (error) {
      // this.externalApiLog(config, error.response?.data, startTime);
      throw error
    }
  }

  private async externalApiLog(options: any, response: any, startTime:any) {
    try {
      const endTime = Date.now();
      const resTime = endTime - startTime;
      let logData = {
        api_status: response.status,
        api_method: options.method,
        api_url: options.url,
        api_header: JSON.stringify(options.headers),
        api_name: options.url,
        api_request: JSON.stringify(options.data),
        api_response: JSON.stringify(response),
        response_time: `${resTime} ms`
      }
      this.apilogService.createExternalLog(logData);
    } catch (error) {
      throw error
    }
  }

}