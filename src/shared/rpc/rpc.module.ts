import { Global, Module } from '@nestjs/common';
import { RpcService } from './rpc.service';
import { HttpModule } from '@nestjs/axios';
import { ApilogModule } from '../apilog/apilog.module';
import { AuthService } from './auth.service';
import { ControlService } from './control.service';
import { RedisService } from 'src/services/redis.service';
@Global()
@Module({
    imports: [HttpModule,ApilogModule],
    providers: [RpcService,AuthService,ControlService,RedisService],
    exports: [RpcService,AuthService,ControlService],
})
export class RpcModule { }
