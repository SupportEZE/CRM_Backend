import { Type } from 'class-transformer';
import {
  IsString,
  IsNotEmpty,
  IsNumber,
  MaxLength,
  IsMongoId,
  IsEnum,
  ValidateIf,
  Matches,
  IsArray,
  IsOptional,
  IsObject,
  ValidateNested,
  Min,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { CustomerSource } from '../../../default/models/customer.model';

export enum DocType {
  AADHAR_CARD = 'Aadhar Card',
  PAN_CARD = 'Pan Card',
  DRIVING_LICENSE = 'Driving License',
}

/** -------------------------
 *  Section 4: Additional Form Data
 *  ------------------------- */
export class FormDataDto {
  @ApiPropertyOptional({
    example: 'ABC Dealers',
    description: 'Name of the dealer (optional).',
  })
  @IsOptional()
  @IsString()
  dealer_name: string;

  @ApiPropertyOptional({
    example: '9876543210',
    description: "Dealer's mobile number (optional).",
  })
  @IsOptional()
  @IsString()
  dealer_mobile: string;

  @ApiPropertyOptional({
    example: 'XYZ Traders',
    description: 'Name of the distributor (optional).',
  })
  @IsOptional()
  @IsString()
  distributor_name: string;

  @ApiPropertyOptional({
    example: 'REF12345',
    description: 'Referral code used for tracking (optional).',
  })
  @IsOptional()
  @IsString()
  referral_code: string;
}

// DTO for individual document file entries
class DocFileDto {
  @ApiProperty({ example: 'https://example.com/aadhar_front.jpg' })
  @IsNotEmpty()
  @IsString()
  doc_file: string;

  @ApiProperty({ example: 'Aadhar Front' })
  @IsNotEmpty()
  @IsString()
  doc_label: string;
}
export class AppReadCustomerDto {
  @ApiProperty({ required: false, description: 'Customer type ID' })
  @IsOptional()
  @IsString()
  customer_type_id?: string;

  @ApiProperty({ required: false, description: 'Login type ID' })
  // @IsOptional()
  @IsNumber()
  login_type_id?: number;

  @ApiProperty({ required: false, description: 'Login type ID' })
  @IsString()
  @IsOptional()
  activeTab?: string;
}

/** -------------------------
 *  Section 1: Basic Info
 *  ------------------------- */
export class BasicInfoDto {
  @ApiProperty({
    example: 'Interior Designer',
    description: 'Type or category of the customer.',
  })
  @IsNotEmpty()
  @IsString()
  customer_type_name: string;

  @ApiProperty({
    example: '67df1b308874ae98cdaea1b',
    description: 'Type id of the customer.',
  })
  @IsNotEmpty()
  @IsString()
  @IsMongoId()
  customer_type_id: string;

  @ApiProperty({ example: 'John Doe', description: 'Name of the customer.' })
  @IsNotEmpty()
  @IsString()
  customer_name: string;

  @ApiPropertyOptional({
    example: 'John Doe',
    description: 'Name of the customer.',
  })
  @IsOptional()
  @IsString()
  customer_code: string;

  @ApiProperty({
    example: '9876543210',
    description: 'Mobile number of the customer.',
  })
  @IsNotEmpty()
  @IsString()
  mobile: string;

  @ApiProperty({
    example: 'Karnataka',
    description: 'State of residence of the customer.',
  })
  @IsNotEmpty()
  @IsString()
  state: string;

  @ApiProperty({
    example: 'Bangalore',
    description: 'District of residence of the customer.',
  })
  @IsNotEmpty()
  @IsString()
  district: string;

  @ApiProperty({
    example: 560001,
    description: "Pincode or ZIP code of the customer's address.",
  })
  @IsNotEmpty()
  @IsNumber()
  pincode: number;

  @ApiProperty({
    example: '123 Main St, Bangalore',
    description: 'Full address of the customer.',
  })
  @IsNotEmpty()
  @IsString()
  address: string;

  @ApiProperty({
    type: FormDataDto,
    description: 'Additional optional form-related data.',
  })
  @IsNotEmpty()
  @IsObject()
  @ValidateNested()
  @Type(() => FormDataDto)
  form_data: FormDataDto;

  @ApiPropertyOptional({ description: 'Source of customer creation' })
  @IsOptional()
  source?: CustomerSource = CustomerSource.APP;
}

/** -------------------------
 *  Section 2: Document Info
 *  ------------------------- */
export class DocumentInfoDto {
  @ApiPropertyOptional({
    enum: DocType,
    example: DocType.AADHAR_CARD,
    description: 'Type of document provided by the user.',
  })
  @IsOptional()
  @IsEnum(DocType)
  doc_type: DocType;

  @ApiPropertyOptional({
    example: '123456789012',
    description: 'Unique identifier of the document (e.g., Aadhar Number).',
  })
  @IsOptional()
  @IsString()
  @ValidateIf((o) => o.doc_type === DocType.AADHAR_CARD)
  @Matches(/^\d{12}$/, {
    message: 'Aadhar Card number must be exactly 12 digits.',
  })
  @ValidateIf((o) => o.doc_type === DocType.PAN_CARD)
  @Matches(/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/, {
    message: 'Pan Card number must match the format XXXXX1234X.',
  })
  @ValidateIf((o) => o.doc_type === DocType.DRIVING_LICENSE)
  @Matches(/^[A-Z0-9]+$/, {
    message:
      'Driving License number must only contain alphanumeric characters.',
  })
  doc_number?: string;

  @ApiPropertyOptional({
    type: [DocFileDto],
    description: 'Array of files associated with the document.',
  })
  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => DocFileDto)
  @IsArray()
  doc_files: DocFileDto[];
}

