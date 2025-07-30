import { IsString, IsOptional, IsArray, IsNumber, IsEnum, IsIn, ValidateIf, IsDate, Min, IsObject, IsMongoId, IsNotEmpty } from 'class-validator';
import { Transform } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';


export enum GiftType {
    GIFT = 'Gift',
    CASH = 'Cash',
    VOUCHER = 'Voucher',
}

export enum PaymentMode {
    BANK = 'BANK',
    UPI = 'UPI'
}

export class CreateRedeemRequestDto {
    @ApiProperty({ description: 'Gift ID to redeem.', example: '660cc1a3d7f42c001ff4ba29' })
    @IsMongoId()
    @IsNotEmpty()
    @IsString()
    gift_id: string;

    @ApiProperty({ description: 'Shipping address for the physical gift (only required for gift type).', example: '123 Main St, City, State, ZIP' })
    @ValidateIf(o => o.gift_type === GiftType.GIFT)
    @IsString()
    @IsNotEmpty()
    gift_shipping_address?: string;

    @ApiProperty({ description: 'Payment mode for cash redeem.', enum: PaymentMode, example: PaymentMode.UPI })
    @ValidateIf(o => o.gift_type === GiftType.CASH)
    @IsEnum(PaymentMode, { message: 'payment_mode must be BANK or UPI' })
    payment_mode?: PaymentMode;

    @ApiPropertyOptional({ description: 'Number of points to redeem (applicable for cash).', example: 150 })
    @ValidateIf(o => o.gift_type === GiftType.CASH)
    @IsNumber()
    @Min(1, { message: 'claim_point must be at least 1' })
    claim_point?: number;

    @ApiProperty({ description: 'Type of gift being redeemed.', enum: GiftType, example: GiftType.GIFT })
    @IsEnum(GiftType, { message: 'gift_type must be either gift or cash' })
    gift_type: GiftType;
}


export class ReadRedeemRequestDto {
    @ApiProperty({ description: 'Customer Id', example: '661cba2f4b2e39001c5f82c8' })
    @IsOptional()
    @IsMongoId()
    customer_id: string;

    @ApiPropertyOptional({
        description: 'Filters to apply on the badge list',
        type: Object,
        example: { filed_name: 'value' },
    })
    @IsOptional()
    @IsObject()
    filters?: Record<string, any>;

    @ApiProperty({
        description: 'Active tab for UI filtering',
        example: 'all',
    })
    @IsString()
    @IsIn(['Gift', 'Cash', 'Voucher'])
    @IsNotEmpty()
    activeTab?: string;

    @ApiPropertyOptional({ description: 'Page number for pagination', example: 1 })
    @IsNumber()
    @Min(1)
    page?: number = 1;

    @ApiPropertyOptional({ description: 'Limit of records per page', example: 10 })
    @IsOptional()
    @IsNumber()
    limit?: number = 10;
}