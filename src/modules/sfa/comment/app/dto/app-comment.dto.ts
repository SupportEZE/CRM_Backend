import {
  IsString, IsNumber, IsOptional, MaxLength, Min, IsMongoId, IsObject, IsNotEmpty, IsEnum,
  IsArray, ValidateIf, IsDate, IsNotIn, ValidationArguments, Validate, Equals
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class AppSaveCommentDto {
  @ApiProperty({ description: 'comment is a required field', required: true })
  @IsNotEmpty()
  @IsString()
  comment: string;
}

export class AppReadCommentsDto {
  @ApiProperty({ description: 'row_id', required: true })
  @IsNotEmpty()
  @IsMongoId()
  row_id: string;
}