/** -------------------------
 *  Section 3: Bank Info
 *  ------------------------- */
export class BankInfoDto {
  @ApiPropertyOptional({
    example: '123456789012',
    description: 'Bank account number of the user.',
  })
  @IsOptional()
  @IsString()
  account_no?: string;

  @ApiPropertyOptional({
    example: '123456789012',
    description: 'Confirmation of the bank account number.',
  })
  @IsOptional()
  @IsString()
  confirm_account_no?: string;

  @ApiPropertyOptional({
    example: 'John Doe',
    description: 'Name of the account holder.',
  })
  @IsOptional()
  @IsString()
  beneficiary_name?: string;

  @ApiPropertyOptional({
    example: 'MG Road',
    description: 'Branch name where the account is held.',
  })
  @IsOptional()
  @IsString()
  branch_name?: string;

  @ApiPropertyOptional({
    example: 'HDFC Bank',
    description: 'Name of the bank.',
  })
  @IsOptional()
  @IsString()
  bank_name?: string;

  @ApiPropertyOptional({
    example: 'HDFC0001234',
    description: 'IFSC code of the bank.',
  })
  @IsOptional()
  @IsString()
  ifsc_code?: string;

  @ApiPropertyOptional({
    example: 'john@upi',
    description: 'UPI ID for digital transactions.',
  })
  @IsOptional()
  @IsString()
  upi_id?: string;
}

/** -------------------------
 *  Main DTO (Updated docs_info to be an Array)
 *  ------------------------- */
export class CreateInfluencerDto {
  @ApiProperty({
    example: 'com.',
    description: 'Unique identifier for the application or platform.',
  })
  @IsNotEmpty()
  @IsString()
  app_id: string;

  @ApiProperty({
    type: BasicInfoDto,
    description: 'Basic information of the user.',
  })
  @ValidateNested()
  @Type(() => BasicInfoDto)
  @IsNotEmpty()
  basic_info: BasicInfoDto;

  @ApiPropertyOptional({
    type: [DocumentInfoDto],
    description: 'Array of document information provided by the user.',
  })
  @ValidateNested({ each: true })
  @Type(() => DocumentInfoDto)
  @IsArray()
  @IsOptional()
  docs_info: DocumentInfoDto[];

  @ApiPropertyOptional({
    type: BankInfoDto,
    description: 'Optional banking information of the user.',
  })
  @ValidateNested()
  @Type(() => BankInfoDto)
  @IsOptional()
  bank_info?: BankInfoDto;
}

export class CheckReferralCodeDto {
  @ApiProperty({
    example: 'REF12345',
    description: 'Unique referral code to be validated.',
  })
  @IsString()
  @IsNotEmpty()
  referral_code: string;
}

export class DetailDto {
  @ApiProperty({
    example: '_id:value',
    description: 'Unique MongoDB identifier.',
  })
  @IsMongoId()
  @IsNotEmpty()
  _id: string;
}

export class UpdateProfileDto {
  @ApiProperty({
    example: 'https://example.com/profile.jpg',
    description: "URL to the user's profile picture.",
  })
  @IsNotEmpty()
  @IsString()
  profile_pic: string;
}

export class UpdateBasicInfoDto {
  @ApiProperty({
    example: 'John Doe',
    description: 'Full name of the customer.',
  })
  @IsOptional()
  @IsString()
  customer_name: string;

  @ApiProperty({
    example: '9876543210',
    description: 'Mobile number of the customer.',
  })
  @IsOptional()
  @IsString()
  mobile: string;

  @ApiProperty({ example: 'Karnataka', description: 'State of residence.' })
  @IsOptional()
  @IsString()
  state: string;

  @ApiProperty({ example: 'Bangalore', description: 'District of residence.' })
  @IsOptional()
  @IsString()
  district: string;

  @ApiProperty({ example: 560001, description: 'Pincode or ZIP code.' })
  @IsOptional()
  @IsNumber()
  pincode: number;

  @ApiProperty({
    example: '123 Main St, Bangalore',
    description: 'Residential address.',
  })
  @IsOptional()
  @IsString()
  address: string;

  @ApiProperty({
    example: 'https://example.com/profile.jpg',
    description: 'URL to the updated profile picture.',
  })
  @IsOptional()
  @IsString()
  profile_pic: string;

  @ApiProperty({ type: Object, description: 'Optional additional form data.' })
  @IsOptional()
  @IsObject()
  form_data: Record<string, any>;
}

