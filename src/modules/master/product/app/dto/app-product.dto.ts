import { ApiProperty, ApiQuery, ApiResponse, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsNumber,
  IsOptional,
  MaxLength,
  Min,
  IsObject,
  IsNotEmpty,
  IsEnum,
  IsArray,
  ValidateIf,
  IsDate,
  IsNotIn,
  ValidationArguments,
  Validate,
  Equals,
  IsMongoId
} from 'class-validator';
import { Transform, Type } from 'class-transformer';

export enum Status {
  Active = 'Active',
  Inactive = 'Inactive',
}

export class AppReadProductDto {
  @ApiPropertyOptional({
    description: 'Criteria for filtering products. Use key-value pairs.',
    type: Object,
    example: { search: 'value' },
  })
  @IsOptional()
  @IsObject()
  filters?: object;

  @ApiPropertyOptional({
    description: 'Sorting criteria for the products. Use key-value pairs.',
    type: Object,
    example: { product_name: 1 },
  })
  @IsOptional()
  @IsObject()
  sorting?: object;

  @ApiPropertyOptional({
    description: 'Page number for pagination.',
    type: Number,
    example: 1,
  })
  @IsNumber()
  @Min(1)
  page?: number;

  @ApiPropertyOptional({
    description: 'Number of products per page for pagination.',
    type: Number,
    example: 20,
  })
  @IsOptional()
  @IsNumber()
  @Min(10)
  limit?: number;
}

export class AppProductDetailDto {
  @ApiProperty({
    description: 'Unique ID of the product to fetch its details.',
    type: String,
    example: '609b1f77bcf86cd799439011',
  })
  @IsNotEmpty()
  @IsMongoId()
  @IsString()
  _id: string;
}

export class AppProductDocsDto {
  @ApiProperty({
    description: 'Unique ID of the product to fetch its details.',
    type: String,
    example: '609b1f77bcf86cd799439011',
  })
  @IsNotEmpty()
  @IsMongoId()
  @IsString()
  _id: string;
}
