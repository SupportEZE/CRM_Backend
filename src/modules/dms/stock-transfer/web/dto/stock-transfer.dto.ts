import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsString, IsNumber, IsOptional, Min, IsObject, IsNotEmpty, IsMongoId, ValidateNested, IsEnum, IsArray } from 'class-validator';
export enum Status {
  Pending = "Pending",
  Approved = "Approved",
  Reject = "Reject",
}
export class ReadStockTransferDto {
  @ApiPropertyOptional({ type: Object, description: 'Filter options for reading stock audit data' })
  @IsOptional()
  @IsObject()
  filters: object;

  @ApiProperty({ example: 'Reject', description: 'Tab filter: Reject / Verified', required: false })
  @IsOptional()
  @IsString()
  activeTab?: string;

  @ApiProperty({ example: 'Reject', description: 'Tab filter: Reject / Verified', required: false })
  @IsOptional()
  @IsString()
  customer_id?: string;

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
class SelectedItemDto {
  @IsString()
  @IsNotEmpty()
  label: string;

  @IsString()
  @IsNotEmpty()
  value: string;

  @IsString()
  @IsNotEmpty()
  product_code: string;

  @IsNumber()
  qty: number;
}

export class CreateCustomerToCustomerStockDto {
  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  bill_date?: Date;

  @IsNotEmpty()
  @IsNumber()
  bill_amount: number;

  @IsNotEmpty()
  @IsString()
  bill_number: string;

  @IsOptional()
  @IsString()
  transaction_type: string;

  @IsNotEmpty()
  @IsNumber()
  sender_login_type_id: number;

  @IsNotEmpty()
  @IsMongoId()
  sender_customer_type_id: string;

  @IsNotEmpty()
  @IsMongoId()
  sender_customer_id: string;

  @IsNotEmpty()
  @IsString()
  sender_customer_type_name: string;

  @IsNotEmpty()
  @IsString()
  sender_customer_name: string;

  @IsNotEmpty()
  @IsString()
  receiver_customer_type_name: string;

  @IsNotEmpty()
  @IsNumber()
  receiver_login_type_id: number;

  @IsNotEmpty()
  @IsMongoId()
  receiver_customer_type_id: string;

  @IsNotEmpty()
  @IsMongoId()
  receiver_customer_id: string;

  @IsNotEmpty()
  @IsString()
  receiver_customer_name: string;

  @IsOptional()
  @IsString()
  transfer_id?: string;

  @IsNumber()
  @IsOptional()
  total_item_quantity?: number;

  @IsNumber()
  @IsOptional()
  total_item_count?: number;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SelectedItemDto)
  selectedItems: SelectedItemDto[];
}
export class ReadCustomerToCustomerDto {
  @ApiPropertyOptional({ type: Object, description: 'Filter options for reading stock audit data' })
  @IsOptional()
  @IsObject()
  filters: object;

  @ApiProperty({ example: 'Reject', description: 'Tab filter: Reject / Verified', required: false })
  @IsOptional()
  @IsString()
  mainTab?: string;

  @ApiProperty({ example: 'Reject', description: 'Tab filter: Reject / Verified', required: false })
  @IsOptional()
  @IsString()
  activeTab?: string;

  @IsOptional()
  @IsString()
  _id?: string;

  @IsOptional()
  @IsString()
  sender_id?: string;

  @IsOptional()
  @IsString()
  recevier_id?: string;

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
export class StatusDto {
  @IsNotEmpty()
  @IsString()
  _id: string;

  @IsNotEmpty()
  @IsEnum(Status)
  status: Status;

  @IsOptional()
  @IsString()
  remarks: string;
}
class SelectedItemsDto {
  @IsString()
  @IsNotEmpty()
  label: string;

  @IsString()
  @IsNotEmpty()
  value: string; // product_id

  @IsString()
  @IsNotEmpty()
  product_code: string;

  @IsNumber()
  @IsNotEmpty()
  qty: number;
}
export class CreateCustomerToCompanyReturnDto {
  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  bill_number: string;

  @IsOptional()
  @IsString()
  transaction_type: string;

  @IsOptional()
  @IsString()
  bill_date?: Date;

  @IsOptional()
  @IsNumber()
  bill_amount?: number;

  @IsNotEmpty()
  @IsNumber()
  sender_login_type_id: number;

  @IsNotEmpty()
  @IsMongoId()
  sender_customer_type_id: string;

  @IsNotEmpty()
  @IsMongoId()
  sender_customer_id: string;

  @IsOptional()
  @IsString()
  sender_customer_type_name?: string;

  @IsOptional()
  @IsString()
  sender_customer_name?: string;

  @IsOptional()
  @IsNumber()
  total_item_quantity?: number;

  @IsOptional()
  @IsNumber()
  total_item_count?: number;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SelectedItemsDto)
  selectedItems: SelectedItemsDto[];
}
export class ReadCustomerToCompanyDto {
  @ApiPropertyOptional({ type: Object, description: 'Filter options for reading stock audit data' })
  @IsOptional()
  @IsObject()
  filters: object;

  @ApiProperty({ example: 'Reject', description: 'Tab filter: Reject / Verified', required: false })
  @IsOptional()
  @IsString()
  activeTab?: string;

  @IsOptional()
  @IsString()
  _id?: string;

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
export class StatusCustomerToCompanyDto {

  @IsNotEmpty()
  @IsString()
  _id: string;

  @IsNotEmpty()
  @IsEnum(Status)
  status: Status;

  @IsOptional()
  @IsString()
  remarks: string;

}

export class ReadDropdownDto {
  @ApiPropertyOptional({
    description: 'Filters for dropdowns.',
    type: Object,
    example: { field_name: 'value' },
  })
  @IsOptional()
  @IsObject()
  filters?: object;

  @ApiPropertyOptional({
    description: 'Sorting criteria for dropdowns.',
    type: Object,
    example: { dropdown_name: 1 },
  })
  @IsOptional()
  @IsObject()
  sorting?: object;

  @IsOptional()
  @IsString()
  customer_id?: string;

  @ApiPropertyOptional({
    description: 'Limit for the number of dropdowns per page.',
    type: Number,
    example: 10,
  })
  @IsOptional()
  @IsNumber()
  @Min(10)
  limit?: number;
}