import { Injectable, Global, HttpStatus, HttpException } from '@nestjs/common';
import { Lts } from 'src/shared/translate/translate.service';
import { ApiRes } from 'src/common/dto/api-res.dto';
type MessageInput = string | [string, Record<string, string>];

@Global()
@Injectable()
export class ResponseService {
  constructor(private readonly lts: Lts) {}


  async success<T>(messageInput: MessageInput, data?: T): Promise<ApiRes<T>> {
    const { key, params } = this.parseMessageInput(messageInput);
    const message = await this.lts.t(key, params);
    return ApiRes.success(message, data);
  }

  async error<T>(
    statusCode: number,
    messageInput: MessageInput,
    error?: any
  ): Promise<ApiRes<T>> {
    const { key, params } = this.parseMessageInput(messageInput);
    const message = await this.lts.t(key, params);
  
    const errorData = error instanceof Error
      ? { message: error.message, stack: error.stack }
      : error ?? null;
  
    throw new HttpException(ApiRes.error(statusCode, message, errorData), statusCode);
  }
   
  async pagination<T>(
    data: T[], 
    total: number, 
    page: number = global.PAGE, 
    limit: number = global.LIMIT, 
    messageKey: string = 'SUCCESS.FETCH'
  ): Promise<ApiRes<T[]>> {
    const message = await this.lts.t(messageKey);
    return ApiRes.pagination(data, total, page, limit);
  }
  async confirm<T>(messageKey: string, data?: T): Promise<ApiRes<T>> {
    const message = await this.lts.t(messageKey);
    return ApiRes.confirm(HttpStatus.ACCEPTED, message, data);
  }

  private parseMessageInput(input: MessageInput): { key: string, params?: Record<string, string> } {
    if (Array.isArray(input)) {
      const [key, params] = input;
      return { key, params };
    }
    return { key: input };
  }
}
