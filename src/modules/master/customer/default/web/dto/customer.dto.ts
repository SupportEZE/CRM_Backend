import { Transform, Type } from 'class-transformer';
import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsEmail,
  IsNumber,
  MaxLength,
  IsArray,
  IsObject,
  Min,
  IsISO8601,
  IsEnum,
  IsMongoId,
  Equals,
  ValidateIf,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { CustomerSource } from '../../models/customer.model';
import { IsNumericObject } from 'src/decorators/numeric-object.dto';

export class CreateCustomerDto {
  @ApiProperty({ description: 'Customer category name', example: 'Plumber' })
  @IsString()
  @IsNotEmpty()
  customer_type_name: string;

  @ApiProperty({
    description: 'Customer category ID (Mongo ObjectId)',
    example: '67df1b308874ae98cdaea1b',
  })
  @IsMongoId()
  @IsNotEmpty()
  customer_type_id: string;

  @ApiProperty({
    description: 'Full name of the customer',
    example: 'John Doe',
  })
  @IsString()
  @IsNotEmpty()
  customer_name: string;

  @ApiPropertyOptional({
    description: 'Full company name of the customer',
    example: 'ABC Pvt. Ltd.',
  })
  @IsOptional()
  @IsString()
  company_name: string;

  @ApiPropertyOptional({
    description: 'Unique customer code',
    example: 'CUST123',
  })
  @IsOptional()
  @IsString()
  customer_code?: string;

  @ApiProperty({ description: 'Primary mobile number', example: '9876543210' })
  @IsString()
  @IsNotEmpty()
  mobile: string;

  @ApiPropertyOptional({ description: 'Email', example: 'xyz@gmail.com' })
  @IsString()
  @IsOptional()
  email: string;

  @ApiPropertyOptional({
    description: 'Alternate mobile number',
    example: '9876543211',
  })
  @IsOptional()
  @IsString()
  alt_mobile_no: string;

  @ApiProperty({ example: 'India' })
  @IsString()
  @IsNotEmpty()
  country: string;

  @ApiProperty({ example: 'Karnataka' })
  @IsString()
  @IsNotEmpty()
  state: string;

  @ApiProperty({ example: 'Bangalore' })
  @IsString()
  @IsOptional()
  city: string;

  @ApiProperty({ example: 560001 })
  @IsNumber()
  @IsNotEmpty()
  pincode: Number;

  @ApiProperty({ example: '123 Main Street, Bangalore' })
  @IsString()
  @IsOptional()
  address: string;

  @ApiProperty({ example: '123 Main Street, Bangalore' })
  @IsString()
  @IsOptional()
  district: string;

  @ApiPropertyOptional({ description: 'Additional form data', type: Object })
  @IsOptional()
  @IsObject()
  form_data?: Record<string, any>;

  @ApiPropertyOptional({ description: 'Source of customer creation' })
  @IsOptional()
  source?: CustomerSource = CustomerSource.WEB;

  @ApiPropertyOptional({
    description: 'D.O.B',
    type: Date,
    example: '2025-04-01T00:00:00Z',
  })
  @IsOptional()
  @IsISO8601()
  dob?: Date;

  @ApiPropertyOptional({
    description: 'D.O.A',
    type: Date,
    example: '2025-04-01T00:00:00Z',
  })
  @IsOptional()
  @IsISO8601()
  doa?: Date;

  @ApiProperty({ description: 'Customer type name', example: 'Plumber' })
  @IsString()
  @IsOptional()
  influencer_type: string;

  @ApiProperty({ description: 'Customer type name', example: 'Plumber' })
  @IsString()
  @IsOptional()
  referral_code: string;
}

export class ReadCustomerDto {
  @ApiProperty({
    example: 'Pending',
    description: 'Active tab indicating the type of customers to fetch',
  })
  @IsString()
  active_tab: string;

  @ApiPropertyOptional({
    type: Object,
    example: { field_name: 'value' },
    description: 'Filter criteria for fetching customers',
  })
  @IsOptional()
  @IsObject()
  filters?: Record<string, any>;

  @ApiPropertyOptional({
    type: Object,
    example: { customer_name: 1 },
    description: 'Sorting criteria in key-direction format',
  })
  @IsOptional()
  @IsObject()
  sorting?: Record<string, 'asc' | 'desc'>;

