import {
    IsString,
    IsOptional,
    IsNumber,
    IsIn,
    ValidateIf,
    IsISO8601,
    IsObject, IsEnum,
    IsMongoId, Min, IsDate, IsNotEmpty
} from 'class-validator';
import { Transform } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export enum GiftType {
    GIFT = 'Gift',
    CASH = 'Cash',
    VOUCHER = 'Voucher',
}

export enum Status {
    APPROVED = 'Approved',
    REJECT = 'Reject',
}

export enum TransferStatus {
    Transfered = 'Transfered',
    SHIPPED = 'Shipped',
    REJECT = 'Reject',
}


export enum ActiveTab {
    PENDING = 'Pending',
    APPROVED = 'Approved',
    REJECT = 'Reject',
}

export enum ShippingType {
    COURIER = 'Courier',
    DIRECT = 'Hand Courier',
}

export class ReadRedeemDto {
    @ApiPropertyOptional({ description: 'Active tab for filtering', enum: ActiveTab, example: ActiveTab.PENDING })
    @IsNotEmpty()
    @IsString()
    @IsEnum(ActiveTab)
    activeTab?: string;

    @ApiPropertyOptional({ description: 'Type of redeem - Cash or Gift', example: 'gift' })
    @IsString()
    @IsNotEmpty()
    redeemType?: string;

    @ApiPropertyOptional({
        description: 'Filters to apply on the badge list',
        type: Object,
        example: { filed_name: 'value' },
    })
    @IsOptional()
    @IsObject()
    filters?: Record<string, any>;

    @ApiProperty({ description: 'Page number for pagination', example: 1 })
    @IsNumber()
    @Min(1)
    page?: number;

    @ApiPropertyOptional({ description: 'Limit of records per page', example: 10 })
    @IsOptional()
    @IsNumber()
    limit?: number = 10;
}

export class StatusRedeemDto {
    @ApiProperty({ description: 'Mongo ID of the redeem entry' })
    @IsNotEmpty()
    @IsMongoId()
    _id: string;

    @ApiProperty({ description: 'New status for the redeem', enum: Status })
    @IsEnum(Status)
    status: Status;

    @ApiPropertyOptional({ description: 'Optional reason for rejection' })
    @IsOptional()
    @IsString()
    status_reason?: string;
}

export class GiftReceivedRedeemDto {
    @ApiProperty({ description: 'Mongo ID of the redeem entry' })
    @IsNotEmpty()
    @IsMongoId()
    _id: string;


    @ApiProperty({ description: 'The start date of the badge', type: Date, example: '2025-04-01T00:00:00Z' })
    @IsISO8601()
    @IsNotEmpty()
    received_date: Date;
}

export class TransferRedeemDto {
    @ApiProperty({ description: 'Mongo ID of the redeem entry' })
    @IsNotEmpty()
    @IsMongoId()
    _id: string;

    @ApiProperty({ description: 'Status of the transfer (e.g., Pending)', enum: TransferStatus })
    @IsNotEmpty()
    @IsString()
    @IsEnum(TransferStatus)
    transfer_status: string;

    @ApiPropertyOptional({ description: 'Remark for the transfer' })
    @IsOptional()
    @IsString()
    transfer_remark?: string;

    @ValidateIf(o => o.gift_type === GiftType.CASH)
    @ApiPropertyOptional({ description: 'Transfer type (NEFT, UPI, etc.) - for cash gifts only' })
    @IsOptional()
    @IsString()
    transfer_type?: string;

    @ValidateIf(o => o.gift_type === GiftType.CASH)
    @ApiPropertyOptional({ description: 'Transaction number - for cash gifts only' })
    @IsOptional()
    @IsString()
    transaction_no?: string;

    @ValidateIf(o => o.gift_type === GiftType.CASH)
    @ApiProperty({
        description: 'Transaction Date',
        type: Date,
        example: '2025-04-01T00:00:00Z',
    })
    @IsISO8601()
    @IsNotEmpty()
    transaction_date?: string;

    @ValidateIf(o => o.gift_type === GiftType.CASH)
    @ApiPropertyOptional({ description: 'The start date of the badge', type: Date, example: '2025-04-01T00:00:00Z' })
    @IsNotEmpty()
    @IsISO8601()
    @IsNotEmpty()
    received_date: Date;

    @ValidateIf(o => o.gift_type === GiftType.GIFT)
    @ApiPropertyOptional({ description: 'Type of shipping method', enum: ShippingType })
    @IsOptional()
    @IsEnum(ShippingType)
    shipping_type?: ShippingType;

    @ValidateIf(o => o.shipping_type === ShippingType.COURIER)
    @ApiPropertyOptional({ description: 'Shipping address for courier deliveries' })
    @IsOptional()
    @IsString()
    shipping_address?: string;

    @ValidateIf(o => o.shipping_type === ShippingType.COURIER)
    @ApiPropertyOptional({ description: 'Courier service name used' })
    @IsOptional()
    @IsString()
    shipping_courier?: string;

    @ValidateIf(o => o.shipping_type === ShippingType.COURIER)
    @ApiPropertyOptional({ description: 'Tracking number for the shipment' })
    @IsOptional()
    @IsString()
    shipping_tracking?: string;

}
