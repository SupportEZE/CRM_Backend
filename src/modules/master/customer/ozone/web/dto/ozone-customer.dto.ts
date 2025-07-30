import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsMongoId,
  IsObject,
  IsArray,
  IsNumber,
  Min,
  ArrayNotEmpty,
  ValidateIf,
  ValidateNested,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { PartialType } from '@nestjs/mapped-types';
import { Transform, Type } from 'class-transformer';

export class ReadOzoneCustomerDto {
  @ApiProperty({
    example: 'Pending',
    description: 'Active tab indicating the type of customers to fetch',
  })
  @IsString()
  active_tab: string;

  @ApiPropertyOptional({
    type: Object,
    example: { field_name: 'value' },
    description: 'Filter criteria for fetching customers',
  })
  @IsOptional()
  @IsObject()
  filters?: Record<string, any>;

  @ApiPropertyOptional({
    type: Object,
    example: { customer_name: 1 },
    description: 'Sorting criteria in key-direction format',
  })
  @IsOptional()
  @IsObject()
  sorting?: Record<string, 'asc' | 'desc'>;

  @ApiProperty({
    example: 1,
    description: 'Current page number (min: 1)',
  })
  @Transform(({ value }) => parseInt(value))
  @IsNumber()
  @Min(1)
  page?: number;

  @ApiPropertyOptional({
    example: 10,
    description: 'Items per page (min: 10)',
  })
  @IsOptional()
  @Transform(({ value }) => parseInt(value))
  @IsNumber()
  @Min(10)
  limit?: number;

  @ApiProperty({
    example: 10,
    description: 'Login type name to filter customers',
  })
  @IsNotEmpty()
  @IsNumber()
  login_type_id?: number;

  @ApiProperty({
    example: '609e126f61e3e53b7c2d672c',
    description: 'Customer type id to filter customers',
  })
  @IsMongoId()
  @IsNotEmpty()
  @IsString()
  customer_type_id?: string;
}
export class UpdateOzoneCustomerProfileStatusDto {
  @ApiProperty({
    description: 'MongoDB ObjectId of the customer to update',
    example: '609e126f61e3e53b7c2d672c',
  })
  @IsNotEmpty()
  @IsMongoId()
  _id: string;

  @ApiPropertyOptional({
    description: 'Status of the customer profile',
    example: 'Active',
  })
  @IsOptional()
  @IsString()
  profile_status: string;

  @ApiPropertyOptional({
    description: 'Creation type',
    example: 'yes',
  })
  @IsNotEmpty()
  followup_creation: string;

  @ApiProperty({ description: 'Follow-up date', example: '2025-07-23', required: false })
  @ValidateIf((o) => o.followup_creation === 'Yes')
  @IsString()
  @IsNotEmpty({ message: 'followup_date is required when creation_type is yes' })
  followup_date: string;

  @ApiProperty({ description: 'followup time', required: true })
  @ValidateIf((o) => o.followup_creation === 'Yes')
  @IsString()
  @IsNotEmpty()
  followup_time: string;

  @ApiProperty({ description: 'followup type', required: true })
  @ValidateIf((o) => o.followup_creation === 'Yes')
  @IsString()
  @IsNotEmpty()
  followup_type: string;

  @ApiProperty({ description: 'assigned_to_user_id', required: true })
  @ValidateIf((o) => o.followup_creation === 'Yes')
  @IsString()
  @IsMongoId()
  assigned_to_user_id: string;

  @ApiProperty({ description: 'assigned_to_user_name', required: true })
  @ValidateIf((o) => o.followup_creation === 'Yes')
  @IsString()
  @IsNotEmpty()
  assigned_to_user_name: string;

  @ApiProperty({ description: 'customer_name is optional', required: false })
  @ValidateIf((o) => o.followup_creation === 'Yes')
  @IsString()
  @IsOptional()
  customer_name: string;

  @ApiProperty({ description: 'remark', required: false })
  @IsOptional()
  @IsString()
  remark: string;
}