  @ApiProperty({
    example: 1,
    description: 'Current page number (min: 1)',
  })
  @Transform(({ value }) => parseInt(value))
  @IsNumber()
  @Min(1)
  page?: number;

  @ApiPropertyOptional({
    example: 10,
    description: 'Items per page (min: 10)',
  })
  @IsOptional()
  @Transform(({ value }) => parseInt(value))
  @IsNumber()
  @Min(10)
  limit?: number;

  @ApiProperty({
    example: 10,
    description: 'Login type name to filter customers',
  })
  @IsNotEmpty()
  @IsNumber()
  login_type_id?: number;

  @ApiProperty({
    example: '609e126f61e3e53b7c2d672c',
    description: 'Customer type id to filter customers',
  })
  @IsMongoId()
  @IsNotEmpty()
  @IsString()
  customer_type_id?: string;
}

export class DeleteCustomerDto {
  @ApiProperty({
    description: 'MongoDB ObjectId of the customer to delete',
    example: '609e126f61e3e53b7c2d672c',
  })
  @IsNotEmpty()
  @IsMongoId()
  _id: string;

  @ApiProperty({
    description: 'Flag to indicate soft deletion, must be set to 1',
    example: 1,
  })
  @IsNotEmpty()
  @IsNumber()
  @Equals(1)
  is_delete: number;
}
export class UpdateCustomerProfileStatusDto {
  @ApiPropertyOptional({
    description: 'Array of Customer Ids or single Id as string.',
    example: [
      "67c9904bd2ede5ebd2647e24",
      "67c9906ad2ede5ebd2647e25"
    ],
    type: [String],
  })
  @IsOptional()
  @Transform(({ value }) => Array.isArray(value) ? value : [value])
  @IsArray()
  @IsString({ each: true })
  _id?: string[];


  @ApiPropertyOptional({
    description: 'Status of the customer profile',
    example: 'Active',
  })
  @IsNotEmpty()
  @IsOptional()
  @IsString()
  profile_status: string;

  @ApiPropertyOptional({
    description: 'Status of the customer profile',
    example: 'Active',
  })
  @IsOptional()
  @IsString()
  profile_status_remark: string;

  @ApiPropertyOptional({
    description: 'Status of the customer profile',
    example: 'Active',
  })
  @IsOptional()
  @IsString()
  approved_type: string;


  @ApiPropertyOptional({
    description: 'Refferal Code',
    example: 'Active',
  })
  @IsOptional()
  @IsString()
  referral_code: string;
}

export class UpdateCustomerStatusDto {
  @ApiProperty({
    description: 'MongoDB ObjectId of the customer to update',
    example: '609e126f61e3e53b7c2d672c',
  })
  @IsNotEmpty()
  @IsMongoId()
  _id: string;

  @ApiPropertyOptional({
    description: 'Status of the customer profile',
    example: 'Active',
  })
  @IsNotEmpty()
  @IsOptional()
  @IsString()
  status: string;
}

export class UpdateCustomerDto {
  @ApiProperty({
    example: '609e126f61e3e53b7c2d672c',
    description: 'Unique customer identifier (MongoDB ObjectId)',
  })
  @IsNotEmpty()
  @IsMongoId()
  @IsString()
  _id: string;

  @ApiProperty({
    example: 'John Doe',
    description: 'Full name of the customer',
  })
  @IsString()
  @IsOptional()
  @MaxLength(100)
  customer_name: string;

  @ApiProperty({
    example: 'CUST123',
    description: 'Unique code assigned to the customer',
  })
  @IsOptional()
  @IsString()
  customer_code: string;

  @ApiProperty({ example: '9876543210', description: 'Customer mobile number' })
  @IsNotEmpty()
  @IsString()
  mobile: string;

  @ApiProperty({ example: 'India', description: 'Customer country' })
  @IsNotEmpty()
  @IsString()
  country: string;

  @ApiProperty({ example: 'Karnataka', description: 'Customer state' })
  @IsNotEmpty()
  @IsString()
  state: string;

  @ApiProperty({
    example: 'Bangalore',
    description: 'Customer district or city',
  })
  @IsNotEmpty()
  @IsString()
  district: string;

