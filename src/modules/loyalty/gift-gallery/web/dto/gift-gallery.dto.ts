import { IsString, IsNumber, IsISO8601, ArrayNotEmpty, IsOptional, MaxLength, Min, Max, IsDate, Equals, IsObject, IsNotEmpty, IsEnum, ValidateNested, ValidateIf, IsArray, isNotEmpty, IsMongoId } from 'class-validator';
import { Transform, Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export enum GiftType {
    Cash = 'Cash',
    Gift = 'Gift',
    Voucher = 'Voucher',
}

export enum VoucherType {
    Available = 'Available',
    Used = 'used'
}

export class CreateGiftGalleryDto {
    @ApiProperty({ description: 'Login type ID for the gift gallery', example: 1 })
    @IsNumber()
    @IsNotEmpty()
    login_type_id: number;

    @ApiProperty({
        description: 'Customer Category Names',
        type: [String],
        example: ['Plumber'],
    })
    @IsArray()
    @IsString({ each: true })
    customer_type_name?: string[];

    @ApiProperty({
        description: 'Customer Category IDs for the Gift Gallery',
        type: [String],
        example: ['67df1b308874ae98cdaea1b', '67df1b308874ae98cdaea1b'],
    })
    @IsArray()
    @ArrayNotEmpty()
    @IsMongoId({ each: true })
    customer_type_id: string[];

    @ApiProperty({
        description: 'voucher type id',
        type: String,
        example: '67df1b308874ae98cdaea1b',
    })
    @ValidateIf(o => o.gift_type === GiftType.Voucher)
    @IsNotEmpty()
    @IsMongoId()
    voucher_type_id: string;

    @ApiProperty({
        description: 'The type of gift',
        enum: GiftType,
        example: GiftType.Gift,
    })
    @IsEnum(GiftType)
    @IsNotEmpty()
    gift_type: GiftType;

    @ApiProperty({
        description: 'The title of the gift gallery',
        example: 'Summer Rewards',
    })
    @IsString()
    @IsNotEmpty()
    title: string;

    @ApiProperty({
        description: 'Start range for cash gifts (only applies when gift_type is Cash)',
        example: 100,
    })
    @ValidateIf(o => o.gift_type === GiftType.Cash)
    @IsNumber()
    range_start?: number;

    @ApiProperty({
        description: 'End range for cash gifts (only applies when gift_type is Cash)',
        example: 500,
    })
    @ValidateIf(o => o.gift_type === GiftType.Cash)
    @IsNumber()
    range_end?: number;

    @ApiProperty({
        description: 'Point value for the cash gift (only applies when gift_type is Cash)',
        example: 200,
    })
    @ValidateIf(o => o.gift_type === GiftType.Cash)
    @IsNumber()
    @IsNotEmpty()
    point_value?: number;

    @ApiPropertyOptional({
        description: 'Description required for gift type "Gift"',
        example: 'My favorite brand',
    })
    @IsString()
    @IsOptional()
    description?: string;

    @ApiProperty({ description: 'The start date of the gift', type: Date, example: '2025-04-01T00:00:00Z' })    
    @IsOptional()
    date_from: Date;

    @ApiProperty({ description: 'The end date of the gift', type: Date, example: '2025-12-31T00:00:00Z' })
    @IsOptional()
    date_to: Date;
}

export class ReadGiftGalleryDto {
    @ApiPropertyOptional({
        description: 'Filters for the gift gallery query',
        type: Object,
        example: { field_name: 'abc' },
    })
    @IsOptional()
    @IsObject()
    filters?: Record<string, any>;

    @ApiProperty({
        description: 'Active tab for UI filtering',
        example: 'all',
    })
    @IsString()
    @IsNotEmpty()
    activeTab?: string;

    @ApiProperty({ description: 'Pagination page number', example: 1 })
    @IsNumber()
    @Min(1)
    page?: number;

    @ApiPropertyOptional({ description: 'Pagination limit', example: 10 })
    @IsOptional()
    @IsNumber()
    @Min(10)
    limit?: number;
}

export class GiftGalleryDetailDto {
    @ApiProperty({
        description: 'The unique identifier of the gift gallery',
        example: '64a15b4f0e3f1b0001a7c12b',
    })
    @IsNotEmpty()
    @IsMongoId()
    @IsString()
    _id: string;
}

export class UpdateGiftGalleryStatusDto {
    @ApiProperty({
        description: 'The unique identifier of the gift gallery to update',
        example: '64a15b4f0e3f1b0001a7c12b',
    })
    @IsNotEmpty()
    @IsMongoId()
    @IsString()
    _id: string;

    @ApiProperty({
        description: 'New status of the gift gallery',
        example: 'Inactive',
    })
    @IsNotEmpty()
    @IsString()
    status: string;
}
export class DeleteGiftDto {
    @ApiProperty({
        description: 'The unique identifier of the gift gallery to be deleted',
        example: '64a15b4f0e3f1b0001a7c12b',
    })
    @IsNotEmpty()
    @IsMongoId()
    @IsString()
    _id: string;
}

export class GiftDocsDto {
    @ApiProperty({
        description: 'The unique identifier of the gift gallery',
        example: '64a15b4f0e3f1b0001a7c12b',
    })
    @IsNotEmpty()
    @IsMongoId()
    @IsString()
    _id: string;
}

export class ReadVoucherDto {
    @ApiProperty({
        description: 'The unique identifier of the gift gallery',
        example: '64a15b4f0e3f1b0001a7c12b',
    })
    @IsNotEmpty()
    @IsMongoId()
    @IsString()
    gift_id: string;

    @ApiPropertyOptional({
        description: 'Filters for the gift gallery query',
        type: Object,
        example: { field_name: 'abc' },
    })
    @IsOptional()
    @IsObject()
    filters?: Record<string, any>;

    @ApiProperty({ description: 'Pagination page number', example: 1 })
    @IsNumber()
    @Min(1)
    page?: number;

    @ApiPropertyOptional({ description: 'Pagination limit', example: 10 })
    @IsOptional()
    @IsNumber()
    @Min(10)
    limit?: number;
}

export class CreateVoucherDto {
    @ApiProperty({
        description: 'Gift Id.',
        type: String,
        example: '67df1b308874ae98cdaea1b',
    })
    @IsString()
    @IsNotEmpty()
    @IsMongoId()
    gift_id: string;

    @ApiProperty({ description: 'voucher expiry date' })
    @IsISO8601()
    @IsNotEmpty()
    expiry_date: string;

    @ApiProperty({
        description: 'The voucher code',
        example: 'GXTERDIEVYHSOSWTDVW',
    })
    @IsString()
    @IsNotEmpty()
    voucher_code: string;
}

export class DeleteVoucherDto {
    @ApiProperty({
        description: 'The unique identifier of the gift gallery',
        example: '64a15b4f0e3f1b0001a7c12b',
    })
    @IsNotEmpty()
    @IsMongoId()
    @IsString()
    _id: string;
}

export class DetailGiftGalleryDto {
    @ApiProperty({
        description: 'The unique identifier of the gift gallery',
        example: '64a15b4f0e3f1b0001a7c12b',
    })
    @IsNotEmpty()
    @IsMongoId()
    @IsString()
    _id: string;
}

