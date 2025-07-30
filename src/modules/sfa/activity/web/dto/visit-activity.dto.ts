import { IsArray, IsISO8601, IsMongoId, IsNotEmpty, IsNumber, IsObject, isObject, IsOptional, IsString, Min, ValidateNested } from 'class-validator';
import { Transform, Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

class FiltersDto {
    @ApiProperty({ description: 'Example field for filtering', required: false, example: 'value' })
    @IsOptional()
    someField: string;
}

export class ReadVisitDto {
    @ApiProperty({
        description: 'Filters to apply for attendance search. Must be a valid object.',
        required: false,
        type: FiltersDto,
    })
    @IsOptional()
    @IsObject()
    filters: Record<string, any>;

    @ApiProperty({
        description: 'Page number for pagination. Minimum value is 1.',
        example: 1,
        required: false,
    })
    @IsOptional()
    @Transform(({ value }) => parseInt(value, 10))
    @IsNumber()
    @Min(1)
    page: number;

    @ApiProperty({
        description: 'Number of records per page. Minimum value is 10.',
        example: 10,
        required: false,
    })
    @IsOptional()
    @Transform(({ value }) => parseInt(value, 10))
    @IsNumber()
    @Min(10)
    limit: number;

    @ApiProperty({ description: 'Beat code for filtering', required: false })
    @IsArray()
    @IsOptional()
    beat_code: string;

    @ApiProperty({ description: 'State name for filtering', required: false })
    @IsArray()
    @IsOptional()
    state: string;

    @ApiProperty({ description: 'Customer type name for filtering', required: false })
    @IsArray()
    @IsOptional()
    customer_type_name: string;

    @ApiProperty({ description: 'User ID for filtering', required: false })
    @IsArray()
    @IsOptional()
    user_id: string;

    @ApiProperty({ description: 'User ID for filtering', required: false })
    @IsMongoId()
    @IsOptional()
    customer_id: string;
}

export class TodayDataDto {
    @ApiProperty({ description: 'activity_date' })
    @IsISO8601()
    @IsOptional()
    activity_date: string;
}

export class AnyalyticsDto {
    @ApiProperty({ description: 'Activity date (ISO 8601 format)', required: false })
    @IsISO8601()
    @IsOptional()
    activity_date: string;

    @ApiProperty({ description: 'Beat code for filtering', required: false })
    @IsArray()
    @IsOptional()
    beat_code: string;

    @ApiProperty({ description: 'State name for filtering', required: false })
    @IsArray()
    @IsOptional()
    state: string;

    @ApiProperty({ description: 'Customer type name for filtering', required: false })
    @IsArray()
    @IsOptional()
    customer_type_name: string;

    @ApiProperty({ description: 'User ID for filtering', required: false })
    @IsArray()
    @IsOptional()
    user_id: string;
}

export class NdayDto {
    @ApiProperty({ description: 'Activity date (ISO 8601 format)', required: false })
    @IsISO8601()
    @IsOptional()
    activity_date: string;

    @ApiProperty({ description: 'Beat code for filtering', required: false })
    @IsArray()
    @IsOptional()
    beat_code: string;

    @ApiProperty({ description: 'State name for filtering', required: false })
    @IsArray()
    @IsOptional()
    state: string;

    @ApiProperty({ description: 'Customer type name for filtering', required: false })
    @IsArray()
    @IsOptional()
    customer_type_name: string;

    @ApiProperty({ description: 'User ID for filtering', required: false })
    @IsArray()
    @IsOptional()
    user_id: string;

    @ApiProperty({ description: 'Activity date (ISO 8601 format)', required: false })
    @IsNumber()
    @IsOptional()
    n_day: string;
}

export class monthReadDto {
    @ApiProperty({ description: 'month number', required: false })
    @IsOptional()
    month: number;

    @ApiProperty({ description: 'year number', required: false })
    @IsOptional()
    year: number;

    @IsOptional()
    @IsObject()
    filters: Record<string, any>;

    @ApiProperty({ description: 'Search with User code', required: false })
    @IsString()
    @IsOptional()
    user_code: string;

    @ApiProperty({ description: "Search with designation", required: false })
    @IsString()
    @IsOptional()
    designation: string;
}

export class ActivityDocsDto {
    @ApiProperty({
        description: 'Unique identifier for the activity docs',
        example: '609e126f61e3e53b7c2d672c',
    })
    @IsMongoId()
    @IsNotEmpty()
    _id: string;
}
