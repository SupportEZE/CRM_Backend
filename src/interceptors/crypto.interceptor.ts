import {
    CallHandler,
    ExecutionContext,
    Injectable,
    NestInterceptor,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { CryptoService } from '../services/crypto.service';
import { CRYPTO_KEY } from 'src/decorators/crypto.decorator';
import { ControlService } from 'src/shared/rpc/control.service';


@Injectable()
export class CryptoInterceptor implements NestInterceptor {
    constructor(
        private readonly cryptoService: CryptoService,
        private readonly reflector: Reflector,
        private controlService: ControlService,
        
    ) { }
    
    async intercept(context: ExecutionContext, next: CallHandler): Promise<Observable<any>> {
        const request = context.switchToHttp().getRequest();
        const acceptLanguage = request.headers['accept-language'] || 'en'; // Default to 'en' if no header is provided
        request.language = acceptLanguage; // Attach the language to the request object
        const cryptoOptions = this.reflector.get(CRYPTO_KEY, context.getHandler()) || { encrypt: true, decrypt: true };
        if (request.headers.authorization) {
            if (request?.user) {
                const createEntryObj = {
                    org_id: request.user.org_id,
                    created_id: request.user._id,
                    created_name: request?.user?.name || request.user.customer_name,
                    source: request?.url?.includes('app-') ? 'app' : 'web'
                }
                request.createObj = createEntryObj;
                const updateEntryObj = {
                    org_id: request.user.org_id,
                    updated_id: request.user._id,
                    updated_name: request?.user?.name || request.user.customer_name
                }
                request.updateObj = updateEntryObj;

                const seniorEntryObj = {
                    senior_status_updated_id: request.user._id,
                    senior_status_updated_name: `${request?.user?.name} ( ${request?.user?.mobile} )`,
                    senior_status_updated_at: new Date()
                }
                request.seniorObj = seniorEntryObj;
            }
        }
        
        
        const control = await this.controlService.read(request)
        if (!control?._crypto?.[process.env.NODE_ENV]?.api) return next.handle();
        
        if (cryptoOptions?.decrypt && request.body?.encryptedData) {
            try {
                request.body = this.cryptoService.decrypt(request.body.encryptedData);
            } catch (error) {
                throw new Error('Invalid encrypted data');
            }
        }
        return next.handle().pipe(
            map((data) =>
                cryptoOptions.encrypt
            ? { encryptedData: this.cryptoService.encrypt(data,true) }
            : data,
        ),
    );
}
}