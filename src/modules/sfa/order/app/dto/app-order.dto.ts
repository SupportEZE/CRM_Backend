import {
    IsNumber, IsOptional, IsString, Min, IsObject, IsMongoId, IsNotEmpty,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class readCustomer {
    @ApiProperty({ example: '609e126f61e3e53b7c2d672c', description: 'Customer type identifier' })
    @IsMongoId()
    @IsNotEmpty()
    customer_type_id: string;

    @ApiProperty({ example: 'sunil sir', description: 'Search key to filter dropdown list' })
    @IsOptional()
    @IsString()
    search_key: string;
}

export class ReadOrderSchemeDto {
    @ApiPropertyOptional({
        description: 'Filter criteria for reading products.',
        type: Object,
        example: { field_name: 'value' },
    })
    @IsOptional()
    @IsObject()
    filters?: object;

    @ApiPropertyOptional({
        description: 'Sorting criteria for reading products.',
        type: Object,
        example: { product_name: 1 },
    })
    @IsOptional()
    @IsObject()
    sorting?: object;

    @ApiPropertyOptional({
        description: 'Page number for pagination.',
        type: Number,
        example: 1,
    })
    @IsNumber()
    @Min(1)
    page?: number;

    @ApiPropertyOptional({
        description: 'Limit for the number of products per page.',
        type: Number,
        example: 10,
    })
    @IsOptional()
    @IsNumber()
    @Min(10)
    limit?: number;
}


