
import { ApilogService } from 'src/shared/apilog/apilog.service';
import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import { Observable, throwError } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';
import { ControlService } from 'src/shared/rpc/control.service';

@Injectable()
export class ApilogInterceptor implements NestInterceptor {
    constructor(
        private apilogService: ApilogService,
        private controlService: ControlService,

    ) 
    { }

    async intercept(context: ExecutionContext, next: CallHandler): Promise<Observable<any>> {
        
        const request = context.switchToHttp().getRequest();
        const { method, originalUrl, body, query, params, headers } = request;

        const control = await this.controlService.read(request);
        if(!control?._end_point_log?.[process.env.NODE_ENV]?.api) return next.handle();
        
        const startTime = Date.now();
        const excludedRoutes = ['/shanu'];

        const logData: logData = {
            api_name: originalUrl,
            api_url: originalUrl,
            api_method: method,
            api_header: headers,
            api_request: body,
            api_response: {},
            response_time: '',
        };

        return next.handle().pipe(
            tap((data) => {
                const endTime = Date.now();
                const resTime = endTime - startTime;
                logData.response_time = `${resTime} ms`;
                logData.api_response = data;
                if (!excludedRoutes.includes(originalUrl)) {
                    this.apilogService.createLog(logData);
                }
            }),
            catchError((error) => {
                const endTime = Date.now();
                const resTime = endTime - startTime;
                logData.response_time = `${resTime} ms`;
                let errorMsg = error;
                if (error.code === 'ER_DUP_ENTRY') {
                    errorMsg = error.sqlMessage;
                }
                logData.api_response = errorMsg;
                if (!excludedRoutes.includes(originalUrl)) {
                    this.apilogService.createLog(logData);
                }
                return throwError(() => error);
            }),

        );
    }
}

interface logData {
    api_name: string,
    api_url: string;
    api_method: string;
    api_header: object;
    api_request: object;
    api_response: object;
    response_time: string;
}

