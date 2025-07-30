import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {IsString, IsNumber, IsOptional, Min, IsObject, IsNotEmpty, IsMongoId, ValidateNested, IsArray} from 'class-validator';

class AuditReportDto {
  @ApiProperty({ type: String, description: 'Product ID (MongoDB ObjectId)' })
  @IsMongoId()
  @IsNotEmpty()
  product_id: string;

  @ApiProperty({ type: String, description: 'Name of the product' })
  @IsString()
  @IsNotEmpty()
  product_name: string;

  @ApiProperty({ type: Number, description: 'Stock quantity for the product' })
  @IsNumber()
  @IsNotEmpty()
  stock: number;

  @ApiProperty({ description: 'UOM' })
  @IsString()
  @IsNotEmpty()
  uom: string;

}

export class CreateStockAuditDto {
  @ApiProperty({ type: String, description: 'Customer ID (MongoDB ObjectId)' })
  @IsMongoId()
  @IsNotEmpty()
  customer_id: string;

  @ApiProperty({ description: 'Customer ID as Mongo ObjectId' })
  @IsMongoId()
  @IsNotEmpty()
  customer_type_id: string;

  @ApiProperty({ type: String, description: 'Customer name' })
  @IsString()
  @IsNotEmpty()
  customer_name: string;

  @ApiProperty({ type: String, description: 'Customer Type Name' })
  @IsString()
  @IsNotEmpty()
  customer_type_name: string;

  // @ApiProperty({ type: String, description: 'Audit performed by user ID (MongoDB ObjectId)' })
  // @IsMongoId()
  // @IsNotEmpty()
  // audit_by_id: string;

  // @ApiProperty({ type: String, description: 'Name of the user performing the audit' })
  // @IsString()
  // @IsNotEmpty()
  // audit_by_name: string;

  @ApiProperty({description: 'Audit report containing product stock info'})
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => AuditReportDto)
  @IsNotEmpty()
  audit_report: AuditReportDto[];

}

export class ReadStockAuditDto {
  @ApiPropertyOptional({ type: Object, description: 'Filter options for reading stock audit data' })
  @IsOptional()
  @IsObject()
  filters: object;

  @ApiPropertyOptional({ type: Object, description: 'Sorting options' })
  @IsOptional()
  @IsObject()
  sorting: object;

  @ApiPropertyOptional({ type: Number, description: 'Page number for pagination (min: 1)', minimum: 1 })
  @IsOptional()
  @IsNumber()
  @Min(1)
  page: number;

  @ApiPropertyOptional({ type: Number, description: 'Number of records per page (min: 10)', minimum: 10 })
  @IsOptional()
  @IsNumber()
  @Min(10)
  limit: number;
}

export class DetailStockAuditDto {
  
  @ApiProperty({ example: "60d21b4667d0d8992e610c85", description: "Announcement ID", required: true })
  @IsNotEmpty()
  @IsMongoId()
  _id: string;
}