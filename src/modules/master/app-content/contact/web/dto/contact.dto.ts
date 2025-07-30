import { IsString, IsNumber, IsOptional, MaxLength, Min, IsObject, isNotEmpty, IsNotEmpty, IsEnum, ValidateNested, Max, IsEmail } from 'class-validator';
import { Transform, Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';


export class CreateContactDto {
  @ApiProperty({
    example: '9876543210',
    description: 'Primary mobile number',
    required: false,
  })
  @IsNotEmpty()
  @IsString()
  mobile?: string;

  @ApiProperty({
    example: '9123456780',
    description: 'Secondary mobile number',
    required: false,
  })
  @IsOptional()
  @IsString()
  mobile_1?: string;

  @ApiProperty({
    example: 'support@example.com',
    description: 'Contact email address',
    required: false,
  })
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiProperty({
    example: 'https://example.com',
    description: 'Company or contact website URL',
    required: false,
  })
  @IsOptional()
  @IsString()
  website?: string;

  @ApiProperty({
    example: 28.6139,
    description: 'Latitude coordinate',
    required: false,
  })
  @IsOptional()
  @IsNumber()
  latitude?: number;

  @ApiProperty({
    example: 77.2090,
    description: 'Longitude coordinate',
    required: false,
  })
  @IsOptional()
  @IsNumber()
  longitude?: number;

  @ApiProperty({
    example: '123 MG Road, New Delhi, India',
    description: 'Contact address',
    required: false,
    maxLength: 100,
  })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  address?: string;
}