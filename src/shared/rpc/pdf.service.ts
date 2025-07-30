
import { Injectable } from '@nestjs/common';;
import { RpcService } from './rpc.service';
import { ConfigService } from '@nestjs/config';
import { AllConfigType } from 'src/config/config.type';

@Injectable()
export class PdfService {
  private rpcUrl: string;
  constructor(
    private readonly rpcService: RpcService,
    private readonly configService: ConfigService<AllConfigType>
    
  ) {
    this.rpcUrl =  `${this.configService.getOrThrow('app.sharedProjectUrl', { infer: true })}/pdf/`;  
  }
  
  async htmlPdf(req: Request, params: any): Promise<any> {
    try {
      let options = {
        method: 'POST',
        url: `${this.rpcUrl}generate-html-pdf`,
        json: true,
        simple: false,
        data: params,
        headers: {
          'Authorization': req['headers']['authorization']
        }
      };
      let response = await this.rpcService.call(options);
      
      return response?.data;
    } catch (error) {
      throw error
    }
  }
}