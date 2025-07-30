import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsIn, ValidateIf, IsOptional, isNotEmpty, IsObject, IsArray, IsNumber } from 'class-validator';

export class GenerateCsvDto {

  @IsString()
  @IsNotEmpty()
  filename: string;

  @IsArray()
  @IsNotEmpty()
  data: string;

}

export class GenerateSampleCsvDto {
  @IsNotEmpty()
  @IsNumber()
  form_id: number;

}

export class AnalyzeCsvDto {

  @IsNotEmpty()
  @IsString()
  form_id: string;


}
