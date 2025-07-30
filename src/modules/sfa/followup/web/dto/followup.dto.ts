import {
  IsString, IsNumber, IsOptional, MaxLength, Min, IsMongoId, IsObject, IsNotEmpty,
  IsEnum, IsArray, ValidateIf, IsDate, IsNotIn, ValidationArguments, Validate, Equals, IsBoolean
} from 'class-validator';
import { Transform, Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';
export class CreateFollowupDto {

  @ApiProperty({ description: 'followup type is a required field', required: true })
  @IsString()
  @IsNotEmpty()
  followup_date: string;

  @ApiProperty({ description: 'followup type is a required field', required: true })
  @IsString()
  @IsNotEmpty()
  followup_time: string;

  @ApiProperty({ description: 'followup type is a required field', required: true })
  @IsString()
  @IsNotEmpty()
  followup_type: string;

  @ApiProperty({ description: 'category type is a required field', required: true })
  @IsString()
  @IsNotEmpty()
  category_type: string;

  @ApiProperty({ description: 'category id is a required field', required: true })
  @IsString()
  @IsNotEmpty()
  category_id: string;

  @ApiProperty({ description: 'assigned_to_user_id is a required field', required: true })
  @IsString()
  @IsMongoId()
  assigned_to_user_id: string;

  @ApiProperty({ description: 'assigned_to_user_name is a required field', required: true })
  @IsString()
  @IsNotEmpty()
  assigned_to_user_name: string;

  @ApiProperty({ description: 'customer_name is a optional field', required: true })
  @IsString()
  @IsOptional()
  customer_name: string;

  @ApiProperty({ description: 'remark is an optional field', required: false })
  @IsOptional()
  @IsString()
  remark: string;

  @ApiProperty({ description: 'form_data ia a form builder part go here and this is an optional field', required: false })
  @IsObject()
  @IsOptional()
  form_data?: Record<string, any>;
}

export class UpdateFollowupDto {

  @ApiProperty({ description: 'id is to update a row and this is a required field', required: true })
  @IsNotEmpty()
  @IsString()
  _id: string;

  @ApiProperty({ description: 'followup date is a required field', required: true })
  @IsString()
  @IsNotEmpty()
  followup_date: string;

  @ApiProperty({ description: 'followup time is a required field', required: true })
  @IsString()
  @IsNotEmpty()
  followup_time: string;

  @ApiProperty({ description: 'followup type is a required field', required: true })
  @IsString()
  @IsNotEmpty()
  followup_type: string;

  @ApiProperty({ description: 'remark is an optional field', required: false })
  @IsOptional()
  @IsString()
  remark: string;

  @ApiProperty({ description: 'form_data ia a form builder part go here and this is an optional field', required: false })
  @IsObject()
  @IsOptional()
  form_data?: Record<string, any>;

}

export class ReadFollowupDto {

  @ApiProperty({ description: 'filters is an optional field', required: false })
  @IsOptional()
  @IsObject()
  filters: object;

  @ApiProperty({ description: 'activeTab is an optional field', required: false })
  @IsOptional()
  @IsString()
  activeTab: string;

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

  @ApiProperty({ description: 'Find with id details' })
  @IsOptional()
  @IsString()
  followup_id: string
}

export class DeleteFollowupDto {

  @ApiProperty({ description: 'id is a required field', required: true })
  @IsNotEmpty()
  @IsString()
  _id: string;

  @ApiProperty({ description: 'is_delete is a required field', required: true })
  @IsNotEmpty()
  @IsNumber()
  @Equals(1, { message: 'is_delete must be 1' }) // Ensures only value 1 is allowed
  is_delete: number;

}
export class StatusUdateFollowupDto {
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