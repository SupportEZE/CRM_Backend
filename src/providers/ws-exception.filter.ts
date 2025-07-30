import {
    ArgumentsHost,
    Catch,
    WsExceptionFilter,
    BadRequestException,
  } from '@nestjs/common';
  import { WsException } from '@nestjs/websockets';
  
  @Catch()
  export class AllExceptionsWsFilter implements WsExceptionFilter {
    catch(exception: unknown, host: ArgumentsHost) {
      const ctx = host.switchToWs();
      const client = ctx.getClient();
  
      let message = 'Internal server error';
  
      if (exception instanceof BadRequestException) {
        const response = exception.getResponse();
        message =
          typeof response === 'string'
            ? response
            : (response as any)?.message?.join(', ');
      } else if (exception instanceof WsException) {
        message = exception.message;
      } else if (exception instanceof Error) {
        message = exception.message;
      }
  
      client.emit('chatValidationError', {
        status: 'error',
        message,
      });
    }
  }