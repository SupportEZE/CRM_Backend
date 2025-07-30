import { registerAs } from '@nestjs/config';
import {
  
  IsOptional,
  IsString,
} from 'class-validator';
import validateConfig from 'src/utils/validate-config';
import { DatabaseConfig } from './database.config.type';

class EnvironmentVariablesValidator {
  
  @IsString()
  @IsOptional()
  CRM_CONN_URI: string;
  
  @IsString()
  @IsOptional()
  COUPON_CONN_URI: string;
  
  @IsString()
  @IsOptional()
  SUPPORT_CONN_URI: string;

  @IsString()
  @IsOptional()
  CORE_CONN_URI: string;

  @IsString()
  @IsOptional()
  @IsString()
  @IsOptional()
  CUSTON_CONN_URI: string;
}

export default registerAs<DatabaseConfig>('database', () => {
  validateConfig(process.env, EnvironmentVariablesValidator);
  return {
    crmDbUri:process.env.CRM_CONN_URI || "",
    couponDbUri:process.env.COUPON_CONN_URI || "",
    supportDbUri:process.env.SUPPORT_CONN_URI || "",
    coreDbUri:process.env.CORE_CONN_URI || "",
    customDbUri:process.env.CUSTOM_CONN_URI || "",
  };
});
