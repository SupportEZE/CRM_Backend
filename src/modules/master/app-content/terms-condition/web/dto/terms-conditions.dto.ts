import { IsString, IsNumber, IsOptional, Min, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateTermsConditionsDto {

  @ApiProperty({ description: 'terms_conditions.', example: 'This terms explains how we collect and use your data...' })
  @IsNotEmpty()
  @IsString()
  terms_conditions?: string;
}