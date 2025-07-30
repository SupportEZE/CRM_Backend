import { IsString, IsNumber, IsOptional, MaxLength, Min, IsObject, isNotEmpty, IsNotEmpty, IsEnum, ValidateNested, ValidateIf, IsArray, Equals, isMobilePhone, IsMongoId } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export enum HolidayType {
  National = 'National',
  Regional = 'Regional',
}

export enum Action {
  Basic = 'Basic',
  Status = 'Status',
}

export class CreateHolidayDto {
  @ApiProperty({ description: 'Name of the holiday.', example: 'Independence Day', maxLength: 50 })
  @IsNotEmpty()
  @IsString()
  @MaxLength(50)
  holiday_name: string;

  @ApiProperty({ description: 'Date of the holiday in YYYY-MM-DD format.', example: '2025-07-04' })
  @IsNotEmpty()
  @IsString()
  @MaxLength(50)
  holiday_date: string;

  @ApiProperty({ description: 'Type of the holiday.', enum: HolidayType, example: HolidayType.National })
  @IsNotEmpty()
  @IsEnum(HolidayType)
  holiday_type: HolidayType;

  @ApiPropertyOptional({
    description: 'States applicable for a Regional holiday. Required if holiday type is Regional.',
    example: ['Haryana', 'Delhi'],
  })
  @ValidateIf((o) => o.holiday_type === HolidayType.Regional)
  @IsNotEmpty()
  @IsArray()
  regional_state?: Record<string, any>[];

  @ApiProperty({ description: 'Name of the Country.', example: 'Independence Day', maxLength: 50 })
  @IsOptional()
  @IsString()
  country: string;
}

export class ReadHolidayDto {
  @ApiPropertyOptional({ description: 'Filters for retrieving holidays.', example: { field_name: 'value' } })
  @IsOptional()
  @IsObject()
  filters?: object;

  @ApiProperty({ description: 'Page number for pagination.', example: 1 })
  @IsNumber()
  @Min(1)
  page?: number;

  @ApiPropertyOptional({ description: 'Limit of records per page.', example: 10 })
  @IsOptional()
  @IsNumber()
  @Min(1)
  limit?: number;
}

export class UpdateHolidayDto {
  @ApiProperty({ description: 'Unique identifier of the holiday.', example: '60d21b4667d0d8992e610c85' })
  @IsNotEmpty()
  @IsMongoId()
  @IsString()
  _id: string;

  @ApiProperty({ description: 'Updated holiday name.', example: 'Labor Day' })
  @IsString()
  @MaxLength(50)
  holiday_name?: string;

  @ApiProperty({ description: 'Updated holiday date in YYYY-MM-DD format.', example: '2025-09-04' })
  @IsString()
  @MaxLength(50)
  holiday_date?: string;

  @ApiProperty({ description: 'Updated holiday type.', enum: HolidayType, example: HolidayType.National })
  @IsString()
  @MaxLength(50)
  holiday_type?: string;

  @ApiPropertyOptional({
    description: 'States applicable for a Regional holiday. Required if holiday type is Regional.',
    example: ['Haryana', 'Delhi'],
  })
  @ValidateIf((o) => o.holiday_type === HolidayType.Regional)
  @IsNotEmpty()
  @IsArray()
  regional_state?: Record<string, any>[];

  @ApiPropertyOptional({ description: 'Extracted day of the holiday.', example: 4 })
  @IsOptional()
  @IsNumber()
  day?: number;

  @ApiPropertyOptional({ description: 'Extracted month name of the holiday.', example: 'July' })
  @IsOptional()
  @IsString()
  month?: string;

  @ApiPropertyOptional({ description: 'Extracted year of the holiday.', example: 2025 })
  @IsOptional()
  @IsNumber()
  year?: number;
}

export class DeleteHolidayDto {
  @ApiProperty({ description: 'Unique identifier of the holiday to delete.', example: '60d21b4667d0d8992e610c85' })
  @IsNotEmpty()
  @IsMongoId()
  @IsString()
  _id: string;

  @ApiProperty({ description: 'Flag to indicate deletion. Must be set to 1.', example: 1 })
  @IsNotEmpty()
  @IsNumber()
  @Equals(1)
  is_delete: number;
}


