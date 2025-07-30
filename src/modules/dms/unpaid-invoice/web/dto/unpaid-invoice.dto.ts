import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsString, IsNumber, IsOptional, Min, IsObject, IsNotEmpty, IsMongoId, ValidateNested, IsEnum, ValidateIf, IsArray, IsDate } from 'class-validator';

export class ReadUnpaidInvoiceDto {
  @ApiPropertyOptional({ type: Object, description: 'Filter options for reading stock audit data' })
  @IsOptional()
  @IsObject()
  filters: object;

  @ApiProperty({
    description: 'Unique identifier for the Customer.',
    example: '60ad0f486123456789abcdef',
  })
  @IsOptional()
  @IsMongoId()
  @IsString()
  customer_id: string;
}
