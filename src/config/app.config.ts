import { registerAs } from '@nestjs/config';
import {
  IsInt,
  IsOptional,
  IsString,
  Max,
  Min,
} from 'class-validator';
import validateConfig from 'src/utils/validate-config';
import { AppConfig } from './app.config.type';

export enum Environment {
  LOCAL = 'local',
  STAGE = 'staging',
  PRODUCTION = 'production',
}


class EnvironmentVariablesValidator {
  @IsOptional()
  NODE_ENV: string;

  @IsInt()
  @Min(0)
  @Max(65535)
  @IsOptional()
  SERVER_PORT: number;

  @IsString()
  @IsOptional()
  API_PREFIX: string;

  @IsString()
  API_ENCRYPTION_KEY: string;

  @IsString()
  API_ENCRYPTION_IV: string;

  @IsString()
  SHARED_PROJECT_URL: string;

  @IsString()
  AUTH_PROJECT_URL: string;

  @IsString()
  REDIS_URL: string;

}

export default registerAs<AppConfig>('app', () => {
  validateConfig(process.env, EnvironmentVariablesValidator);

  return {
    nodeEnv: process.env.NODE_ENV || 'local',
    name: process.env.APP_NAME || '',
    rootPath: process.env.PWD || process.cwd(),
    port: process.env.SERVER_PORT ? parseInt(process.env.SERVER_PORT, 10) : 6050,
    apiPrefix: process.env.API_PREFIX || 'api',
    secretKey: process.env.AES_KEY,
    apiEncryptionKey: process.env.API_ENCRYPTION_KEY,
    apiEncryptionIV: process.env.API_ENCRYPTION_IV,
    sharedProjectUrl: process.env.SHARED_PROJECT_URL,
    authProjectUrl: process.env.AUTH_PROJECT_URL,
    redisUrl: process.env.REDIS_URL,

  };
});
