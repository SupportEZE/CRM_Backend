import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsEmail,
  IsDate,
  IsNumber,
  MaxLength,
  IsArray,
  IsObject,
  Min,
  IsEnum,
  IsPhoneNumber,
  IsMongoId,
  Equals,
  ValidateNested,
  ArrayMinSize,
} from 'class-validator';

export enum Status {
  Active = 'Active',
  Inactive = 'Inactive',
}

export class SaveUserToCustomerMappingDto {
  @ApiProperty({ example: 'Retailer', description: 'Child customer type name' })
  @IsString()
  @IsNotEmpty()
  customer_type_name: string;

  @ApiProperty({
    example: 'Retailer',
    description: 'Type name of the customer',
  })
  @IsNotEmpty()
  @IsMongoId()
  customer_type_id: string;

  @ApiProperty({
    example: '67deb5adf89a24a4fd9ab6ab',
    description: 'Child customer ID (MongoDB ObjectId)',
  })
  @IsMongoId()
  @IsNotEmpty()
  customer_id: string;

  @ApiProperty({ example: 'Rahul', description: 'Child customer name' })
  @IsString()
  @IsNotEmpty()
  customer_name: string;

  @ApiPropertyOptional({
    type: Object,
    description: '',
  })
  @IsOptional()
  @IsArray()
  user_array?: Record<string, any>;
}

export class ReadCustomerDto {
  @ApiPropertyOptional({
    example: { field_name: 'value' },
    description: 'Filters to apply while fetching customers',
  })
  @IsOptional()
  @IsObject()
  filters: object;

  @ApiPropertyOptional({
    example: { customer_name: -1 },
    description: 'Sorting options for customer list',
  })
  @IsOptional()
  @IsObject()
  sorting: object;

  @ApiProperty({
    example: 1,
    description: 'Page number for pagination (minimum 1)',
  })
  @IsNotEmpty()
  @IsNumber()
  @Min(1)
  page: number;

  @ApiPropertyOptional({
    example: 10,
    description: 'Number of records per page (minimum 10)',
  })
  @IsOptional()
  @IsNumber()
  @Min(10)
  limit: number;
}

export class DeleteCustomerDto {
  @ApiProperty({
    example: '609e126f61e3e53b7c2d672c',
    description: 'Customer ID to delete',
  })
  @IsNotEmpty()
  @IsMongoId()
  @IsString()
  _id: string;

  @ApiProperty({ example: 1, description: 'Must be 1 to confirm soft delete' })
  @IsNotEmpty()
  @IsNumber()
  @Equals(1)
  is_delete: number;
}

export class UpdateCustomerStatusDto {
  @ApiProperty({
    example: '609e126f61e3e53b7c2d672c',
    description: 'Customer ID whose status is to be updated',
  })
  @IsNotEmpty()
  @IsMongoId()
  @IsString()
  _id: string;

  @ApiProperty({
    example: 'Active',
    enum: Status,
    description: 'New status for the customer',
  })
  @IsNotEmpty()
  @IsString()
  @IsEnum(Status)
  status: Status;
}

export class UpdateCustomerDto {
  @ApiProperty({
    example: '609e126f61e3e53b7c2d672c',
    description: 'Customer ID to update',
  })
  @IsNotEmpty()
  @IsString()
  _id: string;

  @ApiProperty({ example: 2, description: 'Login type ID (numeric)' })
  @IsNotEmpty()
  @IsNumber()
  login_type_id: number;

  @ApiProperty({ example: 'Admin', description: 'Login type name' })
  @IsNotEmpty()
  @IsString()
  login_type_name: string;

  @ApiProperty({
    example: '60a8c5c5d3c89a2f74c1d5c2',
    description: 'User role ID',
  })
  @IsNotEmpty()
  @IsMongoId()
  @IsString()
  user_role_id: string;

  @ApiProperty({ example: 'User', description: 'User role name' })
  @IsString()
  @IsNotEmpty()
  user_role_name: string;

  @ApiProperty({
    example: '609e126f61e3e53b7c2d672c',
    description: 'Customer type ID',
  })
  @IsMongoId()
  @IsString()
  customer_type_id: string;

  @ApiProperty({ example: 'Retail', description: 'Customer type name' })
  @IsString()
  @IsNotEmpty()
  customer_type_name: string;