  @ApiProperty({
    example: 560001,
    description: 'Postal pincode of the customer location',
  })
  @IsNotEmpty()
  @IsNumber()
  pincode: number;

  @ApiProperty({
    example: '123 Main Street',
    description: 'Street address of the customer',
  })
  @IsNotEmpty()
  @IsString()
  address: string;

  @ApiPropertyOptional({
    type: Object,
    description: 'Additional dynamic form data as key-value pairs',
  })
  @IsOptional()
  @IsObject()
  form_data?: Record<string, any>;
}

export class CustomerDetailDto {
  @ApiProperty({
    example: '609e126f61e3e53b7c2d672c',
    description: 'Customer identifier (MongoDB ObjectId)',
  })
  @IsNotEmpty()
  @IsMongoId()
  @IsString()
  _id: string;
}
export class DuplicacyChecktDto {
  @ApiPropertyOptional({
    example: '9876543210',
    description: 'Customer mobile number',
  })
  @IsOptional()
  @IsString()
  mobile: string;

  @ApiPropertyOptional({
    example: 'johndoe@example.com',
    description: 'Email address of the customer',
  })
  @IsOptional()
  @IsEmail()
  email: string;

  @ApiPropertyOptional({
    example: 'john@upi',
    description: 'Customer UPI ID for payments',
  })
  @IsOptional()
  @IsString()
  upi_id: string;

  @ApiPropertyOptional({
    example: '123456789012',
    description: 'Bank account number of the customer',
  })
  @IsOptional()
  @IsString()
  account_no: string;

  @ApiPropertyOptional({
    example: 'CUST123',
    description: 'Unique code to identify customer',
  })
  @IsOptional()
  @IsString()
  customer_code: string;

  @ApiPropertyOptional({
    example: 'ABCD123456',
    description: 'Document number (e.g., ID proof)',
  })
  @IsOptional()
  @IsString()
  doc_number: string;
}

export class BankInfoDto {
  @ApiPropertyOptional({
    example: '609e126f61e3e53b7c2d672c',
    description: 'Associated customer ID (MongoDB ObjectId)',
  })
  @IsNotEmpty()
  @IsMongoId()
  @IsString()
  customer_id?: string;

  @ApiPropertyOptional({
    example: '123456789012',
    description: 'Bank account number',
  })
  @IsOptional()
  @IsNotEmpty()
  @IsString()
  account_no?: string;

  @ApiPropertyOptional({
    example: 'John Doe',
    description: 'Name of the account holder',
  })
  @IsOptional()
  @IsNotEmpty()
  @IsString()
  beneficiary_name?: string;

  @ApiPropertyOptional({ example: 'MG Road', description: 'Bank branch name' })
  @IsOptional()
  @IsNotEmpty()
  @IsString()
  branch_name?: string;

  @ApiPropertyOptional({
    example: 'HDFC Bank',
    description: 'Name of the bank',
  })
  @IsOptional()
  @IsNotEmpty()
  @IsString()
  bank_name?: string;

  @ApiPropertyOptional({
    example: 'HDFC0001234',
    description: 'IFSC code of the bank branch',
  })
  @IsOptional()
  @IsNotEmpty()
  @IsString()
  ifsc_code?: string;

  @ApiPropertyOptional({
    example: 'john@upi',
    description: 'UPI ID for receiving payments',
  })
  @IsOptional()
  @IsString()
  upi_id?: string;
}

export class SaveOtherInfoDto {
  @ApiPropertyOptional({
    example: '609e126f61e3e53b7c2d672c',
    description: 'Customer identifier',
  })
  @IsNotEmpty()
  @IsMongoId()
  @IsString()
  customer_id?: string;

  @ApiPropertyOptional({
    example: '123456789012',
    description: 'GST identification number',
  })
  @IsOptional()
  @IsString()
  gst_number?: string;

  @ApiPropertyOptional({
    example: 30,
    description: 'Number of credit days allowed',
  })
  @IsOptional()
  @IsNumber()
  credit_days?: number;

  @ApiPropertyOptional({
    example: 20000,
    description: 'Credit limit allowed for the customer',
  })
  @IsOptional()
  @IsNumber()
  credit_limit?: number;

