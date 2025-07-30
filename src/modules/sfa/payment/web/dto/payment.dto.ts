import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsString, IsNumber, IsOptional, Min, IsObject, IsNotEmpty, IsMongoId, ValidateNested, IsEnum, ValidateIf, IsArray } from 'class-validator';

export class CreatePaymentDto {

  @ApiProperty()
  @IsNumber()
  @IsNotEmpty()
  collected_from_login_type_id: number;

  @ApiProperty({ description: 'Customer ID as Mongo ObjectId' })
  @IsMongoId()
  @IsNotEmpty()
  customer_type_id: string;

  @ApiProperty({ type: String, description: 'Customer Type Name' })
  @IsString()
  @IsNotEmpty()
  customer_type_name: string;

  @ApiProperty()
  @IsMongoId()
  @IsNotEmpty()
  collected_from_id: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  collected_from_name: string;

  @ApiProperty()
  @ValidateIf(o => o.collected_from_login_type_id === 7)
  @IsNumber()
  @IsNotEmpty()
  payment_to_login_type_id: number;

  @ApiProperty()
  @ValidateIf(o => o.collected_from_login_type_id === 7)
  @IsMongoId()
  @IsNotEmpty()
  payment_to_id: string;

  @ApiProperty()
  @ValidateIf(o => o.collected_from_login_type_id === 7)
  @IsString()
  @IsNotEmpty()
  payment_to_name: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  payment_date?: Date;

  @ApiProperty()
  @IsNumber()
  @IsNotEmpty()
  amount: number;

  @ApiProperty({ enum: ['Cash', 'Cheque', 'Online'] })
  @IsEnum(['Cash', 'Cheque', 'Online'])
  @IsNotEmpty()
  payment_mode: string;

  @ValidateIf((o) => o.payment_mode === 'Cheque' || o.payment_mode === 'Online')
  @IsString()
  @IsNotEmpty({ message: 'transaction_id is required when payment_mode is cheque or online' })
  transaction_id?: string;
}

export class ReadPaymentDto {
  @ApiPropertyOptional({ type: Object, description: 'Filter options for reading stock audit data' })
  @IsOptional()
  @IsObject()
  filters: object;

  @ApiProperty({ example: 'Reject', description: 'Tab filter: Reject / Verified', required: false })
  @IsNotEmpty()
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
class CustomerIdDto {
  @ApiProperty({ example: "60d21b4667d0d8992e610c85" })
  @IsNotEmpty()
  @IsString()
  _id: string;
}

export class UpdatePaymentStatusDto {
  @ApiProperty({ example: "Verified", description: "New status of the payment", required: true })
  @IsNotEmpty()
  @IsString()
  status: string;

  @ApiProperty({ description: 'Optional reason for status update' })
  @IsOptional()
  @IsString()
  reason?: string;

  @ApiProperty({ type: [CustomerIdDto], description: 'List of customers to update' })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CustomerIdDto)
  customers: CustomerIdDto[];
}

export class DetailPaymentDto {

  @ApiProperty({ example: "60d21b4667d0d8992e610c85", description: "Payment ID", required: true })
  @IsNotEmpty()
  @IsMongoId()
  _id: string;
}

export class PaymentDocsDto {
  @ApiProperty({
    description: 'Unique identifier for the payment',
    example: '609e126f61e3e53b7c2d672c',
  })
  @IsMongoId()
  @IsNotEmpty()
  _id: string;
}
