import {
  IsString, IsNumber, IsOptional, Min, IsMongoId, IsObject, IsNotEmpty, IsBoolean
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class AppCreateSitesDto {

  @ApiProperty({ description: 'Site Type is a required field', required: true })
  @IsString()
  @IsNotEmpty()
  site_type: string;

  @ApiProperty({ description: 'source is a required field', required: false })
  @IsNotEmpty()
  @IsString()
  source: string;

  @ApiProperty({ description: 'source is a required field', required: false })
  @IsNotEmpty()
  @IsString()
  priority: string;

  @ApiProperty({ description: 'site name is a required field', required: false })
  @IsNotEmpty()
  @IsString()
  site_name: string;

  @ApiProperty({ description: 'pincode is a optional field', required: false })
  @IsOptional()
  @IsNumber()
  pincode: string;

  @ApiProperty({ description: 'state  is a optional field', required: false })
  @IsOptional()
  @IsString()
  state: string;

  @ApiProperty({ description: 'address source is a optional field', required: false })
  @IsOptional()
  @IsString()
  address: string;

  @ApiProperty({ description: 'siteproject source is a required field', required: false })
  @IsOptional()
  @IsString()
  district: string;

  @ApiProperty({ description: 'siteproject source is a required field', required: false })
  @IsOptional()
  @IsString()
  city: string;


  @ApiProperty({ description: 'mobile no  is a optional field', required: false })
  @IsOptional()
  @IsString()
  mobile: string;

  @ApiProperty({ description: 'form_data ia a form builder part go here and this is an optional field', required: false })
  @IsObject()
  @IsOptional()
  form_data?: Record<string, any>;
}
export class AppUpdateSitesDto {

  @ApiProperty({ description: 'id is to update a row and this is a required field', required: true })
  @IsNotEmpty()
  @IsString()
  _id: string;

  @ApiProperty({ description: 'siteproject type is a required field', required: true })
  @IsString()
  @IsNotEmpty()
  site_type: string;

  @ApiProperty({ description: 'siteproject source is a required field', required: false })
  @IsOptional()
  @IsString()
  source: string;

  @ApiProperty({ description: 'siteproject source is a required field', required: false })
  @IsOptional()
  @IsString()
  priority: string;

  @ApiProperty({ description: 'siteproject source is a required field', required: false })
  @IsOptional()
  @IsString()
  site_name: string;

  @ApiProperty({ description: 'siteproject source is a required field', required: false })
  @IsOptional()
  @IsString()
  pincode: string;

  @ApiProperty({ description: 'siteproject source is a required field', required: false })
  @IsOptional()
  @IsString()
  state: string;

  @ApiProperty({ description: 'siteproject source is a required field', required: false })
  @IsOptional()
  @IsString()
  address: string;

  @ApiProperty({ description: 'siteproject source is a required field', required: false })
  @IsOptional()
  @IsString()
  district: string;

  @ApiProperty({ description: 'siteproject source is a required field', required: false })
  @IsOptional()
  @IsString()
  city: string;

  @ApiProperty({ description: 'user id is an optional field', required: false })
  @IsOptional()
  @IsString()
  assigned_to_user_id: string;

  @ApiProperty({ description: 'user name is an optional field', required: false })
  @IsOptional()
  @IsString()
  assigned_to_user_name: string;

  @ApiProperty({ description: 'form_data ia a form builder part go here and this is an optional field', required: false })
  @IsObject()
  @IsOptional()
  form_data?: Record<string, any>;
}
export class AppReadSitesDto {
  @ApiProperty({ description: 'Filters (optional)', required: false })
  @IsOptional()
  @IsObject()
  filters: object;

  @ApiProperty({ description: 'Active tab (optional)', required: false })
  @IsOptional()
  @IsString()
  activeTab: string;

  @ApiProperty({ description: 'Sorting (optional)', required: false })
  @IsOptional()
  @IsObject()
  sorting: object;

  @ApiProperty({ description: 'Page number (optional, min 1)', required: false })
  @IsOptional()
  @IsNumber()
  @Min(1)
  page: number;

  @ApiProperty({ description: 'Limit (optional, min 10)', required: false })
  @IsOptional()
  @IsNumber()
  @Min(10)
  limit: number;
}
export class AppStatusUpdateSitesDto {
  @ApiProperty({ description: 'ID (required)', required: true })
  @IsNotEmpty()
  @IsString()
  _id: string;

  @ApiProperty({ description: 'Status (required)', required: true })
  @IsNotEmpty()
  @IsString()
  status: string;

  @ApiProperty({ description: 'Reason (optional)', required: false })
  @IsOptional()
  @IsString()
  reason: string;
}
export class AppSaveStageDto {
  @ApiProperty({ description: 'Sites ID (required)', required: true })
  @IsNotEmpty()
  @IsString()
  site_project_id: string;

  @ApiProperty({ description: 'Stage (required)', required: true })
  @IsNotEmpty()
  @IsString()
  stage: string;

  @ApiProperty({ description: 'Checked (optional)', required: false })
  @IsBoolean()
  @IsOptional()
  checked?: boolean;
}

export class ActivitiesDto {

  @ApiProperty({ description: 'site id is a required field', required: true })
  @IsMongoId()
  @IsNotEmpty()
  site_project_id: string;

}

export class SaveContactDto {

  @ApiProperty({ description: 'Site id is required field', required: true })
  @IsNotEmpty()
  @IsMongoId()
  site_project_id: string;

  @ApiProperty({ description: 'contact mobile is required field', required: true })
  @IsNotEmpty()
  @IsString()
  contact_person_mobile: string;

  @ApiProperty({ description: 'contact name is required field', required: true })
  @IsNotEmpty()
  @IsString()
  contact_person_name: string;

  @ApiProperty({ description: 'contact type is required field', required: true })
  @IsNotEmpty()
  @IsString()
  designation: string;
}
export class UpdateContactDto {

  @ApiProperty({ description: 'row id of contact detail is required field', required: true })
  @IsNotEmpty()
  @IsMongoId()
  _id: string;

  @ApiProperty({ description: 'contact mobile is required field', required: true })
  @IsNotEmpty()
  @IsString()
  contact_person_mobile: string;

  @ApiProperty({ description: 'contact name is required field', required: true })
  @IsNotEmpty()
  @IsString()
  contact_person_name: string;

  @ApiProperty({ description: 'contact type is required field', required: true })
  @IsNotEmpty()
  @IsString()
  designation: string;
}
export class AppDeleteContactDto {

  @ApiProperty({ description: 'row id of Site is required field', required: true })
  @IsNotEmpty()
  @IsMongoId()
  _id: string;

  @ApiProperty({ description: 'is_delete is required field', required: true })
  @IsNotEmpty()
  @IsNumber()
  is_delete: number;
}