  @ApiPropertyOptional({
    example: 2000.23,
    description: 'Latitude coordinate of customer location',
  })
  @IsOptional()
  @IsNumber()
  lat?: number;

  @ApiPropertyOptional({
    example: 2000.23,
    description: 'Longitude coordinate of customer location',
  })
  @IsOptional()
  @IsNumber()
  long?: number;

  @ApiPropertyOptional({
    example: '609e126f61e3e53b7c2d672c',
    description: 'Beat code identifier',
  })
  @IsOptional()
  @IsMongoId()
  beat_code_id?: string;

  @ApiPropertyOptional({ example: 'BT-2025', description: 'Beat code string' })
  @IsOptional()
  @IsString()
  beat_code?: string;

  @ApiPropertyOptional({
    example: 'Beat area covering zone 3',
    description: 'Beat code description',
  })
  @IsOptional()
  @IsString()
  beat_code_desc?: string;
}

export class readDropdown {
  @ApiPropertyOptional({
    example: ['609e126f61e3e53b7c2d672c'],
    description: 'Customer type identifier(s) - string or array of strings',
    type: [String],
  })
  @IsOptional()
  @ValidateIf((o) => Array.isArray(o.customer_type_id))
  @IsArray()
  @IsString({ each: true })
  customer_type_id: string[] | string;

  @ApiPropertyOptional({
    example: "User Id",
  })
  @IsOptional()
  user_id: string;

  @ApiProperty({ example: 0, description: '' })
  @IsOptional()
  @IsNumber()
  login_type_id: number;

  @ApiProperty({
    example: 'sunil sir',
    description: 'Search key to filter dropdown list',
  })
  @IsOptional()
  @IsString()
  search: string;
}

export enum KycStatus {
  PENDING = 'Pending',
  VERIFIED = 'Verified',
  REJECT = 'Reject',
}

export class saveKycStatusDto {
  @ApiProperty({
    example: '609e126f61e3e53b7c2d672c',
    description: 'Customer identifier for KYC update',
  })
  @IsNotEmpty()
  @IsMongoId()
  @IsString()
  customer_id: string;

  @ApiProperty({
    example: KycStatus.PENDING,
    enum: KycStatus,
    description: 'KYC status to update',
  })
  @IsNotEmpty()
  @IsEnum(KycStatus)
  kyc_status: KycStatus;

  @ApiProperty({
    example: 'Reason for rejection',
    required: false,
    description: 'Remark provided when KYC is rejected',
  })
  @ValidateIf((o) => o.kyc_status === KycStatus.REJECT)
  @IsNotEmpty()
  @IsString()
  status_remark: string;
}

export class UpdateDocDto {
  @ApiProperty({
    example: '609e126f61e3e53b7c2d672c',
    description: 'Document ID or associated record ID',
  })
  @IsNotEmpty()
  @IsMongoId()
  @IsString()
  _id: string;

  @ApiProperty({
    example: 'XYYZ22',
    description: 'Document number or identifier',
  })
  @IsNotEmpty()
  @IsString()
  doc_no: string;
}

export class CustomerSaveDiscountDto {
  @ApiPropertyOptional({ type: String, description: 'Type of discount' })
  @IsOptional()
  @IsString()
  discount_type?: string;

  @ApiProperty({
    type: String,
    description: 'Discount ID (Mongo ObjectId) product/category id',
  })
  @IsMongoId()
  discount_id: string;

  @ApiProperty({
    type: String,
    description: 'Discount Name  product/category name',
  })
  @IsString()
  discount_name: string;

  @ApiPropertyOptional({ type: String, description: 'Customer Id' })
  @IsNotEmpty()
  @IsMongoId()
  customer_id?: string;

  @ApiPropertyOptional({ type: String, description: 'Customer type name' })
  @IsNotEmpty()
  @IsString()
  customer_type_name?: string;

  @ApiPropertyOptional({ type: String, description: 'Customer type ID' })
  @IsNotEmpty()
  @IsMongoId()
  customer_type_id?: string;

  @ApiProperty({ type: Object, description: 'Form data in key-value format' })
  @IsNumericObject()
  @IsNotEmpty()
  form_data: Record<string, any>;
}

