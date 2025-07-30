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
export class DetailOrderSchmeDto {
    @ApiProperty({
        description: 'The unique identifier of the scheme for fetch Detail',
        example: '64a15b4f0e3f1b0001a7c12b',
    })
    @IsNotEmpty()
    @IsMongoId()
    @IsString()
    _id: string;
}

export class AppReadCartItemDto {
    @ApiProperty({ description: 'Customer Id is a required field', required: false })
    @IsMongoId()
    @IsOptional()
    customer_id: string;

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
export class AppCreateCartDto {
    @ApiProperty({ description: 'Customer Id is a required field', required: false })
    @IsMongoId()
    @IsOptional()
    customer_id: string;

    @ApiProperty({ description: 'category_name is a required field', required: false })
    @IsString()
    @IsNotEmpty()
    category_name: string;

    @ApiProperty({ description: 'product_id is a required field', required: false })
    @IsMongoId()
    @IsNotEmpty()
    product_id: string;

    @ApiProperty({ description: 'product_name is a required field', required: false })
    @IsString()
    @IsNotEmpty()
    product_name: string;

    @ApiProperty({ description: 'product_code is a required field', required: false })
    @IsString()
    @IsNotEmpty()
    product_code: string;

    @ApiProperty({ description: 'quantity is a required field', required: false })
    @IsNumber()
    @IsNotEmpty()
    quantity: number;

    @ApiProperty({ description: 'mrp is a required field', required: false })
    @IsNumber()
    @IsNotEmpty()
    mrp: number;

    @ApiProperty({ description: 'uom is a required field', required: false })
    @IsString()
    @IsNotEmpty()
    uom: string;

    @ApiProperty({ description: 'unit_price is a required field', required: false })
    @IsNumber()
    @IsNotEmpty()
    unit_price: number;

    @ApiProperty({ description: 'sub_total is a required field', required: false })
    @IsNumber()
    @IsNotEmpty()
    sub_total: number;

    @ApiProperty({ description: 'sub_total is a required field', required: false })
    @IsNumber()
    @IsNotEmpty()
    gst: number;

    @ApiProperty({ description: 'sub_total is a required field', required: false })
    @IsNumber()
    @IsNotEmpty()
    gst_percent: number;

    @ApiProperty({ description: 'net_amount is a required field', required: false })
    @IsNumber()
    @IsNotEmpty()
    net_amount: number;

    @ApiProperty({ description: 'discount_amount is a required field', required: false })
    @IsNumber()
    @IsNotEmpty()
    discount_amount: number;

    @ApiProperty({ description: 'discount_percent is a required field', required: false })
    @IsString()
    @IsNotEmpty()
    discount_percent: string;
}
export class AppDeleteCustomerCart {
    @ApiProperty({ description: 'Cart Id is a required field', required: false })
    @IsMongoId()
    @IsOptional()
    customer_id: string;
}

