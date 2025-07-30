import { IsString, IsNumber, IsDate, IsDateString, IsMongoId, IsISO8601, IsArray, IsOptional, IsNotEmpty, IsEnum, Min, IsObject } from 'class-validator';
import { Transform } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class AppReadBadgesDto {
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

export class AppBadgesDocsDto {
    @ApiProperty({
        description: 'The unique identifier of the gift gallery to fetch Badges docs',
        example: '64a15b4f0e3f1b0001a7c12b',
    })
    @IsNotEmpty()
    @IsMongoId()
    @IsString()
    gift_id: string;
}
