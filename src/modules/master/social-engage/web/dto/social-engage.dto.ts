import {
    IsString, IsNotEmpty, IsOptional, IsNumber, IsObject, Min, IsIn, IsArray,
    ValidateNested,
    ValidateIf,
    IsMongoId
} from 'class-validator';
import { Transform, Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

enum Status {
    APPROVED = 'Approved',
    REJECT = 'Reject',
}

enum Status_2 {
    ACTIVE = 'Active',
    INACTIVE = 'Inactive',
}

export class CreateDto {
    @ApiProperty({ description: 'Title of the request.', example: 'My Title' })
    @IsNotEmpty()
    @IsString()
    title: string;

    @ApiProperty({ description: 'Social media URL.', example: 'https://example.com' })
    @IsNotEmpty()
    @IsString()
    social_url: string;

    @ApiProperty({ description: 'Web icon URL or identifier.', example: 'web-icon.png' })
    @IsNotEmpty()
    @IsString()
    web_icon: string;

    @ApiProperty({ description: 'Text color for the web platform.', example: '#000000' })
    @IsNotEmpty()
    @IsString()
    web_text_color: string;

    @ApiProperty({ description: 'App icon URL or identifier.', example: 'app-icon.png' })
    @IsNotEmpty()
    @IsString()
    app_icon: string;

    @ApiProperty({ description: 'Text color for the app platform.', example: '#FFFFFF' })
    @IsNotEmpty()
    @IsString()
    app_text_color: string;

    @ApiProperty({ description: 'Points associated with the request.', example: 100 })
    @IsNotEmpty()
    @IsNumber()
    points: number;

    @ApiProperty({ description: 'Number of subscribers.', example: 500 })
    @IsNotEmpty()
    @IsNumber()
    subscriber: number;
}


export class UpdateDto {
    @ApiProperty({ description: 'Unique ID of the request.', example: '60ad0f486123456789abcdef' })
    @IsNotEmpty()
    @IsString()
    @IsMongoId()
    _id: string;

    @ApiProperty({
        description: 'Status of the request.',
        enum: Status_2,
        example: Status_2.ACTIVE,
    })
    @IsNotEmpty()
    @IsIn(Object.values(Status_2))
    status: string;

    @ApiProperty({ description: 'Social media URL.', example: 'https://example.com' })
    @IsOptional()
    @IsString()
    social_url: string;

    @ApiProperty({ description: 'Points associated with the request.', example: 150 })
    @IsOptional()
    @IsNumber()
    points: number;

    @ApiProperty({ description: 'Number of subscribers.', example: 600 })
    @IsOptional()
    @IsNumber()
    subscriber: number;
}
export class ReadPendingRequestDto {
    @ApiPropertyOptional({
        description: 'Filters for retrieving pending requests.',
        example: { field_name: "value" },
    })
    @IsOptional()
    @IsObject()
    filters: object;

    @ApiPropertyOptional({
        description: 'Page number for pagination.',
        example: 1,
    })
    @IsNumber()
    @Min(1)
    page: number;

    @ApiPropertyOptional({
        description: 'Number of items per page.',
        example: 10,
    })
    @IsOptional()
    @IsNumber()
    @Min(10)
    limit: number;
}

export class RequestStatusDto {
    @ApiProperty({ description: 'Unique ID of the request.', example: '60ad0f486123456789abcdef' })
    @IsNotEmpty()
    @IsMongoId()
    @IsString()
    _id: string;

    @ApiProperty({
        description: 'Status of the request.',
        enum: Status,
        example: Status.APPROVED,
    })
    @IsNotEmpty()
    @IsIn(Object.values(Status))
    status: string;
}

export class ReadPerformanceDto {
    @ApiPropertyOptional({
        description: 'Filters for retrieving performance data.',
        example: { field_name: "value" },
    })
    @IsOptional()
    @IsObject()
    filters: object;

    @ApiPropertyOptional({ example: '609e126f61e3e53b7c2d672c', description: 'Customer Id Optional for filter' })
    @IsOptional()
    @IsMongoId()
    @IsString()
    _id: string;

    @ApiPropertyOptional({
        description: 'Page number for pagination.',
        example: 1,
    })
    @IsNumber()
    @Min(1)
    page: number;

    @ApiPropertyOptional({
        description: 'Number of items per page.',
        example: 10,
    })
    @IsOptional()
    @IsNumber()
    @Min(10)
    limit: number;
}
export class SocialDocsDto {
    @ApiProperty({ example: '609e126f61e3e53b7c2d672c', description: 'Document ID or associated record ID' })
    @IsNotEmpty()
    @IsMongoId()
    @IsString()
    _id: string;
}