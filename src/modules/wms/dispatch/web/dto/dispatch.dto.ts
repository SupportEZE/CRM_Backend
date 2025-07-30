import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsNumber, IsEnum, IsOptional, IsISO8601, ValidateNested, Max, Min, IsObject, IsNotEmpty, IsArray, IsMongoId } from 'class-validator';
import { Type } from 'class-transformer';
import { Types } from 'mongoose';


export enum activeTab {
    order_packing = 'order_packing',
    gatepass_pending = 'gatepass_pending',
}

export class DispatchItemDTO {
    @ApiProperty({
        description: 'The unique identifier of the dispatch item.',
        example: '60d9b3b5f8d6f4d65f74e0fb',
    })
    @IsOptional()
    @IsString()
    item_id: Types.ObjectId;

    @ApiProperty({
        description: 'The quantity to be dispatched for this item.',
        example: 10,
    })
    @IsNumber()
    planned_qty: number;

    @ApiPropertyOptional({
        description: 'The total scanned quantity for the item.',
        example: 100,
    })
    @IsOptional()
    @IsNumber()
    scanned_quantity?: number;

    @ApiProperty({
        description: 'The unique identifier of the dispatch item.',
        example: '60d9b3b5f8d6f4d65f74e0fb',
    })
    @IsString()
    product_id: Types.ObjectId;

    @ApiProperty({
        description: 'The product code of the item.',
        example: 'P12345',
    })
    @IsString()
    product_code: string;

    @ApiProperty({
        description: 'The product name of the item.',
        example: 'Product XYZ',
    })
    @IsString()
    product_name: string;
}

export class CustomerInfoDTO {
    @ApiProperty({
        description: 'The unique identifier of the customer.',
        example: '60d9b3b5f8d6f4d65f74e0fb',
    })
    @IsString()
    _id: Types.ObjectId;

    @ApiProperty({
        description: 'The unique identifier of the customer type.',
        example: '60d9b3b5f8d6f4d65f74e0fb',
    })
    @IsString()
    customer_type_id: Types.ObjectId;

    @ApiProperty({
        description: 'Type of customer.',
        example: 'Distributor',
    })
    @IsString()
    @IsNotEmpty()
    customer_type_name: string;

    @ApiPropertyOptional({
        description: 'The company name of customer.',
        example: 'abc',
    })
    @IsString()
    @IsOptional()
    company_name: string;

    @ApiProperty({
        description: 'The name of customer.',
        example: 'abc',
    })
    @IsString()
    @IsNotEmpty()
    customer_name: string;

    @ApiPropertyOptional({
        description: 'The unique code of the customer.',
        example: 'cus-1',
    })
    @IsString()
    @IsOptional()
    customer_code: string;

    @ApiProperty({
        description: 'The mobile of the customer.',
        example: '9999999999',
    })
    @IsString()
    @IsNotEmpty()
    mobile: string;

    @ApiProperty({
        description: 'The mobile of the customer.',
        example: '9999999999',
    })
    @IsString()
    @IsNotEmpty()
    full_address: string;
}
export class OrderDetailDTO {
    @ApiProperty({
        description: 'The unique identifier of the dispatch item.',
        example: '60d9b3b5f8d6f4d65f74e0fb',
    })
    @IsString()
    order_id: Types.ObjectId;

    @ApiProperty({
        description: 'The unique identifier of the dispatch item.',
        example: 'PORD-1',
    })
    @IsString()
    order_no: string;

    @ApiProperty({ description: 'order date' })
    @IsISO8601()
    @IsNotEmpty()
    created_at: string;

    @ApiProperty({
        description: 'The Company name.',
        example: 'ABC Company',
    })
    @IsString()
    billing_company: string;

    @ApiProperty({
        description: 'The Company name.',
        example: 'ABC Company',
    })
    @IsString()
    shipping_address: string;

    @ApiProperty({
        description: 'The order detail object for which the dispatch plan is being created.',
        type: () => CustomerInfoDTO,
    })
    @IsObject()
    @ValidateNested()
    @Type(() => CustomerInfoDTO)
    customer_info: CustomerInfoDTO;
}
export class DispatchPlanDTO {
    @ApiProperty({
        description: 'The order detail object for which the dispatch plan is being created.',
        type: () => OrderDetailDTO,
    })
    @IsObject()
    @ValidateNested()
    @Type(() => OrderDetailDTO)
    orderDetail: OrderDetailDTO;

    @ApiProperty({
        description: 'Dispatch From',
        example: 'WareHouse',
    })
    @IsString()
    dispatch_from: string;

