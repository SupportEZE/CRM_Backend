
import { Injectable } from '@nestjs/common';;
import { RpcService } from './rpc.service';
import { RedisService } from 'src/services/redis.service';
import { AllConfigType } from 'src/config/config.type';
import { ConfigService } from '@nestjs/config';
@Injectable()
export class AuthService {
  private rpcUrl: string;
  constructor(
    private readonly rpcService: RpcService,
    private readonly configService: ConfigService<AllConfigType>
  ) {

    this.rpcUrl =  `${this.configService.getOrThrow('app.authProjectUrl', { infer: true })}/`;
  }

  async createAppToken(req: Request, params: any): Promise<any> {
    try {
      let options = {
        method: 'POST',
        url: `${this.rpcUrl}create-app-token`,
        json: true,
        simple: false,
        data: params
      };
      let response = await this.rpcService.call(options);
      return response;
    } catch (error) {
      throw error.response.data
    }
  }

  async validateToken(req: Request, params: any): Promise<any> {
    try {
      let options = {
        method: 'POST',
        url: `${this.rpcUrl}validate-token`,
        json: true,
        simple: false,
        data: params,
        headers: {
          Authorization: req.headers['authorization'],
          'Source-Endpoint':req.url
        },
      };

      let response = await this.rpcService.call(options);
      return response?.data || {};

    } catch (error) {
      throw error?.response?.data
    }
  }
}