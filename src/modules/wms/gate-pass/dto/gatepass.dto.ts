import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsNumber, IsEnum, IsOptional, ArrayNotEmpty, IsISO8601, ValidateNested, Max, Min, IsObject, IsNotEmpty, IsArray, IsMongoId } from 'class-validator';
import { Type } from 'class-transformer';
import { Types } from 'mongoose';

export enum activeTab {
    gatepass_genrated = 'gatepass_genrated',
    dispatched = 'dispatched',
}
export class GenrateGatePassDto {
    @ApiProperty({
        description: 'Invoice number',
        example: 'Inv-1',
    })
    @IsNotEmpty()
    @IsString()
    invoice_number: string;

    @ApiProperty({
        description: 'Driver Name',
        example: 'Ram',
    })
    @IsNotEmpty()
    @IsString()
    driver_name: string;

    @ApiPropertyOptional({
        description: 'E-way number',
        example: '76816298',
    })
    @IsOptional()
    @IsString()
    e_way_number: string;

    @ApiProperty({
        description: 'Mobile',
        example: '9999999999',
    })
    @IsNotEmpty()
    @IsString()
    mobile: string;

    @ApiProperty({
        description: 'Vehicle number',
        example: 'HR 51 DN 7654',
    })
    @IsNotEmpty()
    @IsString()
    vehicle_number: string;

    @ApiProperty({
        description: 'Transport Mode',
        example: 'Bike',
    })
    @IsNotEmpty()
    @IsString()
    transportation_mode: string;

    @ApiProperty({ type: Object, description: 'dispatch data in key-value format' })
    @IsNotEmpty()
    dispatch_data: Record<string, any>;
}

export class UpdateGatePassDto {
    @ApiProperty({
        description: 'Gatepass id',
        example: '6614e43fe7b2345b3d123abc',
    })
    @IsNotEmpty()
    @IsString()
    @IsMongoId()
    _id: string;

    @ApiProperty({
        description: 'Builty number',
        example: 'xyz',
    })
    @IsNotEmpty()
    @IsString()
    bilty_number: string;
}

export class ReadGatepassDto {
    @ApiPropertyOptional({
        description: 'Filters',
        type: Object,
        example: { field_name: 'abc' },
    })
    @IsOptional()
    @IsObject()
    filters?: Record<string, any>;

    @ApiPropertyOptional({
        type: String,
        description: 'Active tab used for UI filtering of List.',
        example: 'Pending',
    })
    @IsOptional()
    @IsEnum(activeTab)
    @IsString()
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

export class DetailGatepassDto {
    @ApiProperty({
        description: 'Product ID',
        example: '6614e43fe7b2345b3d123abc',
    })
    @IsOptional()
    @IsString()
    @IsMongoId()
    _id: string;
}

export class MasterBoxDetailDto {
    @ApiProperty({
        description: 'Product ID',
        example: '6614e43fe7b2345b3d123abc',
    })
    @IsOptional()
    @IsString()
    @IsMongoId()
    _id: string;

    @ApiProperty({
        description: 'Customer Category IDs for the Gift Gallery',
        type: [String],
        example: ['67df1b308874ae98cdaea1b', '67df1b308874ae98cdaea1b'],
    })
    @IsArray()
    @ArrayNotEmpty()
    @IsMongoId({ each: true })
    dispatch_id: string[];

    @ApiProperty({
        type: String,
        description: 'dispatch status.',
        example: 'Pending',
    })
    @IsNotEmpty()
    @IsString()
    dispatch_status?: string;

}