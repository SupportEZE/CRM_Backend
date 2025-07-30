import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsString, IsNumber, IsOptional, Min, IsObject, IsNotEmpty, IsMongoId, ValidateNested, IsEnum, ValidateIf } from 'class-validator';

export class AppCreatePaymentDto {

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
  @IsNumber()
  @IsNotEmpty()
  amount: number;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  payment_date?: Date;

  @ApiProperty({ enum: ['Cash', 'Cheque', 'Online'] })
  @IsEnum(['Cash', 'Cheque', 'Online'])
  @IsNotEmpty()
  payment_mode: string;

  @ValidateIf((o) => o.payment_mode === 'Cheque' || o.payment_mode === 'Online')
  @IsString()
  @IsNotEmpty({ message: 'transaction_id is required when payment_mode is cheque or online' })
  transaction_id?: string;

  @ApiPropertyOptional({ description: 'chekin-id' })
  @IsMongoId()
  @IsOptional()
  visit_activity_id: string;
}

export class AppReadPaymentDto {
  @ApiPropertyOptional({ description: 'Filters for querying stock audits', type: Object })
  @IsOptional()
  @IsObject()
  filters: object;

  @ApiProperty({ example: 'Reject', description: 'Tab filter: Reject / Verified', required: false })
  @IsNotEmpty()
  @IsString()
  activeTab?: string;

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

export class AppDetailPaymentDto {

  @ApiProperty({
    description: 'MongoDB ObjectId of the payment',
    required: true,
    example: '603d2149e1c1f001540b7a7d',
  })
  @IsNotEmpty()
  @IsMongoId()
  _id: string;
}

export class AppUpdatePaymentDto {
  @ApiProperty({ description: 'The ID of the payment', example: 'abc123' })
  @IsString()
  @IsMongoId()
  @IsNotEmpty()
  _id: string;

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
  @IsNumber()
  @IsNotEmpty()
  amount: number;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  payment_date?: Date;

  @ApiProperty({ enum: ['Cash', 'Cheque', 'Online'] })
  @IsEnum(['Cash', 'Cheque', 'Online'])
  @IsNotEmpty()
  payment_mode: string;

  @ValidateIf((o) => o.payment_mode === 'Cheque' || o.payment_mode === 'Online')
  @IsString()
  @IsNotEmpty({ message: 'transaction_id is required when payment_mode is cheque or online' })
  transaction_id?: string;

}

export class DeletePaymentDto {
  @ApiProperty({
    description: 'The unique identifier of the gift gallery to be deleted',
    example: '64a15b4f0e3f1b0001a7c12b',
  })
  @IsNotEmpty()
  @IsMongoId()
  @IsString()
  _id: string;
}

export class AppPaymentDocsDto {
  @ApiProperty({
    description: 'Unique identifier for the payment',
    example: '609e126f61e3e53b7c2d672c',
  })
  @IsMongoId()
  @IsNotEmpty()
  _id: string;
}