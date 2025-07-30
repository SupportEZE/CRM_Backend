import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {IsString, IsNumber, IsOptional, Min, IsObject, IsNotEmpty, IsMongoId, ValidateNested, IsArray} from 'class-validator';

class AppAuditReportDto {
  @ApiProperty({ description: 'Product ID as Mongo ObjectId' })
  @IsMongoId()
  @IsNotEmpty()
  product_id: string;

  @ApiProperty({ description: 'Name of the product' })
  @IsString()
  @IsNotEmpty()
  product_name: string;

  @ApiProperty({ description: 'Stock quantity of the product' })
  @IsNumber()
  @IsNotEmpty()
  stock: number;

  @ApiProperty({ description: 'UOM' })
  @IsString()
  @IsNotEmpty()
  uom: string;
}

export class AppCreateStockAuditDto {
  @ApiProperty({ description: 'Customer ID as Mongo ObjectId' })
  @IsMongoId()
  @IsNotEmpty()
  customer_id: string;

  @ApiProperty({ description: 'Customer ID as Mongo ObjectId' })
  @IsMongoId()
  @IsNotEmpty()
  customer_type_id: string;

  @ApiProperty({ type: String, description: 'Customer Type Name' })
  @IsString()
  @IsNotEmpty()
  customer_type_name: string;

  @ApiProperty({ description: 'Name of the customer' })
  @IsString()
  @IsNotEmpty()
  customer_name: string;

  @ApiPropertyOptional({ description: 'Auditor ID as Mongo ObjectId' })
  @IsMongoId()
  @IsOptional()
  audit_by_id: string;

  @ApiPropertyOptional({ description: 'Name of the auditor' })
  @IsString()
  @IsOptional()
  audit_by_name: string;

  @ApiProperty({description: 'Audit report containing product stock info'})
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => AppAuditReportDto)
  @IsNotEmpty()
  audit_report: AppAuditReportDto[];


  @ApiPropertyOptional({ description: 'chekin-id' })
  @IsMongoId()
  @IsOptional()
  visit_activity_id: string;
}

export class AppReadStockAuditDto {
  @ApiPropertyOptional({ description: 'Filters for querying stock audits', type: Object })
  @IsOptional()
  @IsObject()
  filters: object;

  @ApiPropertyOptional({ description: 'Page number for pagination', minimum: 1 })
  @IsOptional()
  @IsNumber()
  @Min(1)
  page?: number;

  @ApiPropertyOptional({ description: 'Number of records per page', minimum: 1 })
  @IsOptional()
  @IsNumber()
  @Min(1)
  limit?: number;
}

export class AppDetailStockAuditDto {
  
  @ApiProperty({ description: 'Stock ID to fetch details', required: true, example: '603d2149e1c1f001540b7a7d' })
  @IsNotEmpty()
  @IsMongoId()
  _id: string;
}
