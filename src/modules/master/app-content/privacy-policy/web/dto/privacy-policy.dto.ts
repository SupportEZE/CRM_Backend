import { IsString, IsNumber, IsOptional, Min, IsNotEmpty } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreatePrivacyPolicyDto {
  @ApiProperty({ description: 'privacy_policy.', example: 'This privacy policy explains how we collect and use your data...' })
  @IsNotEmpty()
  @IsString()
  privacy_policy?: string;
}



