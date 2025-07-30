import { IsString, IsNumber, IsMongoId, IsOptional, MaxLength, Min, ArrayNotEmpty, Max, IsDate, Equals, IsObject, IsNotEmpty, IsEnum, ValidateNested, ValidateIf, IsArray } from 'class-validator';
import { Transform, Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export enum Status {
    Active = "Active",
    Inactive = "Inactive"
}

export class CreateSpinWinDto {
    @ApiProperty({
        example: 10,
        description: 'Total number of sections in the Spin wheel.',
    })
    @IsNotEmpty()
    @IsNumber()
    @Min(1)
    point_section: number;

    @ApiProperty({
        example: 7,
        description: 'Number of eligible days for the spin win.',
    })
    @IsNotEmpty()
    @IsNumber()
    @Min(1)
    eligible_days: number;

    @ApiProperty({ description: 'Customer Category name', type: [String], example: ['Plumber'] })
    @IsArray()
    @IsString({ each: true })
    @IsNotEmpty()
    customer_type_name?: string[];

    @ApiProperty({ description: 'Customer Category Id for the Gift gallery', type: [String], example: ['67df1b308874ae98cdaea1b', '67df1b308874ae98cdaea1b'] })
    @IsArray()
    @IsMongoId({ each: true })
    @IsNotEmpty()
    customer_type_id: string[];

    @ApiProperty({
        description: 'Slab data defining different spin win segments.',
        type: [Object],
        example: [{ slab_point: 9 }, { slab_point: 6 }],
    })
    @IsArray()
    @ArrayNotEmpty()
    @IsNotEmpty()
    slab_data: Record<string, any>[];
}

export class ReadSpinWinDto {
    @ApiPropertyOptional({
        description: 'Filters for querying spin win list.',
        type: Object,
        example: { field_name: 'test' },
    })
    @IsOptional()
    @IsObject()
    filters?: Record<string, any>;

    @ApiProperty({ description: 'Active tab for the spin list', example: 'all' })
    @IsString()
    @IsNotEmpty()
    activeTab?: string;


    @ApiPropertyOptional({
        description: 'Pagination limit. Default is 10.',
        example: 10,
    })
    @IsOptional()
    @IsNumber()
    limit?: number = 10;

    @ApiProperty({
        description: 'Pagination page number. Default is 1.',
        example: 1,
    })
    @IsNumber()
    page?: number = 1;
}
export class UpdateSpinWinDto {
    @ApiProperty({
        description: 'Spin win ID to be updated.',
        example: '64a15b4f0e3f1b0001a7c12b',
    })
    @IsNotEmpty()
    @IsMongoId()
    @IsString()
    _id: string;

    @ApiProperty({
        description: 'Updated point section for the spin win.',
        example: 8,
    })
    @IsNotEmpty()
    @IsNumber()
    @Min(1)
    point_section: number;

    @ApiProperty({
        description: 'Updated eligible days for the spin win.',
        example: 5,
    })
    @IsNotEmpty()
    @IsNumber()
    @Min(1)
    eligible_days: number;

    @ApiProperty({ description: 'Customer Category name', type: [String], example: ['Plumber'] })
    @IsArray()
    @IsString({ each: true })
    @IsNotEmpty()
    customer_type_name?: string[];

    @ApiProperty({ description: 'Customer Category Id', type: [String], example: ['67df1b308874ae98cdaea1b', '67df1b308874ae98cdaea1b'] })
    @IsArray()
    @IsMongoId({ each: true })
    @IsNotEmpty()
    customer_type_id: string[];

    @ApiProperty({
        description: 'Updated slab data.',
        type: [Object],
        example: [{ slab_point: 9 }, { slab_point: 6 }],
    })
    @IsArray()
    @ArrayNotEmpty()
    @IsNotEmpty()
    slab_data: Record<string, any>[];
}
export class UpdateSpiWinStatusDto {
    @ApiProperty({
        description: 'Spin win ID for status update.',
        example: '64a15b4f0e3f1b0001a7c12b',
    })
    @IsNotEmpty()
    @IsMongoId()
    @IsString()
    _id: string;

    @ApiProperty({
        description: 'New status value.',
        enum: Status,
        example: Status.Inactive,
    })
    @IsNotEmpty()
    @IsEnum(Status)
    status: Status;
}

export class SpinWinDetailDto {
    @ApiProperty({
        description: 'Spin win ID to fetch details.',
        example: '64a15b4f0e3f1b0001a7c12b',
    })
    @IsNotEmpty()
    @IsMongoId()
    @IsString()
    _id: string;
}


