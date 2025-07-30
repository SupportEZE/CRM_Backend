import { Equals, IsEnum, IsMongoId, IsNotEmpty, IsNumber, IsObject, IsOptional, IsString, Min, ValidateIf, } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
export enum OrderStatus {
    Approved = 'Approved',
    Reject = 'Reject',
    Hold = 'Hold'
}
export class CreateSecondaryCartDto {
    @ApiProperty({ description: 'Customer Id is a required field', required: false })
    @IsMongoId()
    @IsNotEmpty()
    customer_id: string;
    
    @ApiProperty({ description: 'delivery_from is a required field', required: false })
    @IsMongoId()
    @IsNotEmpty()
    delivery_from: string;
    
    @ApiProperty({ description: 'gst_type is a optional field', required: false })
    @IsString()
    @IsOptional()
    gst_type: string;
    
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
    
    @ApiProperty({ description: 'uom', required: false })
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
    @IsNumber()
    @IsNotEmpty()
    discount_percent: string;
}
export class ReadSecondaryCartItemDto {
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
export class ReadSecondarOrderProductDto {
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
}
export class SecondaryOrderAddDto {
    @ApiProperty({ description: 'Customer Id is a required field', required: false })
    @IsMongoId()
    @IsNotEmpty()
    customer_id: string;
    
    @ApiProperty({ description: 'Order Create Remark is a required field', required: false })
    @IsString()
    @IsNotEmpty()
    order_create_remark: string;
    
    @ApiProperty({ description: 'gst_type is a required field', required: false })
    @IsString()
    @IsNotEmpty()
    gst_type: string;
    
    @ApiPropertyOptional({ description: 'chekin-id' })
    @IsMongoId()
    @IsOptional()
    visit_activity_id: string;
}

export class SecondaryOrderListDto {
    
    @ApiProperty({ description: 'Customer Id is a required field', required: false })
    @IsMongoId()
    @IsOptional()
    customer_id: string;
    
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
}
export class DeleteSecondaryOrderItemDto {
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
export class SecondaryOrderStatusChangeDto {
    @ApiProperty({ description: 'Primaruy Order Item Row is a required field', required: false })
    @IsMongoId()
    @IsNotEmpty()
    _id: string;
    
    @ApiProperty({ description: 'Status is a required field', required: true })
    @IsString()
    @IsNotEmpty()
    @IsEnum(OrderStatus)
    status: string;
    
    @ApiProperty({ description: 'Reason is required if status is Reject' })
    @ValidateIf(o => o.status === OrderStatus.Reject)
    @IsString()
    @IsNotEmpty()
    reason: string;
}