export class UpdateBankInfoDto {
  @ApiPropertyOptional({
    example: '123456789012',
    description: 'Bank account number.',
  })
  @IsOptional()
  @IsString()
  account_no?: string;

  @ApiPropertyOptional({
    example: 'John Doe',
    description: 'Name of the account holder.',
  })
  @IsOptional()
  @IsString()
  beneficiary_name?: string;

  @ApiPropertyOptional({ example: 'MG Road', description: 'Branch name.' })
  @IsOptional()
  @IsString()
  branch_name?: string;

  @ApiPropertyOptional({
    example: 'HDFC Bank',
    description: 'Name of the bank.',
  })
  @IsOptional()
  @IsString()
  bank_name?: string;

  @ApiPropertyOptional({
    example: 'HDFC0001234',
    description: 'IFSC code of the branch.',
  })
  @IsOptional()
  @IsString()
  ifsc_code?: string;

  @ApiPropertyOptional({
    example: 'john@upi',
    description: 'UPI ID for digital transactions.',
  })
  @IsOptional()
  @IsString()
  upi_id?: string;
}

export class UpdateDocumentInfoDto {
  @ApiProperty({
    example: 'mongo id',
    description: 'Unique MongoDB identifier for the document.',
  })
  @IsNotEmpty()
  @IsMongoId()
  _id: string;

  @ApiPropertyOptional({
    example: '123456789012',
    description: 'Number associated with the document (e.g., Aadhar).',
  })
  @IsOptional()
  @IsString()
  @ValidateIf((o) => o.doc_number)
  @Matches(/^\d{12}$/, {
    message: 'Aadhar Card number must be exactly 12 digits.',
  })
  doc_number?: string;

  @ApiPropertyOptional({
    type: [DocFileDto],
    description: 'Array of associated document files.',
  })
  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => DocFileDto)
  @IsArray()
  doc_files: DocFileDto[];
}

export class ReadCustomerTypeDto {
  @ApiProperty({
    example: 'com.',
    description: 'Application or platform identifier.',
  })
  @IsNotEmpty()
  @IsString()
  app_id: string;
}

export class AppAssignCustomers {
  @ApiProperty({
    example: 'mongo id',
    description: 'Unique ID of the customer type.',
  })
  @IsNotEmpty()
  @IsMongoId()
  customer_type_id: string;

  @ApiProperty({ example: 1, description: 'Page number for pagination.' })
  @IsNumber()
  @IsNotEmpty()
  @Min(1)
  page: number;

  @ApiPropertyOptional({
    example: 10,
    description: 'Number of items per page.',
  })
  @IsOptional()
  @IsNumber()
  @Min(1)
  limit: number;

  @ApiPropertyOptional({
    type: Object,
    description: 'Filters for customer assignment.',
    example: { search: 'value' },
  })
  @IsOptional()
  @IsObject()
  filters: object;
}

export class CustomerProfile {
  @ApiPropertyOptional({
    example: 'customer id',
    description: 'Unique identifier for the customer.',
  })
  @IsOptional()
  @IsMongoId()
  customer_id: string;
}

export class ReadDropdown {
  @ApiProperty({
    example: '609e126f61e3e53b7c2d672c',
    description: 'Customer type identifier.',
  })
  @IsNotEmpty()
  @IsMongoId()
  customer_type_id: string;

  @ApiPropertyOptional({
    example: 'John Doe',
    description: 'Search key for filtering dropdown options.',
  })
  @IsOptional()
  search_key: string;
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
export class AppSaveShippingAddressDto {
  @ApiProperty({
    example: '609e126f61e3e53b7c2d672c',
    description:
      'Unique customer ID (MongoDB ObjectId) to whom the shipping address belongs',
  })
  @IsOptional()
  @IsMongoId()
  customer_id: string;

  @ApiProperty({
    example: 'Karnataka',
    description: 'State of the shipping address',
  })
  @IsNotEmpty()
  @IsString()
  shipping_state: string;

  @ApiProperty({
    example: 'Bangalore',
    description: 'District of the shipping address',
  })
  @IsNotEmpty()
  @IsString()
  shipping_district: string;

  @ApiProperty({
    example: 'Bangalore',
    description: 'City of the shipping address',
  })
  @IsNotEmpty()
  @IsString()
  shipping_city: string;

  @ApiProperty({
    example: 560001,
    description: 'Pincode of the shipping location',
  })
  @IsNotEmpty()
  @IsNumber()
  shipping_pincode: number;

  @ApiProperty({
    example: '123 Main Street, Bangalore',
    description: 'Detailed address for shipping',
  })
  @IsNotEmpty()
  @IsString()
  shipping_address: string;

  @ApiProperty({
    example: 560001,
    description: 'shipping_contact_number of the shipping location',
  })
  @IsOptional()
  @IsString()
  shipping_contact_number: string;

  @ApiProperty({
    example: 560001,
    description: 'shipping_contact_name of the shipping location',
  })
  @IsOptional()
  @IsString()
  shipping_contact_name: string;
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