    @ApiProperty({
        description: 'Warehouse Id',
        example: 'WareHouse Id',
    })
    @IsOptional()
    @IsString()
    warehouse_id: string;

    @ApiProperty({
        description: 'List of items to be dispatched.',
        type: [DispatchItemDTO],
    })
    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => DispatchItemDTO)
    items: DispatchItemDTO[];
}

export class ExcessReturnDTO {
    @ApiProperty({
        description: 'The order ID for which the dispatch plan is being created.',
        example: '60d9b3b5f8d6f4d65f74e0fb',
    })
    @IsString()
    @IsNotEmpty()
    item_id: string;

    @ApiProperty({
        description: 'The order ID for which the dispatch plan is being created.',
        example: '60d9b3b5f8d6f4d65f74e0fb',
    })
    @IsString()
    @IsNotEmpty()
    dispatch_id: string;

    @ApiProperty({
        description: 'Total Quantity',
        example: 20,
    })
    @IsNumber()
    @IsNotEmpty()
    planned_qty: number;
}

export class DispatchReadDto {
    @ApiPropertyOptional({
        type: Object,
        description: 'Filters for data.',
        example: { field_name: 'value' },
    })
    @IsOptional()
    @IsObject()
    filters?: object;

    @ApiPropertyOptional({
        type: String,
        description: 'Active tab used for UI filtering of List.',
        example: 'Pending',
    })
    @IsOptional()
    @IsEnum(activeTab)
    @IsString()
    activeTab?: string;

    @ApiPropertyOptional({
        type: Number,
        description: 'Page number for pagination.',
        example: 1,
    })
    @IsNumber()
    @Min(1)
    page?: number;

    @ApiPropertyOptional({
        type: Number,
        description: 'Number of records per page for pagination.',
        example: 10,
        minimum: 10,
    })
    @IsOptional()
    @IsNumber()
    @Min(10)
    limit?: number;
}


export class DispatchDetailDto {
    @ApiProperty({
        description: 'Unique identifier for the dispatch list record.',
        example: '60ad0f486123456789abcdef',
    })
    @IsNotEmpty()
    @IsMongoId()
    @IsString()
    _id: string;
}

export class ItemsDetailDto {
    @ApiProperty({
        description: 'Unique identifier for the dispatch list record.',
        example: '60ad0f486123456789abcdef',
    })
    @IsNotEmpty()
    @IsMongoId()
    @IsString()
    dispatch_id: string;
}

export class DispatchQrDto {
    @ApiProperty({
        description: 'Unique identifier for the dispatch list record.',
        example: '60ad0f486123456789abcdef',
    })
    @IsNotEmpty()
    @IsMongoId()
    @IsString()
    dispatch_id: string;

    @ApiProperty({
        description: 'Qr code.',
        example: 'jnsdd9829721972',
    })
    @IsNotEmpty()
    @IsString()
    qr_code?: string;

    @ApiProperty({
        description: 'Qr code.',
        example: 'MBdjalj32aga721972',
    })
    @IsNotEmpty()
    @IsString()
    master_box_code?: string;
}
class MasterBoxDto {
    @ApiProperty({ description: 'Master Box ID', example: '60ad0f486123456789abcdf0' })
    @IsNotEmpty()
    @IsMongoId()
    _id: string;

    @ApiProperty({ description: 'QR Master Box Code', example: 'QRBOX0012345' })
    @IsNotEmpty()
    @IsString()
    qr_master_box_code: string;
}

export class ManualDispatchDto {
    @ApiProperty({
        description: 'Unique identifier for the dispatch.',
        example: '60ad0f486123456789abcdef',
    })
    @IsNotEmpty()
    @IsMongoId()
    @IsString()
    _id: string;

    @ApiProperty({
        description: 'Unique identifier for the dispatch Item.',
        example: '60ad0f486123456789abcdef',
    })
    @IsNotEmpty()
    @IsMongoId()
    @IsString()
    item_id: string;

    @ApiProperty({
        description: 'Unique identifier for the master box.',
        example: '60ad0f486123456789abcdef',
    })
    @IsNotEmpty()
    @IsMongoId()
    @IsString()
    master_box_id: string;

    @ApiProperty({ description: 'Master Box Information' })
    @IsNotEmpty()
    @IsString()
    master_box: string;

    @ApiProperty({ description: 'Planned Qty' })
    @IsNotEmpty()
    @IsNumber()
    planned_qty: number;
}