export class CustomerReadDiscountDto {
  @ApiPropertyOptional({ type: String, description: 'Customer Id' })
  @IsNotEmpty()
  @IsMongoId()
  customer_id?: string;

  @ApiPropertyOptional({ type: String, description: 'Customer type ID' })
  @IsNotEmpty()
  @IsMongoId()
  customer_type_id?: string;

  @ApiPropertyOptional({
    description: 'Filter criteria for reading products.',
    type: Object,
    example: { field_name: 'value' },
  })
  @IsOptional()
  @IsObject()
  filters?: object;

  @ApiPropertyOptional({
    description: 'Sorting criteria for reading products.',
    type: Object,
    example: { product_name: 1 },
  })
  @IsOptional()
  @IsObject()
  sorting?: object;

  @ApiPropertyOptional({
    description: 'Page number for pagination.',
    type: Number,
    example: 1,
  })
  @IsNumber()
  @Min(1)
  page?: number;

  @ApiPropertyOptional({
    description: 'Limit for the number of products per page.',
    type: Number,
    example: 10,
  })
  @IsOptional()
  @IsNumber()
  @Min(10)
  limit?: number;
}

export class DeleteCustomerFIleDto {
  @ApiProperty({
    description: 'Unique ID of the product.',
    example: '61324abcdef1234567890abc',
  })
  @IsNotEmpty()
  @IsMongoId()
  @IsString()
  _id: string;
}

export class CreateMarkaDto {
  @ApiProperty({
    example: '609e126f61e3e53b7c2d672c',
    description: 'Customer ID to which this contact person belongs',
  })
  @IsNotEmpty()
  @IsMongoId()
  @IsString()
  customer_id: string;

  @ApiPropertyOptional({
    example: 'Manager',
    description: 'Designation or title of the contact person',
  })
  @IsOptional()
  @IsString()
  marka?: string;
}

export class UpdateMarkaDto {
  @ApiProperty({
    example: '609e126f61e3e53b7c2d672c',
    description: 'Unique ID of the contact person record',
  })
  @IsNotEmpty()
  @IsMongoId()
  @IsString()
  _id: string;

  @ApiPropertyOptional({
    example: 'Team Lead',
    description: 'Designation or job title of the contact person',
  })
  @IsOptional()
  @IsString()
  marka?: string;
}

export class DeleteMarkaDto {
  @ApiProperty({
    example: '609e126f61e3e53b7c2d672c',
    description: 'Contact person ID to be deleted',
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

export class UploadCustomerDto {
  @ApiProperty({
    example: '609e126f61e3e53b7c2d672c',
    description: 'login_type_id',
  })
  @IsNotEmpty()
  @IsMongoId()
  @IsString()
  _id: string;

  @ApiProperty({ example: '14', description: 'provide form id' })
  @IsNotEmpty()
  @IsString()
  form_id: string;

  @ApiProperty({ example: 'Direct Dealder', description: 'Provide customer_type_name' })
  @IsNotEmpty()
  @IsString()
  customer_type_name: string;
}
export class ReadInfluenceDropdownDto {
  @IsOptional()
  @IsObject()
  filters: object;

  @IsNotEmpty()
  @IsNumber()
  @Min(1)
  module_id: number;

  @IsNotEmpty()
  @IsString()
  dropdown_name: string;

  @IsOptional()
  @IsString()
  dropdown_option: string;
}
export class UpdateCustomerStageDto {
  @IsNotEmpty({ message: 'Customer ID is required' })
  @IsMongoId({ message: 'Invalid customer ID format' })
  _id: string;

  @IsNotEmpty({ message: 'Stage (status) is required' })
  @IsString({ message: 'Stage must be a string' })
  status: string;
}
export class ReadCustomerByMobileDto {
  @ApiProperty({
    description: 'MongoDB ObjectId of the customer to delete',
    example: '9898989898',
  })
  @IsNotEmpty()
  @IsOptional()
  mobile: string;
}

export class ReadCustomerProfileStatusDto {
  @ApiProperty({
    description: 'MongoDB ObjectId of the customer to delete',
    example: '10',
  })
  @IsNotEmpty()
  @IsNumber()
  login_type_id: string;
}
