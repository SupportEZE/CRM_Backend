import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsMongoId,
  IsObject,
  IsArray,
  IsNumber,
  Min,
  ArrayNotEmpty,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { PartialType } from '@nestjs/mapped-types';

export class CreateOzoneEnquiryDto {
  @ApiProperty({
    description: 'Customer mobile number (10-digit)',
    required: true,
  })
  @IsString()
  @IsNotEmpty()
  contact_number: string;

  @ApiProperty({ description: 'Customer full name', required: true })
  @IsString()
  @IsNotEmpty()
  customer_name: string;

  @ApiProperty({ description: 'Company name (optional)', required: false })
  @IsString()
  @IsOptional()
  company_name: string;

  @ApiPropertyOptional({ description: 'Alternate contact number (optional)' })
  @IsString()
  @IsOptional()
  alternate_mobile_no: string;

  @ApiPropertyOptional({ description: 'Customer email address (optional)' })
  @IsString()
  @IsOptional()
  email: string;

  // 2. Communication Address
  @ApiProperty({ description: 'Pin Code (auto from map)', required: true })
  @IsString()
  @IsNotEmpty()
  pincode: string;

  @ApiProperty({ description: 'State (auto-filled)', required: true })
  @IsString()
  @IsNotEmpty()
  state: string;

  @ApiProperty({ description: 'City (auto-filled)', required: true })
  @IsString()
  @IsNotEmpty()
  district: string;

  @ApiProperty({ description: 'Country (auto-filled)', required: true })
  @IsString()
  @IsNotEmpty()
  country: string;

  @ApiProperty({ description: 'Address (manual)', required: false })
  @IsString()
  @IsOptional()
  address: string;

  // 3. Site Address (optional override)
  @ApiPropertyOptional({ description: 'Site pin code (editable if different)' })
  @IsString()
  @IsOptional()
  site_pincode: string;

  @ApiPropertyOptional({ description: 'Site state (editable)' })
  @IsString()
  @IsOptional()
  site_state: string;

  @ApiPropertyOptional({ description: 'Site city (editable)' })
  @IsString()
  @IsOptional()
  site_city: string;

  @ApiPropertyOptional({ description: 'Site country (editable)' })
  @IsString()
  @IsOptional()
  site_country: string;

  @ApiPropertyOptional({ description: 'Site address (editable)' })
  @IsString()
  @IsOptional()
  site_address: string;

  @ApiPropertyOptional({
    description: 'Projects interested in string',
    example: 'Indrustial',
    type: String,
  })
  @IsNotEmpty()
  @IsString()
  mode_of_enquiry: string;

  @ApiPropertyOptional({
    description: 'Projects interested in string',
    example: 'Indrustial',
    type: String,
  })
  @IsOptional()
  @IsString()
  mode_of_enquiry_other: string;

  @ApiProperty({
    description: 'Products interested in (multiple options)',
    example: ['Residential', 'Indrustial'],
    isArray: true,
    type: String,
  })
  @IsArray()
  @ArrayNotEmpty()
  @IsString({ each: true })
  product_type_required: string[];

  @ApiProperty({
    description: 'Products interested in (multiple options)',
    example: 'Residential',
    type: String,
  })
  @IsString()
  @IsOptional()
  product_type_required_other: string;

  @ApiProperty({
    description: 'Projects interested in string',
    example: 'Indrustial',
    type: String,
  })
  @IsString()
  @IsNotEmpty()
  type_of_project: string;

  @ApiProperty({
    description: 'Projects interested in string',
    example: 'Indrustial',
    type: String,
  })
  @IsString()
  type_of_project_other: string;

  @ApiProperty({
    description: 'Products interested in string',
    example: 'Residential',
    type: String,
  })
  @IsString()
  @IsNotEmpty()
  building_type: string;

  @ApiProperty({ description: 'Approximate quantity (text)', required: true })
  @IsNumber()
  @IsOptional()
  approximate_quantity: number;

  @ApiProperty({
    description: 'Approximate value (dropdown range)',
    required: true,
  })
  @IsString()
  approx_value: string;

  @ApiPropertyOptional({ description: 'Location of installation (optional)' })
  @IsString()
  @IsOptional()
  location_of_installation: string;

