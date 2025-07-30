import {
  IsString, IsNumber, IsOptional, MaxLength, Min, IsMongoId, IsObject, IsNotEmpty, IsEnum,
  IsArray, ValidateIf, IsDate, IsNotIn, ValidationArguments, Validate, Equals,
  IsISO8601
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class AppBeatPlanListDto {

  @ApiProperty({ description: 'Beat Plan Date' })
  @IsISO8601()
  @IsOptional()
  date: string;

  @ApiProperty({ description: 'Filters criteria for reading products', type: Object, required: false })
  @IsOptional()
  @IsObject()
  filters: object;

  @ApiProperty({ description: 'Sorting criteria for reading products', type: Object, required: false })
  @IsOptional()
  @IsObject()
  sorting: object;

  @ApiProperty({ description: 'Page number for pagination', type: Number, required: false })
  @IsOptional()
  @IsNumber()
  @Min(1)
  page: number;

  @ApiProperty({ description: 'Limit for number of products per page', type: Number, required: false })
  @IsOptional()
  @IsNumber()
  @Min(10)
  limit: number;
}

