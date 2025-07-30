import {
  IsString, IsNumber, IsOptional, MaxLength, Min, IsMongoId, IsObject, IsNotEmpty,
  IsEnum, IsArray, ValidateIf, IsDate, IsNotIn, ValidationArguments, Validate, Equals, IsBoolean
} from 'class-validator';
import { Transform, Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

export class SaveCommentDto {
  @ApiProperty({ description: 'comment is a required field', required: true })
  @IsNotEmpty()
  @IsString()
  comment: string;

  @ApiProperty({ description: 'row_id', required: true })
  @IsNotEmpty()
  @IsMongoId()
  row_id: string;
}

export class ReadCommentsDto {
  @ApiProperty({ description: 'row_id', required: true })
  @IsNotEmpty()
  @IsMongoId()
  row_id: string;
}