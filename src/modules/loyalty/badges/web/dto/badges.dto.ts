import { IsString, IsNumber, IsDate, IsDateString, IsISO8601, IsArray, IsOptional, IsNotEmpty, IsEnum, Min, IsObject, IsMongoId } from 'class-validator';
import { Transform } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export enum BadgesStatus {
    Active = 'Active',
    Inactive = 'Inactive',
}

export enum IncentiveType {
    GIFT = 'Gift',
    FIXED = 'Fixed Point',
}
export class CreateBadgesDto {
    @ApiProperty({ description: 'The title of the badge', example: 'Top Performer' })
    @IsNotEmpty()
    @IsString()
    title: string;

    @ApiProperty({ description: 'Eligible Points', example: 100 })
    @IsNotEmpty()
    @IsNumber()
    eligible_points: number;

    @ApiProperty({ description: 'Type of the badge', enum: IncentiveType, example: IncentiveType.GIFT })
    @IsNotEmpty()
    @IsString()
    @IsEnum(IncentiveType)
    incentive_type: IncentiveType;

    @ApiProperty({ description: 'Value of the badge', example: '500 INR Amazon Voucher' })
    @IsNotEmpty()
    @IsString()
    incentive_value: string;

    @ApiProperty({ description: 'Customer Category name', type: [String], example: ['Gold', 'Silver'] })
    @IsArray()
    @IsNotEmpty()
    customer_type_name?: string[];

    @ApiProperty({ description: 'Customer Category Id for the Gift gallery', type: [String], example: ['67df1b308874ae98cdaea1b', '67df1b308874ae98cdaea1b'] })
    @IsArray()
    @IsMongoId({ each: true })
    @IsNotEmpty()
    customer_type_id: string[];

    @ApiProperty({ description: 'The start date of the badge', type: Date, example: '2025-04-01T00:00:00Z' })
    @IsISO8601()
    @IsNotEmpty()
    start_date: Date;

    @ApiProperty({ description: 'The end date of the badge', type: Date, example: '2025-12-31T00:00:00Z' })
    @IsISO8601()
    @IsNotEmpty()
    end_date: Date;
}
export class UpdateBadgesDto {
    @ApiProperty({ description: 'The ID of the badge', example: '67df1b308874ae98cdaea1b' })
    @IsString()
    @IsMongoId()
    @IsNotEmpty()
    _id: string;

    @ApiProperty({ description: 'The title of the badge', example: 'Top Performer 2025' })
    @IsNotEmpty()
    @IsString()
    title: string;

    @ApiProperty({ description: 'Eligible Points', example: 150 })
    @IsNotEmpty()
    @IsNumber()
    eligible_points: number;

    @ApiProperty({ description: 'Type of the badge', enum: IncentiveType, example: IncentiveType.GIFT })
    @IsNotEmpty()
    @IsString()
    @IsEnum(IncentiveType)
    incentive_type: IncentiveType;

    @ApiProperty({ description: 'Value of the badge', example: '1000 INR Flipkart Voucher or 500 points.' })
    @IsNotEmpty()
    @IsString()
    incentive_value: string;

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

    @ApiProperty({ description: 'The start date of the badge', type: Date, example: '2025-01-01T00:00:00Z' })
    @IsISO8601()
    @IsNotEmpty()
    start_date: Date;

    @ApiProperty({ description: 'The end date of the badge', type: Date, example: '2025-12-31T00:00:00Z' })
    @IsISO8601()
    @IsNotEmpty()
    end_date: Date;
}

export class UpdateBadgesStatusDto {
    @ApiProperty({ description: 'The ID of the badge to update', example: '67df1b308874ae98cdaea1b' })
    @IsNotEmpty()
    @IsMongoId()
    @IsString()
    _id: string;

    @ApiProperty({ description: 'The new status of the badge', enum: BadgesStatus, example: BadgesStatus.Active })
    @IsNotEmpty()
    @IsEnum(BadgesStatus)
    status: BadgesStatus;
}

export class ReadBadgesDto {
    @ApiPropertyOptional({
        description: 'Filters to apply on the badge list',
        type: Object,
        example: { filed_name: 'value' },
    })
    @IsOptional()
    @IsObject()
    filters?: Record<string, any>;

    @ApiProperty({ description: 'Tab for the badge list', example: 'Active' })
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

export class DetailBadgesDto {
    @ApiProperty({ description: 'The ID of the badge to fetch details for', example: '67df1b308874ae98cdaea1b' })
    @IsString()
    @IsMongoId()
    @IsNotEmpty()
    _id: string;
}

export class DeleteBadgeDto {
  @ApiProperty({ description: 'Badge ID to fetch details', example: '6614e43fe7b2345b3d123abc' })
  @IsNotEmpty()
  @IsMongoId()
  @IsString()
  _id: string;
}