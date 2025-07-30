import {
    ExceptionFilter,
    Catch,
    ArgumentsHost,
    HttpException,
    HttpStatus,
} from '@nestjs/common';

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
    catch(exception: unknown, host: ArgumentsHost) {
        const ctx = host.switchToHttp();
        const response = ctx.getResponse();
        const request = ctx.getRequest();

        let status = HttpStatus.INTERNAL_SERVER_ERROR;
        let message = 'Internal server error';
        if (exception instanceof HttpException) {
            status = exception.getStatus();
            message = exception.getResponse().toString();
        }

        // Log the error
        console.error(`Error: ${message}`);

        response.status(status).json({
            status: status,
            timestamp: new Date().toISOString(),
            path: request.url,
            message,
        });
    }
}