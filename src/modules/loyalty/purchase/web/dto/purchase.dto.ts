import { IsString, IsNumber, IsMongoId, IsArray, IsNotEmpty, ValidateNested, IsOptional, IsObject, Min, IsEnum, ValidateIf } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { PurchaseStatus } from '../../models/purchase.model';

class SelectedItemDto {
    @IsString()
    @IsNotEmpty()
    label: string;

    @IsString()
    @IsNotEmpty()
    value: string;

    @IsString()
    @IsNotEmpty()
    product_code: string;

    @IsNumber()
    @IsNotEmpty()
    qty: number;

    @IsNumber()
    @IsNotEmpty()
    point_value: number;
}
export class CreatePurchaseDto {
    @ApiProperty()
    @IsNotEmpty()
    @IsString()
    bill_date?: Date;

    @IsNotEmpty()
    @IsNumber()
    bill_amount: number;

    @IsNotEmpty()
    @IsString()
    bill_number: string;

    @IsNotEmpty()
    @IsNumber()
    login_type_id: number;

    @IsNotEmpty()
    @IsMongoId()
    customer_type_id: string;

    @IsNotEmpty()
    @IsMongoId()
    customer_id: string;

    @IsNotEmpty()
    @IsString()
    customer_type_name: string;

    @IsNotEmpty()
    @IsString()
    customer_name: string;

    @IsOptional()
    @IsString()
    purchase_from: string;

    @IsOptional()
    @IsString()
    purchase_from_name: string;

    @IsNotEmpty()
    @IsString()
    @IsOptional()
    remark: string;

    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => SelectedItemDto)
    selectedItems: SelectedItemDto[];
}

export class ReadPurchaseDto {

    @ApiProperty({ description: 'Customer Id is a required field', required: false })
    @IsMongoId()
    @IsOptional()
    _id: string;

    @ApiProperty({ description: 'Customer Id is a required field', required: false })
    @IsMongoId()
    @IsOptional()
    customer_id: string;

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
export class StatusUpdateDto {
    @ApiProperty({
        description: 'Unique identifier',
        example: '609e126f61e3e53b7c2d672c',
    })
    @IsMongoId()
    @IsNotEmpty()
    _id: string;

    @ApiProperty({
        description: 'Status Update',
        example: 'Reject,Approved',
    })
    @IsNotEmpty()
    @IsEnum(PurchaseStatus)
    status: PurchaseStatus;

    @ApiProperty({
        description: 'Status Update',
        example: 'Reject,Approved',
    })
    @ValidateIf(o => o.status === PurchaseStatus.Reject)
    @IsNotEmpty()
    reason: string;

    @ApiProperty({
        description: 'Status Update',
        example: 'Reject,Approved',
    })
    @ValidateIf(o => o.status === PurchaseStatus.Approved)
    @IsNotEmpty()
    approved_point: string;
}
export class ReadPurchaseProductDto {
    @ApiProperty({
        description: 'Unique identifier',
        example: '609e126f61e3e53b7c2d672c',
    })
    @IsMongoId()
    @IsNotEmpty()
    customer_type_id: string;

    @ApiPropertyOptional({
        description: 'Filters for dropdowns.',
        type: Object,
        example: { field_name: 'value' },
    })
    @IsOptional()
    @IsObject()
    filters?: object;

    @ApiPropertyOptional({
        description: 'Sorting criteria for dropdowns.',
        type: Object,
        example: { dropdown_name: 1 },
    })
    @IsOptional()
    @IsObject()
    sorting?: object;

    @ApiPropertyOptional({
        description: 'Sorting criteria for dropdowns.',
        type: Object,
        example: { dropdown_name: 1 },
    })
    @IsOptional()
    @IsString()
    dropdown_name?: string;

    @ApiPropertyOptional({
        description: 'Limit for the number of dropdowns per page.',
        type: Number,
        example: 10,
    })
    @IsOptional()
    @IsNumber()
    @Min(10)
    limit?: number;
}