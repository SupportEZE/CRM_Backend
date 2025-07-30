import {
    IsEnum, IsMongoId, IsNotEmpty, IsNumber,
    IsObject, IsOptional, IsString, Min, ValidateNested,
    ArrayMinSize
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsUniqueProductId } from 'src/decorators/popgift-product-validator';


export class AppReadPopGiftDto{
    @ApiPropertyOptional({
        description: 'Filter criteria for reading products.',
        type: Object,
        example: { field_name: 'value' },
    })
    @IsOptional()
    @IsObject()
    filters?: object;
    
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

export class ReadCustomer {
    @ApiProperty({ example: '609e126f61e3e53b7c2d672c', description: 'Customer type identifier' })
    @IsMongoId()
    @IsNotEmpty()
    customer_type_id: string;
    
    @ApiProperty({ example: 'sunil sir', description: 'Search key to filter dropdown list' })
    @IsOptional()
    @IsString()
    search_key: string;
}

export class PopGiftItemDto {
    @ApiProperty({ example: '68093882a996d98f628a93ae', description: 'Product ID' })
    @IsMongoId()
    @IsNotEmpty()
    product_id: string;
    
    @ApiProperty({ example: 'Samsung Watch', description: 'Product name' })
    @IsString()
    @IsNotEmpty()
    product_name: string;
    
    @ApiProperty({ example: 3, description: 'Quantity of product in transaction' })
    @IsNumber()
    @Min(1, { message: 'transaction_qty must be a positive number' })
    transaction_qty: number;
}
export class PopGiftTransactionDto {
    @ApiProperty({ example: '648fcd8737b1c8829b435abc', description: 'Assigned to user ID' })
    @IsMongoId()
    @IsNotEmpty()
    assigned_to_id: string;
    
    @ApiProperty({ example: 'John Doe', description: 'Name of the assignee' })
    @IsString()
    @IsNotEmpty()
    assigned_to_name: string;
    
    @ApiProperty({ example: 2, description: '' })
    @IsNumber()
    @IsNotEmpty()
    login_type_id: number;
    
    @ApiProperty({ example: 'Delivered on April 23', description: 'Delivery note or remarks' })
    @IsString()
    delivery_note: string;
    
    @ApiProperty({ example: '86393838338', description: 'for send otp' })
    @IsString()
    @IsNotEmpty()
    mobile: string;
    
    @ApiProperty({ example: '987652', description: 'for verification' })
    @IsNumber()
    @IsOptional()
    otp: number;
    
    @ApiProperty({
        type: [PopGiftItemDto],
        description: 'List of products in the gift transaction',
    })
    @IsNotEmpty()
    @ArrayMinSize(1)
    @IsUniqueProductId()
    @ValidateNested({ each: true })
    @Type(() => PopGiftItemDto)
    pop_gifts: PopGiftItemDto[];
    
    @ApiPropertyOptional({ description: 'chekin-id' })
    @IsMongoId()
    @IsOptional()
    visit_activity_id: string;
}
export enum ActiveTab {
    INCOMING = 'incoming',
    OUTGOING = 'outgoing',
}
export class DetailDto{
    @ApiProperty({ example: '68093882a996d98f628a93ae', description: 'Product ID' })
    @IsMongoId()
    @IsNotEmpty()
    product_id: string;
    
    @ApiProperty({
        example: ActiveTab.INCOMING,
        description: 'Tab type, either "incoming" or "outgoing"',
        enum: ActiveTab,
    })
    @IsNotEmpty()
    @IsEnum(ActiveTab)
    active_tab: ActiveTab;
    
    @ApiPropertyOptional({
        description: 'Filter criteria for reading products.',
        type: Object,
        example: { field_name: 'value' },
    })
    @IsOptional()
    @IsObject()
    filters?: object;
    
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