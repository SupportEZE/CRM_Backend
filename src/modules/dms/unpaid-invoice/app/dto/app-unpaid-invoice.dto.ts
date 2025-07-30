import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsString, IsNumber, IsOptional, Min, IsObject, IsNotEmpty, IsMongoId, ValidateNested, IsEnum, ValidateIf } from 'class-validator';

export class ReadUnpaidInvoiceDto {
  @ApiPropertyOptional({ type: Object, description: 'Filter options for reading stock audit data' })
  @IsOptional()
  @IsObject()
  filters: object;
}