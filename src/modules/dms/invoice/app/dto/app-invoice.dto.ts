import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsString, IsNumber, IsOptional, Min, IsObject, IsNotEmpty, IsMongoId, ValidateNested, IsEnum, ValidateIf } from 'class-validator';

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

export class DetailInvoiceDto {
  
  @ApiProperty({ example: "60d21b4667d0d8992e610c85", description: "Payment ID", required: true })
  @IsNotEmpty()
  @IsMongoId()
  _id: string;

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