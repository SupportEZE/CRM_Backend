import { IsString, IsISO8601, IsNumber, ArrayNotEmpty, IsMongoId, IsEnum, IsOptional, IsObject, Min, IsArray, IsNotEmpty, IsDate } from 'class-validator';
import { Transform ,Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export enum BonusStatus {
    Active = 'Active',
    Inactive = 'Inactive',
}

export class CreateBonusDto {
    @ApiProperty({ description: 'The title of the bonus', example: 'Welcome Bonus' })
    @IsString()
    title: string;

    @ApiProperty({
        description: 'Customer Category eligible for the bonus',
        type: [Object],
        example: ["Plumber", "Architect"],
    })
    @IsArray()
    @ArrayNotEmpty()
    customer_type_name?: Record<string, any>[];

    @ApiProperty({ description: 'Customer Category Id for the Gift gallery', type: [String], example: ['67df1b308874ae98cdaea1b', '67df1b308874ae98cdaea1b'] })
    @IsArray()
    @IsMongoId({ each: true })
    @IsNotEmpty()
    customer_type_id: string[];

    @ApiProperty({
        description: 'The start date of the bonus',
        type: Date,
        example: '2025-04-01T00:00:00Z',
    })
    @IsISO8601()
    @IsNotEmpty()
    start_date?: Date;

    @ApiProperty({
        description: 'The end date of the bonus',
        type: Date,
        example: '2025-12-31T00:00:00Z',
    })
    @IsISO8601()
    @IsNotEmpty()
    end_date?: Date;

    @ApiProperty({
    description: 'Country eligible to participate',
    example:"India"
    })
    @IsNotEmpty()
    country: string;

    @ApiProperty({
        description: 'The states eligible for the bonus',
        type: [String],
        example: ['State A', 'State B'],
    })
    @IsArray()
    @IsString({ each: true })
    @ArrayNotEmpty()
    state?: string[];

    @ApiProperty({
        description: 'The districts eligible for the bonus',
        type: [String],
        example: ['District A', 'District B'],
    })
    @IsArray()
    @IsString({ each: true })
    @ArrayNotEmpty()
    district?: string[];

    @ApiProperty({
        description: 'The products eligible for the bonus',
        type: [String],
        example: [{ "point_category_id": "67df1b308874ae98cdaea1b", "point_category_value": 10, "point_category_name": "ABC" }, { "point_category_id": "67df1b308874ae98cdaea1b", "point_category_value": 10, "point_category_name": "ABC" }],
    })
    @IsArray()
    product_point?: string[];
}

export class UpdateBonusDto {
    @ApiProperty({ description: 'The ID of the bonus', example: 'abc123' })
    @IsString()
    @IsMongoId()
    @IsNotEmpty()
    _id: string;

    @ApiProperty({ description: 'The title of the bonus', example: 'Holiday Bonus' })
    @IsString()
    @IsNotEmpty()
    title?: string;

    @ApiProperty({
        description: 'The start date of the bonus',
        type: Date,
        example: '2025-06-01T00:00:00Z',
    })
    @IsISO8601()
    @IsNotEmpty()
    start_date?: Date;

    @ApiProperty({
        description: 'The end date of the bonus',
        type: Date,
        example: '2025-12-31T00:00:00Z',
    })
    @IsISO8601()
    @IsNotEmpty()
    end_date?: Date;
}

export class ReadBonusDto {
    @ApiPropertyOptional({
        description: 'Filters to apply on the bonus list',
        type: Object,
        example: { search: 'XYZ' },
    })
    @IsOptional()
    @IsObject()
    filters?: Record<string, any>;

    @ApiProperty({ description: 'Active tab for the bonus list', example: 'all' })
    @IsString()
    @IsNotEmpty()
    activeTab?: string;

    @ApiProperty({ description: 'Page number for pagination', example: 1 })
    @IsNumber()
    @Min(1)
    page?: number;

    @ApiPropertyOptional({ description: 'Limit per page for pagination', example: 10 })
    @IsNumber()
    @IsOptional()
    @Min(10)
    limit?: number;
}

export class DetailBonusDto {
    @ApiProperty({ description: 'The ID of the bonus to fetch details for', example: '67df1b308874ae98cdaea1b' })
    @IsString()
    @IsMongoId()
    @IsNotEmpty()
    _id: string;
}

export class UpdateBonusStatusDto {
    @ApiProperty({ description: 'The ID of the bonus to update', example: '67df1b308874ae98cdaea1b' })
    @IsNotEmpty()
    @IsMongoId()
    @IsString()
    _id: string;

    @ApiProperty({
        description: 'The new status of the bonus',
        enum: BonusStatus,
        example: BonusStatus.Inactive,
        default: BonusStatus.Active,
    })
    @IsNotEmpty()
    @IsEnum(BonusStatus)
    status: BonusStatus;
}


export class UpdatePointDto {
    @ApiProperty({ description: 'The ID of the bonus to update' })
    @IsNotEmpty()
    @IsString()
    @IsMongoId()
    _id: string;

    @ApiProperty({
        description: 'The Point category eligible for the bonus',
        type: [String],
        example: [{ "point_category_id": "67df1b308874ae98cdaea1b", "point_category_value": 10, "point_category_name": "ABC" }, { "point_category_id": "67df1b308874ae98cdaea1b", "point_category_value": 10, "point_category_name": "ABC" }],
    })
    @IsArray()
    @ArrayNotEmpty()
    product_point?: string[];
}

export class UpdateStatesDto {
    @ApiProperty({ description: 'The ID of the bonus to update', example: '67df1b308874ae98cdaea1b' })
    @IsNotEmpty()
    @IsString()
    @IsMongoId()
    _id: string;

    @ApiProperty({ description: 'The states eligible for the bonus', required: false })
    @IsArray()
    @IsString({ each: true })
    @ArrayNotEmpty()
    state?: string[];

    @ApiProperty({ description: 'The districts eligible for the bonus', required: false })
    @IsArray()
    @IsString({ each: true })
    @ArrayNotEmpty()
    district?: string[];
}
