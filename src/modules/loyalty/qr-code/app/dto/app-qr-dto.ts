import { IsNotEmpty, IsString, IsArray, ValidateNested, IsBoolean, IsNumber, IsObject, IsOptional, IsMongoId } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
export class ScanQrDto {
    @ApiProperty({
        description: 'QR code string to be scanned',
        example: 'QR123ABC456',
        required: true,
    })
    @IsString()
    @IsNotEmpty()
    qr_code: string;

    @ApiProperty({
        description: 'Latitude of the scan location',
        example: 28.6139,
        required: true,
    })
    @IsNumber()
    @IsNotEmpty()
    lattitude: number;

    @ApiProperty({
        description: 'Longitude of the scan location',
        example: 77.2090,
        required: true,
    })
    @IsNumber()
    @IsNotEmpty()
    longitude: number;

    @ApiProperty({
        description: 'Whether the scan was done manually or not',
        example: false,
        required: true,
    })
    @IsBoolean()
    @IsNotEmpty()
    is_manual_scan: boolean;
}
export class PointHistoryDto {

    @ApiProperty({ description: 'Customer Id', required: false })
    @IsMongoId()
    @IsOptional()
    customer_id: string;

    @ApiPropertyOptional({
        description: 'Filter object to apply on point history',
        type: Object,
        example: { search: "Xyz" },
    })
    @IsOptional()
    @IsObject()
    filters?: Record<string, any>;

    @ApiPropertyOptional({
        description: 'Limit number of records per page (default is 10)',
        example: 10,
    })
    @IsOptional()
    @IsNumber()
    limit?: number = 10;

    @ApiPropertyOptional({
        description: 'Page number for pagination (default is 1)',
        example: 1,
    })
    @IsNumber()
    page?: number = 1;
}
