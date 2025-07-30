import { Type } from 'class-transformer';
import { IsString, IsEnum, IsNumber, IsOptional, IsObject, IsNotEmpty, IsDate, IsArray, Min, Equals, ArrayMinSize, IsMongoId } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
export class ReadLeaderBoardDto {
    @ApiPropertyOptional({
        description: 'Filters to apply on the bonus list',
        type: Object,
        example: { search: 'value' },
    })
    @IsOptional()
    @IsObject()
    filters?: Record<string, any>;

    @ApiProperty({ description: 'Page number for pagination', example: 1 })
    @IsNumber()
    @Min(1)
    page?: number;

    @ApiPropertyOptional({ description: 'Limit per page for pagination', example: 10 })
    @IsOptional()
    @IsNumber()
    @Min(1)
    limit?: number;
}

export class DetailLeaderBoardDto {
    @ApiProperty({ description: 'Leaderboard ID to fetch details', example: '6614e43fe7b2345b3d123abc' })
    @IsMongoId()
    @IsNotEmpty()
    @IsString()
    _id: string;
}