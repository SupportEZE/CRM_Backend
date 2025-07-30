import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Socket } from 'socket.io';
import { UserModel } from '../../master/user/models/user.model';
import { CustomerModel } from 'src/modules/master/customer/default/models/customer.model';

@Injectable()
export class JwtWsGuard implements CanActivate {
  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    @InjectModel(UserModel.name) private readonly userModel: Model<UserModel>,
    @InjectModel(CustomerModel.name)
    private readonly customerModel: Model<CustomerModel>,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const client: Socket = context.switchToWs().getClient();
    const token =
      client.handshake.auth?.token ||
      client.handshake.query?.token ||
      client.handshake.headers?.authorization?.split(' ')[1];

    if (!token) {
      throw new UnauthorizedException('Missing token');
    }

    try {
      const secret = this.configService.get<string>('auth.secret');
      if (!secret) throw new UnauthorizedException('Server misconfiguration.');

      //   const payload = this.jwtService.verify(token, { secret });
      const payload = this.jwtService.decode(token);
      if (!payload) throw new UnauthorizedException('User not found');

      let user: any;
      if (payload?.sub?._id) {
        user = await this.userModel.findById(payload.sub._id).lean();
        if (!user)
          user = await this.customerModel.findById(payload.sub._id).lean();
      } else {
        user = await this.userModel.findById(payload.id).lean();
        if (!user) user = await this.customerModel.findById(payload.id).lean();
      }

      if (!user) throw new UnauthorizedException('User not found');
      (client as any).user = user;
      user.token = token;
      return true;
    } catch (err) {
      if (err.name === 'TokenExpiredError') {
        console.error('WebSocket Token Expired:', err.expiredAt);
        throw new UnauthorizedException(
          'Session expired. Please re-authenticate.',
        );
      }
      console.error('WebSocket JWT Verification Failed:', err.message);
      throw new UnauthorizedException('Invalid or expired token');
    }
  }
}
