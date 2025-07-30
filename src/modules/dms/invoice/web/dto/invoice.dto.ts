import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsString, IsNumber, IsOptional, Min, IsObject, IsNotEmpty, IsMongoId, ValidateNested, IsEnum, ValidateIf, IsArray, IsDate } from 'class-validator';

class CreateInvoiceItemDto {
  @IsNotEmpty()
  @IsMongoId()
  product_id: string;

  @IsOptional()
  @IsString()
  product_name?: string;
  
  @IsOptional()
  @IsString()
  product_code?: string;

  @IsOptional()
  @IsNumber()
  total_quantity?: number;

  @IsOptional()
  @IsNumber()
  unit_price?: number;

  @IsOptional()
  @IsNumber()
  gross_amount?: number;

  @IsOptional()
  @IsNumber()
  discount_percent?: number;

  @IsOptional()
  @IsNumber()
  discount_amount?: number;

  @IsOptional()
  @IsNumber()
  net_amount_before_tax?: number;

  @IsOptional()
  @IsNumber()
  gst_percent?: number;

  @IsOptional()
  @IsNumber()
  gst_amount?: number;

  @IsOptional()
  @IsNumber()
  net_amount_with_tax?: number;
}

export class CreateInvoiceDto {

  @IsNotEmpty()
  @IsNumber()
  login_type_id: number;

  @IsOptional()
  @IsMongoId()
  customer_type_id?: string;

  @IsOptional()
  @IsString()
  customer_type_name?: string;

  @IsOptional()
  @IsMongoId()
  customer_id?: string;

  @IsOptional()
  @IsString()
  customer_code?: string;

  @IsOptional()
  @IsString()
  customer_name?: string;

  @IsOptional()
  @IsString()
  invoice_number?: string;

  @IsOptional()
  @Type(() => Date)
  @IsDate()
  billing_date?: Date;

  @IsOptional()
  @IsNumber()
  total_item_count?: number;

  @IsOptional()
  @IsNumber()
  total_item_quantity?: number;

  @IsOptional()
  @IsNumber()
  gross_amount?: number;

  @IsOptional()
  @IsNumber()
  discount_percent?: number;

  @IsOptional()
  @IsNumber()
  discount_amount?: number;

  @IsOptional()
  @IsNumber()
  net_amount_before_tax?: number;

  @IsOptional()
  @IsNumber()
  gst_percent?: number;

  @IsOptional()
  @IsNumber()
  gst_amount?: number;

  @IsOptional()
  @IsNumber()
  net_amount_with_tax?: number;

  @IsOptional()
  @IsString()
  order_number?: string;

  @IsOptional()
  @IsString()
  grn_status?: string;

  @IsOptional()
  @IsString()
  remarks?: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateInvoiceItemDto)
  invoice_items: CreateInvoiceItemDto[];
}

export class ReadInvoiceDto {
  @ApiPropertyOptional({ type: Object, description: 'Filter options for reading stock audit data' })
  @IsOptional()
  @IsObject()
  filters: object;

  @ApiProperty({ example: 'Reject', description: 'Tab filter: Reject / Verified', required: false })
  @IsOptional()
  @IsString()
  activeTab?: string;

  @ApiPropertyOptional({ type: Object, description: 'Sorting options' })
  @IsOptional()
  @IsObject()
  sorting: object;

  @ApiProperty({
    description: 'Unique identifier for the customer.',
    example: '60ad0f486123456789abcdef',
  })
  @IsOptional()
  @IsMongoId()
  @IsString()
  _id: string;

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

export enum Status {
  Pending = "Pending",
  Received = "Received",
  Reject = "Reject",
}

export class InvoiceStatusDto {

  @IsNotEmpty()
  @IsString()
  _id: string;

  @IsNotEmpty()
  @IsEnum(Status)
  grn_status: Status;

  @IsOptional()
  @IsString()
  remarks: string;
}

export class DetailInvoiceDto {

  @ApiProperty({ example: "60d21b4667d0d8992e610c85", description: "Payment ID", required: true })
  @IsNotEmpty()
  @IsMongoId()
  _id: string;
}
