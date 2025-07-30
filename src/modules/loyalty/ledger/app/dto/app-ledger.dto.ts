import { IsString, IsNumber, IsOptional, IsISO8601, IsArray, MaxLength, Min, Max, IsDate, IsObject, IsNotEmpty, IsEnum, ValidateNested, IsMongoId } from 'class-validator';
import { Transform, Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class AppReadLedgerDto {
    @ApiProperty({ description: 'Customer Id', required: false })
    @IsMongoId()
    @IsOptional()
    customer_id: string;

    @ApiPropertyOptional({
        description: 'Filters to apply.',
        type: Object,
        example: { search: 'xyz' },
    })
    @IsOptional()
    @IsObject()
    filters?: Record<string, any>;

    @ApiProperty({
        description: 'Page number for pagination',
        example: 1,
    })
    @IsNumber()
    @Min(1)
    page?: number;

    @ApiPropertyOptional({
        description: 'Number of items per page',
        example: 10,
    })
    @IsOptional()
    @IsNumber()
    @Min(1)
    limit?: number;
}

class DateRange {
    @IsISO8601()
    @IsOptional()
    start?: string;

    @IsISO8601()
    @IsOptional()
    end?: string;
}

export class ReadWalletDto {
    @ApiPropertyOptional({
        type: DateRange,
        example: {
            start: '2023-12-31T18:30:00.000Z',
            end: '2024-01-31T18:29:59.000Z',
        },
        description: 'Custom date range to filter wallet transactions',
    })
    @ValidateNested()
    @Type(() => DateRange)
    @IsOptional()
    custom_date_range?: DateRange;
}

