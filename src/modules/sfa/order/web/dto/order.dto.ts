import { Equals, IsArray, IsEnum, IsMongoId, IsNotEmpty, IsNumber, IsObject, IsOptional, IsString, Min, ValidateIf, } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
export enum SchemStatus {
    Active = 'Active',
    Inactive = 'Inactive',
}
export enum OrderStatus {
    Approved = 'Approved',
    Reject = 'Reject',
    Hold = 'Hold'
}
export class ReadShippingDto {
    @ApiProperty({ description: 'Customer id ', example: 'Distributor' })
    @IsMongoId()
    @IsNotEmpty()
    customer_id: string;
}
export class ReadProductDto {
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

    @ApiProperty({ description: 'Customer id ', example: '681cc03ddd76a494d85362be' })
    @IsMongoId()
    @IsNotEmpty()
    customer_id: string;

    @IsOptional()
    customer_segment: string;

    @IsOptional()
    brand: string
}
export class CreateOrderSchemeDto {
    @ApiProperty({ description: 'Scheme Id is an Optional Field', required: false })
    @IsString()
    @IsOptional()
    scheme_id: string;

    @ApiProperty({ description: 'Start date of the expense', example: '2024-03-10' })
    @IsNotEmpty()
    @IsString()
    date_from: string;

    @ApiProperty({ description: 'End date of the expense', example: '2024-03-15' })
    @IsNotEmpty()
    @IsString()
    date_to: string;

    @ApiProperty({ description: 'Scheme Description', example: 'Get 20 % Off' })
    @IsNotEmpty()
    @IsString()
    description: string;

    @ApiPropertyOptional({ description: 'Product Data' })
    @IsArray()
    @IsOptional()
    product_data?: Record<string, any>;
}

export class ReadOrderSchemeDto {
    @ApiProperty({
        description: 'Active tab for UI filtering',
        example: 'all',
    })
    @IsString()
    @IsNotEmpty()
    activeTab?: string;

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
    scheme_id: string;
}
export class SchemeStatusUpdateDto {
    @ApiProperty({
        description: 'The unique identifier of the scheme for fetch Detail',
        example: '64a15b4f0e3f1b0001a7c12b',
    })
    @IsNotEmpty()
    @IsMongoId()
    @IsString()
    _id: string;

    @ApiProperty({
        description: 'Status changes to Active or Inactive',
        example: SchemStatus.Inactive,
    })
    @IsNotEmpty()
    @IsString()
    @IsEnum(SchemStatus)
    status: string;
}

export class OrderSchemDocDto {
    @ApiProperty({
        description: 'Unique identifier for the payment',
        example: '609e126f61e3e53b7c2d672c',
    })
    @IsMongoId()
    @IsNotEmpty()
    _id: string;
}

export class CreateCartDto {
    @ApiProperty({ description: 'customer_id is a required field', required: false })
    @IsMongoId()
    @IsNotEmpty()
    customer_id: string;

    @ApiProperty({ description: 'shipping_address is a required field', required: false })
    @IsString()
    @IsNotEmpty()
    shipping_address: string;

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
    total_quantity: number;

    @ApiProperty({ description: 'mrp is a required field', required: false })
    @IsNumber()
    @IsNotEmpty()
    mrp: number;

    @ApiProperty({ description: 'uom is a optional field' })
    @IsString()
    @IsOptional()
    uom: string;

    @ApiProperty({ description: 'unit_price is a required field', required: false })
    @IsNumber()
    @IsNotEmpty()
    unit_price: number;

    @ApiProperty({ description: 'gross_amount is a required field', required: false })
    @IsNumber()
    @IsNotEmpty()
    gross_amount: number;

    @ApiProperty({ description: 'gst_amount is a required field', required: false })
    @IsNumber()
    @IsNotEmpty()
    gst_amount: number;

    @ApiProperty({ description: 'sub_total is a required field', required: false })
    @IsNumber()
    @IsNotEmpty()
    gst_percent: number;

    @ApiProperty({ description: 'net_amount_with_tax is a required field', required: false })
    @IsNumber()
    @IsNotEmpty()
    net_amount_with_tax: number;

    @ApiProperty({ description: 'discount_amount is a required field', required: false })
    @IsNumber()
    @IsNotEmpty()
    discount_amount: number;

    @ApiProperty({ description: 'discount_percent is a required field', required: false })
    @IsString()
    @IsNotEmpty()
    discount_percent: string;

    @IsString()
    @IsOptional()
    color: string;

    @IsString()
    @IsOptional()
    brand: string;

    @IsString()
    @IsOptional()
    _id: string;
}

export class ReadCartItemDto {
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
export class DeleteCustomerCart {
    @ApiProperty({ description: 'Cart Id is a required field', required: false })
    @IsMongoId()
    @IsNotEmpty()
    customer_id: string;
}

export class PrimaryOrderAddDto {
    @ApiProperty({ description: 'Customer Id is a required field', required: false })
    @IsMongoId()
    @IsNotEmpty()
    customer_id: string;

    @ApiProperty({ description: 'Order Create Remark is a required field', required: false })
    @IsString()
    @IsNotEmpty()
    order_create_remark: string;

    @ApiPropertyOptional({ description: 'chekin-id' })
    @IsMongoId()
    @IsOptional()
    visit_activity_id: string;

    @ApiPropertyOptional({ description: 'chekin-id' })
    @IsString()
    @IsOptional()
    order_type: string;
}
export class PrimaryOrderListDto {
    @ApiProperty({ description: 'activeTab is an optional field', required: false })
    @IsOptional()
    @IsString()
    activeTab: string;


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

    @ApiProperty({ description: 'Primaruy Order Item Row is a required field', required: false })
    @IsMongoId()
    @IsOptional()
    customer_id: string;

}
export class DeletePrimaryOrderItemDto {
    @ApiProperty({ description: 'Primaruy Order Item Row is a required field', required: false })
    @IsMongoId()
    @IsNotEmpty()
    _id: string;

    @ApiProperty({
        description: 'Flag indicating deletion. Must be 1.',
        example: 1,
    })
    @IsNotEmpty()
    @IsNumber()
    @Equals(1, { message: 'is_delete must be 1' })
    is_delete: number;
}
export class PrimaryOrderStatusChangeDto {
    @ApiProperty({ description: 'Primaruy Order Item Row is a required field', required: false })
    @IsMongoId()
    @IsNotEmpty()
    _id: string;

    @ApiProperty({ description: 'Status is a required field', required: true })
    @IsString()
    @IsNotEmpty()
    @IsEnum(OrderStatus)
    status: string;

    @ApiProperty({ description: 'Company Name is a required field', required: true })
    @IsString()
    @IsNotEmpty()
    @ValidateIf(o => o.status === OrderStatus.Approved)
    billing_company: string;

    @ApiProperty({ description: 'Reason is required if status is Reject' })
    @ValidateIf(o => o.status === OrderStatus.Reject)
    @IsString()
    @IsNotEmpty()
    reason: string;
}