  @ApiPropertyOptional({
    description: 'Special remarks or requirements (optional)',
  })
  @IsString()
  @IsOptional()
  special_requirements: string;

  @ApiPropertyOptional({
    description: 'Sales person (auto-filled or optional)',
  })
  @IsString()
  @IsOptional()
  assigned_to_id: string;

  @ApiPropertyOptional({
    description: 'Sales person (auto-filled or optional)',
  })
  @IsString()
  @IsOptional()
  assigned_to_name: string;

  @ApiPropertyOptional({
    description: 'Sales person (auto-filled or optional)',
  })
  @IsString()
  @IsOptional()
  assigned_to_type: string;

  @ApiProperty({
    description: 'Array of assigned user IDs',
    example: ['userId1', 'userId2'],
    isArray: true,
    type: String,
    required: false,
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  assigned_to?: string[];
}

export class UpdateOzoneEnquiryDto extends PartialType(CreateOzoneEnquiryDto) {
  @ApiProperty({ description: 'Document _id to update' })
  @IsMongoId()
  @IsNotEmpty()
  _id: string;
}

export class DetailOzoneEnquiryDTo {
  @ApiProperty({ description: '_id _id to update' })
  @IsMongoId()
  @IsNotEmpty()
  _id: string;
}

export class ReadOzoneEnquiryDto {
  @ApiProperty({ description: 'filters is an optional field', required: false })
  @IsOptional()
  @IsObject()
  filters: object;

  @ApiProperty({
    description: 'activeTab is an optional field',
    required: false,
  })
  @IsOptional()
  @IsString()
  activeTab: string;

  @ApiProperty({ description: 'sorting is an optional field', required: false })
  @IsOptional()
  @IsObject()
  sorting: object;

  @ApiProperty({
    description: 'page number is an optional field',
    required: false,
  })
  @IsOptional()
  @IsNumber()
  @Min(1)
  page: number;

  @ApiProperty({ description: 'limit is an optional field', required: false })
  @IsOptional()
  @IsNumber()
  @Min(10)
  limit: number;
}

export class AssignUserOzoneDto {
  @ApiProperty({
    description: 'id is a required field to assign an enquiery to a user',
    required: true,
  })
  @IsNotEmpty()
  @IsString()
  _id: string;

  @ApiProperty({
    description: 'user id whome to assign the enquiery',
    required: true,
  })
  @IsNotEmpty()
  @IsString()
  assigned_to_user_id: string;

  @ApiProperty({ description: 'enquiery assign date', required: false })
  @IsOptional()
  @IsString()
  assigned_date: string;
}
export class OzoneEnquiryStatusUpdateDto {
  @ApiProperty({
    description: 'enquiry_id is a required field',
    required: true,
  })
  @IsNotEmpty()
  @IsString()
  _id: string;

  @ApiProperty({ description: 'status is a required field', required: true })
  @IsNotEmpty()
  @IsString()
  status: string;
}
export class SaveOzoneCommentSitesDto {
  @ApiProperty({
    description: 'site_project_id is a required field',
    required: true,
  })
  @IsNotEmpty()
  @IsString()
  row_id: string;

  @ApiProperty({ description: 'comment is a required field', required: true })
  @IsNotEmpty()
  @IsString()
  comment: string;
}
export class ReadOzoneCommentsSitesDto {
  @ApiProperty({
    description: 'siteproject id is a required field',
    required: true,
  })
  @IsNotEmpty()
  @IsString()
  row_id: string;
}

export class FindEnquiryByNumberDto {
  @ApiProperty({
    example: '9876543210',
    description: 'Customer contact number',
  })
  @IsString()
  @IsNotEmpty()
  contact_number: string;
}

export class AssignedUserStateDto {
  @ApiProperty({
    example: '9876543210',
    description: 'Customer contact number',
  })
  @IsString({ message: 'Assign Type must be a string' })
  @IsOptional()
  assigned_to_type?: string;

  @ApiProperty({ example: 'Ghaziabad', description: 'Customer city' })
  @IsOptional()
  @IsString({ message: 'city must be a string' })
  city?: string;

  @ApiProperty({
    example: '9876543210',
    description: 'Customer contact number',
  })
  @IsString()
  @IsOptional()
  search_key: string;
}
