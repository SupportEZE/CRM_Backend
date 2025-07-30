import {
  IsString, IsNumber, IsOptional, MaxLength, Min, IsMongoId, IsObject, IsNotEmpty, IsEnum, 
  IsArray, ValidateIf, IsDate, IsNotIn, ValidationArguments, Validate, Equals
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class AppReadAboutDto {

  @ApiProperty({ description: 'org_id is a required field', required: true })
  @IsNotEmpty()
  @IsNumber()
  org_id: number;

}