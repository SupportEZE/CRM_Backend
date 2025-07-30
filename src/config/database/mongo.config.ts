import { MongooseModule } from '@nestjs/mongoose';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AllConfigType } from 'src/config/config.type';
import { DB_NAMES } from '../db.constant';

export const MongoConfig = [
  MongooseModule.forRootAsync({
    imports: [ConfigModule],
    inject: [ConfigService],
    useFactory: (configService: ConfigService<AllConfigType>) => ({
      uri: configService.getOrThrow<string>('database.crmDbUri', { infer: true }),
    }),
  }),

  // Second MongoDB Connection
  MongooseModule.forRootAsync({
    connectionName: DB_NAMES().COUPON_DB,
    imports: [ConfigModule],
    inject: [ConfigService],
    useFactory: (configService: ConfigService<AllConfigType>) => ({
      uri: configService.getOrThrow<string>('database.couponDbUri', { infer: true }),
    }),
  },),

  // ✅ Third named connection
  MongooseModule.forRootAsync({
    connectionName: DB_NAMES().SUPPORT_DB,
    imports: [ConfigModule],
    inject: [ConfigService],
    useFactory: (configService: ConfigService<AllConfigType>) => ({
      uri: configService.getOrThrow<string>('database.supportDbUri', { infer: true }),
    }),
  }),

  // ✅ Fourth named connection
  MongooseModule.forRootAsync({
    connectionName: DB_NAMES().CORE_DB,
    imports: [ConfigModule],
    inject: [ConfigService],
    useFactory: (configService: ConfigService<AllConfigType>) => ({
      uri: configService.getOrThrow<string>('database.coreDbUri', { infer: true }),
    }),
  }),

  // ✅ Fourth named connection
  MongooseModule.forRootAsync({
    connectionName: DB_NAMES().CUSTOM_DB,
    imports: [ConfigModule],
    inject: [ConfigService],
    useFactory: (configService: ConfigService<AllConfigType>) => ({
      uri: configService.getOrThrow<string>('database.customDbUri', { infer: true }),
    }),
  }),
];
