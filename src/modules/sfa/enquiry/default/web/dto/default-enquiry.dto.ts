
import {
    IsString,
    IsNotEmpty,
    IsOptional,
    IsMongoId,
    IsObject,
    IsArray,
    IsNumber,
    Min,
    IsBoolean
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { PartialType } from '@nestjs/mapped-types';

export class CreateDefaultEnquiryDto {
    @ApiProperty({ description: 'Enquiry Id', example: 'ENQ-01', required: true })
    @IsString()
    @IsOptional()
    enquiry_id: string;

    @ApiProperty({ description: 'enquiry type is a required field', required: true })
    @IsString()
    @IsNotEmpty()
    enquiry_type: string;

    @ApiProperty({ description: 'enquiry source is a required field', required: false })
    @IsOptional()
    @IsNotEmpty()
    enquiry_source: string;

    @ApiProperty({ description: 'user id is an optional field', required: false })
    @IsOptional()
    @IsMongoId()
    assigned_to_user_id: string;

    @ApiProperty({ description: 'user name is an optional field', required: false })
    @IsOptional()
    @IsString()
    assigned_to_user_name: string;

    @ApiProperty({ description: 'enquery name is a required field', required: true })
    @IsNotEmpty()
    @IsString()
    name: string;

    @ApiProperty({ description: 'enquery mobile is a required field', required: true })
    @IsNotEmpty()
    @IsString()
    mobile: string;

    @ApiProperty({ description: 'enquery email is an optional field', required: false })
    @IsOptional()
    @IsString()
    email: string;

    @ApiProperty({ description: 'enquery requirement is an optional field', required: false })
    @IsOptional()
    @IsNotEmpty()
    requirement: string;

    @ApiPropertyOptional({ description: 'chekin-id' })
    @IsMongoId()
    @IsOptional()
    visit_activity_id: string;

    @ApiProperty({ description: 'form_data ia a form builder part go here and this is an optional field', required: false })
    @IsObject()
    @IsOptional()
    form_data?: Record<string, any>;
}

export class UpdateDefaultEnquiryDto {
    @ApiProperty({ description: 'id is to update a row and this is a required field', required: true })
    @IsNotEmpty()
    @IsString()
    _id: string;

    @ApiProperty({ description: 'enquiry type is a required field', required: true })
    @IsString()
    @IsNotEmpty()
    enquiry_type: string;

    @ApiProperty({ description: 'enquiry source is  an optional field', required: false })
    @IsOptional()
    @IsString()
    enquiry_source: string;

    @ApiProperty({ description: 'user id is an optional field', required: false })
    @IsOptional()
    @IsString()
    assigned_to_user_id: string;

    @ApiProperty({ description: 'user name is a required field', required: true })
    @IsNotEmpty()
    @IsString()
    assigned_to_user_name: string;

    @ApiProperty({ description: 'enquery name is a required field', required: true })
    @IsNotEmpty()
    @IsString()
    name: string;

    @ApiProperty({ description: 'enquery mobile is a required field', required: true })
    @IsNotEmpty()
    @IsString()
    mobile: string;

    @ApiProperty({ description: 'enquery email is an optional field', required: false })
    @IsOptional()
    @IsString()
    email: string;

    @ApiProperty({ description: 'enquery requirement is an optional field', required: false })
    @IsOptional()
    @IsString()
    requirement: string;

    @ApiProperty({ description: 'form_data ia a form builder part go here and this is an optional field', required: false })
    @IsObject()
    @IsOptional()
    form_data?: Record<string, any>;
}

export class ReadDefaultEnquiryDto {
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

export class AssignUserDefaultDto {
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

export class DefaultEnquiryStatusUpdateDto {
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

export class DefaultEnquirySaveStageDto {
    @ApiProperty({ description: 'enquiry_id is a required field', required: true })
    @IsNotEmpty()
    @IsString()
    enquiry_id: string;

    @ApiProperty({ description: 'stage is a required field', required: true })
    @IsNotEmpty()
    @IsString()
    stage: string;

    @ApiProperty({ description: 'check is a required field', required: true })
    @IsBoolean()
    @IsOptional()
    checked?: boolean;
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

export class DefaultEnquiryActivitiesDto {
    @ApiProperty({ description: 'enquiry id is a required field', required: true })
    @IsMongoId()
    @IsNotEmpty()
    enquiry_id: string;
}


export class DetailDefaultEnquiryDto {
    @ApiProperty({
        description: 'enquiry id is a required field',
        required: true,
    })
    @IsMongoId()
    @IsNotEmpty()
    _id: string;

    @ApiProperty({
        description: 'enquiry id field',
    })
    @IsMongoId()
    @IsOptional()
    enquiry_id: string;
}



