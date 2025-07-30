import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  UnauthorizedException,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { AuthService } from 'src/shared/rpc/auth.service';
import { Reflector } from '@nestjs/core';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';
import { toObjectId } from 'src/common/utils/common.utils';

@Injectable()
export class AuthInterceptor implements NestInterceptor {
  constructor(
    private readonly authService: AuthService,
    private readonly reflector: Reflector,
  ) {}

  async intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Promise<Observable<any>> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    
    const request = context.switchToHttp().getRequest();

    if (isPublic || request.headers.key === process.env.INTERNAL_API_KEY) return next.handle();
    

    const authHeader = request.headers['authorization'];
    if (!authHeader) {
      throw new UnauthorizedException('Missing Authorization Header');
    }

    try {
      const user = await this.authService.validateToken(request, {});
      if(user) user._id = toObjectId(user._id);
      request['user'] = user;
      return next.handle();
    } catch (error) {
      console.error('Token validation error:', error);
      throw new UnauthorizedException(error);
    }
  }
}
