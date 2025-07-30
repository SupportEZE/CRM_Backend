
import { Injectable } from '@nestjs/common';;
import { RpcService } from './rpc.service';
import { RedisService } from 'src/services/redis.service';
import { ConfigService } from '@nestjs/config';
import { AllConfigType } from 'src/config/config.type';

@Injectable()
export class ControlService {
  private rpcUrl:string;
  constructor(
    private readonly rpcService: RpcService,
    private readonly configService: ConfigService<AllConfigType>
    
  ) { 
    this.rpcUrl =  `${this.configService.getOrThrow('app.authProjectUrl', { infer: true })}/control/`;
  }
  
  async read(req:Request): Promise<any> {
    try {
      let options = {
        method: 'POST',
        url: `${this.rpcUrl}read`,
        json: true,
        simple: false,
        headers: {
          Authorization: req.headers['authorization'],
          key:process.env.INTERNAL_API_KEY
          
        },
      };
      let response = await this.rpcService.call(options);
      return response;
    } catch (error) {
      throw  error?.response?.data || null
    }
  }
}