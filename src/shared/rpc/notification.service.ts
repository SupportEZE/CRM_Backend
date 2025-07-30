import { Injectable } from '@nestjs/common';
import { RpcService } from './rpc.service';
import { AllConfigType } from 'src/config/config.type';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class NotificationService {
  private rpcUrl: string;
  
  constructor(
    private readonly rpcService: RpcService,
    private readonly configService: ConfigService<AllConfigType>
    
  ) {
    this.rpcUrl =  `${this.configService.getOrThrow('app.sharedProjectUrl', { infer: true })}/notification/`;
  }
  
  private buildNotifyObject(params: any): Record<string, any> {
    return {
      template_id: params.template_id,
      account_ids: params.account_ids || [],
      variables: params.variables || [],
      imageUrl: params.imageUrl ?? '',
      push_notify: !!params.push_notify,
      in_app: !!params.in_app,
    };
  }
  
  private buildRequestOptions(
    url: string,
    notifyObj: Record<string, any>,
    token: string,
  ) {
    return {
      method: 'POST',
      url,
      json: true,
      simple: false,
      data: notifyObj,
      headers: {
        Authorization: token,
      },
    };
  }
  
  async notify(req: Request, params: any): Promise<any> {
    try {
      const notifyObj = this.buildNotifyObject(params);
      const token = req['headers']['authorization'];
      const url = `${this.rpcUrl}send`;
      const options = this.buildRequestOptions(url, notifyObj, token);
      const response = await this.rpcService.call(options);
      return response;
    } catch (error) {
      throw error;
    }
  }
  
  async notifyInSocket(user: Request, params: any): Promise<any> {
    try {
      const notifyObj = this.buildNotifyObject(params);
      const token = `Bearer ${user['token']}`;
      const url = `${this.rpcUrl}send`;
      const options = this.buildRequestOptions(url, notifyObj, token);
      const response = await this.rpcService.call(options);
      return response;
    } catch (error) {
      return null;
    }
  }
}