  @ApiProperty({
    example: 'John Doe',
    description: 'Full name of the customer',
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  customer_name: string;

  @ApiPropertyOptional({
    example: 'CUST123',
    description: 'Unique customer code',
  })
  @IsOptional()
  @IsString()
  customer_code: string;

  @ApiProperty({
    example: '9876543210',
    description: 'Mobile number of the customer',
  })
  @IsNotEmpty()
  @IsString()
  mobile: string;

  @ApiProperty({ example: 'India', description: 'Country name' })
  @IsString()
  @IsNotEmpty()
  country: string;

  @ApiProperty({ example: 'Karnataka', description: 'State name' })
  @IsString()
  @IsNotEmpty()
  state: string;

  @ApiProperty({ example: 'Bangalore', description: 'District name' })
  @IsNotEmpty()
  @IsString()
  district: string;

  @ApiProperty({ example: 560001, description: 'Area pincode' })
  @IsNotEmpty()
  @IsNumber()
  pincode: number;

  @ApiProperty({ example: '123 Main Street', description: 'Full address' })
  @IsNotEmpty()
  @IsString()
  address: string;

  @ApiPropertyOptional({
    type: Object,
    description: 'Custom form data as key-value pairs',
  })
  @IsOptional()
  @IsObject()
  form_data?: Record<string, any>;
}

export class CustomerDetailDto {
  @ApiProperty({
    example: '609e126f61e3e53b7c2d672c',
    description: 'Customer ID to fetch details for',
  })
  @IsNotEmpty()
  @IsString()
  @IsMongoId()
  _id: string;
}

export class DuplicacyChecktDto {
  @ApiPropertyOptional({
    example: '9876543210',
    description: 'Mobile number to check for duplicates',
  })
  @IsString()
  @IsOptional()
  mobile: string;

  @ApiPropertyOptional({
    example: 'johndoe@example.com',
    description: 'Email address to check for duplicates',
  })
  @IsEmail()
  @IsOptional()
  email: string;

  @ApiPropertyOptional({
    example: 'john@upi',
    description: 'UPI ID to check for duplicates',
  })
  @IsString()
  @IsOptional()
  upi_id: string;

  @ApiPropertyOptional({
    example: 123456789012,
    description: 'Bank account number to check for duplicates',
  })
  @IsNumber()
  @IsOptional()
  account_number: number;
}

export class ParentCustomerDto {
  @ApiProperty({
    example: '67deb5adf89a24a4fd9ab6a8',
    description: 'Parent customer ID (MongoDB ObjectId)',
  })
  @IsMongoId()
  @IsNotEmpty()
  value: string;

  @ApiProperty({ example: 'Rahul Co & Company', description: '' })
  @IsString()
  @IsNotEmpty()
  label: string;

  @ApiProperty({
    example: 'Distributor',
    description: 'Parent customer type name',
  })
  @IsString()
  @IsNotEmpty()
  customer_type_name: string;

  @ApiProperty({
    example: '67deb5adf89a24a4fd9ab6a9',
    description: 'Parent customer type ID (MongoDB ObjectId)',
  })
  @IsMongoId()
  @IsNotEmpty()
  customer_type_id: string;
}

export class AssignCustomerMapping {
  @ApiProperty({ example: 'Retailer', description: 'Child customer type name' })
  @IsString()
  @IsNotEmpty()
  child_customer_type_name: string;

  @ApiProperty({
    example: '67deb5adf89a24a4fd9ab6aa',
    description: 'Child customer type ID (MongoDB ObjectId)',
  })
  @IsMongoId()
  @IsNotEmpty()
  child_customer_type_id: string;

  @ApiProperty({
    example: '67deb5adf89a24a4fd9ab6ab',
    description: 'Child customer ID (MongoDB ObjectId)',
  })
  @IsMongoId()
  @IsNotEmpty()
  child_customer_id: string;

  @ApiProperty({ example: 'Rahul', description: 'Child customer name' })
  @IsString()
  @IsNotEmpty()
  child_customer_name: string;

  @ApiProperty({
    type: [ParentCustomerDto],
    description: 'List of parent customer mappings',
  })
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => ParentCustomerDto)
  parent_customer_array: ParentCustomerDto[];
}

export class readCustomerToCustomerMappingDto {
  @ApiProperty({
    example: '609e126f61e3e53b7c2d672c',
    description: 'Customer type identifier',
  })
  @IsNotEmpty()
  @IsMongoId()
  @IsString()
  customer_id: string;

  @ApiProperty({
    example: 'sunil sir',
    description: 'Search key to filter dropdown list',
  })
  @IsOptional()
  @IsString()
  search_key: string;
}

export class AssignedStateDto {
  @ApiProperty({
    example: '609e126f61e3e53b7c2d672c',
    description: 'Customer type identifier',
  })
  @IsNotEmpty()
  @IsMongoId()
  @IsString()
  customer_id: string;

  @ApiProperty({
    description: 'List of states',
    example: ['DELHI', 'GOA'],
  })
  @IsArray()
  @ArrayMinSize(1)
  @IsString({ each: true })
  state: string[];

  @ApiProperty({
    description: 'List of districts',
    example: ['NORTH GOA', 'WEST'],
  })
  @IsArray()
  @ArrayMinSize(1)
  @IsString({ each: true })
  district: string[];
}
