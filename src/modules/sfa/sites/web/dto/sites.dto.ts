import {
  IsString, IsNumber, IsOptional, Min, IsMongoId, IsObject, IsNotEmpty, IsBoolean,
  IsArray,
  ArrayNotEmpty
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { AppCreateSitesDto } from '../../app/dto/app-sites.dto';

export class CreateSitesDto extends AppCreateSitesDto {

  @ApiProperty({ description: 'user id is an optional field', required: false })
  @IsNotEmpty()
  @IsMongoId()
  assigned_to_user_id: string;

  @ApiProperty({ description: 'user name is an optional field', required: false })
  @IsNotEmpty()
  @IsString()
  assigned_to_user_name: string;

}
export class UpdateSitesDto {

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
  pin_code: string;

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
export class ReadSitesDto {

  @ApiProperty({ description: 'filters is an optional field', required: false })
  @IsOptional()
  @IsObject()
  filters: object;

  @ApiProperty({ description: 'activeTab is an optional field', required: false })
  @IsOptional()
  @IsString()
  activeTab: string;

  @ApiProperty({ description: 'activeSubTab is an optional field', required: false })
  @IsOptional()
  @IsString()
  activeSubTab: string;

  @ApiProperty({ description: 'sorting is an optional field', required: false })
  @IsOptional()
  @IsObject()
  sorting: object;

  @ApiProperty({ description: 'page number is an optional field', required: false })
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
export class AssignUserDto {
  @ApiProperty({ description: 'id is a required field to assign an enquiery to a user', required: true })
  @IsNotEmpty()
  @IsString()
  _id: string;

  @ApiProperty({ description: 'user id whome to assign the enquiery', required: true })
  @IsNotEmpty()
  @IsString()
  assigned_to_user_id: string;

  @ApiProperty({ description: 'enquiery assign date', required: false })
  @IsOptional()
  @IsString()
  assigned_date: string;
}
export class StatusUdateSitesDto {
  @ApiProperty({ description: 'id is a required field', required: true })
  @IsNotEmpty()
  @IsString()
  _id: string;

  @ApiProperty({ description: 'status is a required field', required: true })
  @IsNotEmpty()
  @IsString()
  status: string;

  @ApiProperty({ description: 'reason is optional field', required: true })
  @IsOptional()
  @IsString()
  reason: string;

}
export class SaveCommentSitesDto {
  @ApiProperty({ description: 'site_project_id is a required field', required: true })
  @IsNotEmpty()
  @IsString()
  row_id: string;

  @ApiProperty({ description: 'comment is a required field', required: true })
  @IsNotEmpty()
  @IsString()
  comment: string;
}
export class ReadCommentsSitesDto {
  @ApiProperty({ description: 'siteproject id is a required field', required: true })
  @IsNotEmpty()
  @IsString()
  row_id: string;
}
export class SaveStageDto {
  @ApiProperty({ description: 'siteproject_id is a required field', required: true })
  @IsNotEmpty()
  @IsString()
  site_project_id: string;

  @ApiProperty({ description: 'stage is a required field', required: true })
  @IsNotEmpty()
  @IsString()
  stage: string;

  @ApiProperty({ description: 'check is a required field', required: true })
  @IsBoolean()
  @IsOptional()
  checked?: boolean;
}
export class ReadStageDto {
  @IsMongoId()
  @IsNotEmpty()
  site_project_id: string;
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
export class DeleteContactDto {

  @ApiProperty({ description: 'row id of Site is required field', required: true })
  @IsNotEmpty()
  @IsMongoId()
  _id: string;

}
export class SiteReadQuotationDto {

  @ApiProperty({ description: 'row id of Site is required field', required: true })
  @IsNotEmpty()
  @IsMongoId()
  _id: string;

}
export class SaveLocationDto {

  @ApiProperty({ description: 'row id of Site is required field', required: true })
  @IsNotEmpty()
  @IsMongoId()
  site_project_id: string;

  @ApiPropertyOptional({ example: 2000.230, description: 'Latitude coordinate of customer location' })
  @IsOptional()
  @IsNumber()
  lat?: number;

  @ApiPropertyOptional({ example: 2000.230, description: 'Longitude coordinate of customer location' })
  @IsOptional()
  @IsNumber()
  long?: number;
}

export class SaveCompetitorDto {
  @ApiProperty({ description: 'siteproject_id is a required field', required: true })
  @IsNotEmpty()
  @IsString()
  site_project_id: string;

  @ApiProperty({ description: 'competitor is a required field', required: true })
  @IsNotEmpty()
  @IsString()
  competitor: string;

  @ApiProperty({ description: 'check is a required field', required: true })
  @IsBoolean()
  @IsOptional()
  checked?: boolean;
}

export class DeleteMultipleFilesDto {
  @IsArray()
  @ArrayNotEmpty()
  ids: string[];
}

