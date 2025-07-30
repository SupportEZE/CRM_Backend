import { IsString, IsNumber, IsOptional, MaxLength, Min, Max, IsDate, Equals, IsObject, IsNotEmpty, IsEnum, ValidateNested, ValidateIf, IsArray, IsMongoId } from 'class-validator';
import { Transform, Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class ReadGiftDto {
    @ApiPropertyOptional({
        description: 'Filters for the gift gallery',
        type: Object,
        example: { search: 'Xyz' },
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

    @ApiProperty({
        description: 'Page number for pagination',
        example: 1,
    })
    @IsNumber()
    page?: number;

    @ApiPropertyOptional({
        description: 'Limit for pagination',
        example: 10,
    })
    @IsOptional()
    @IsNumber()
    limit?: number;
}

export class CreateGiftGalleryLikeDto {
    @ApiProperty({
        description: 'The unique identifier of the gift gallery to like',
        example: '64a15b4f0e3f1b0001a7c12b',
    })
    @IsNotEmpty()
    @IsMongoId()
    @IsString()
    gift_id: string;
}

export class GiftDetailDto {
    @ApiProperty({
        description: 'The unique identifier of the gift gallery to fetch gift details',
        example: '64a15b4f0e3f1b0001a7c12b',
    })
    @IsNotEmpty()
    @IsMongoId()
    @IsString()
    gift_id: string;
}