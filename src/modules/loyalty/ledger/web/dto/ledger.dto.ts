import { IsString, IsNumber, IsOptional, IsArray, MaxLength, Min, Max, IsDate, IsObject, IsNotEmpty, IsEnum, ValidateNested, IsMongoId, isMongoId } from 'class-validator';
import { Transform, Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export enum CreationType {
    SCAN = 'Scan',
    MANUAL = 'Manual',
    REDEEM = 'Redeem',
    BONUS = 'Bonus',
    REFUND = 'Refund',
    REFERRAL = 'Referral',
    DEDUCT = 'Deduct',
}

export class ReadLedgerDto {
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

    @ApiPropertyOptional({ description: 'Limit per page for pagination', example: 10 })
    @IsNumber()
    @IsOptional()
    @Min(10)
    limit?: number;

    @ApiProperty({
        description: 'Customer ID for whom the ledger is queried',
        type: String,
        example: '660cc1a3d7f42c001ff4ba29',
    })
    @IsString()
    @IsMongoId()
    @IsNotEmpty()
    customer_id: string;
}

export class CreateLedgerDto {
    @ApiProperty({
        description: 'Customer ID related to this ledger transaction',
        example: '660cc1a3d7f42c001ff4ba29',
    })
    @IsString()
    @IsMongoId()
    @IsNotEmpty()
    customer_id: string;

    @ApiProperty({
        description: 'Customer name associated with the transaction',
        example: 'John Doe',
    })
    @IsString()
    @IsNotEmpty()
    customer_name: string;

    @ApiProperty({
        description: 'Login type ID used by the customer',
        example: 10,
    })
    @IsNumber()
    @IsNotEmpty()
    login_type_id: number;

    @ApiProperty({
        description: 'Customer type ID',
        example: '67df1b308874ae98cdaea1b',
    })
    @IsString()
    @IsMongoId()
    @IsNotEmpty()
    customer_type_id: string;

    @ApiProperty({
        description: 'Transaction type (e.g., "credit", "debit")',
        example: 'credit',
    })
    @IsString()
    @IsNotEmpty()
    transaction_type: string;

    @ApiProperty({
        description: 'Points to be credited or debited',
        example: 100,
    })
    @IsNumber()
    @Min(1)
    points: number;

    @ApiProperty({
        description: 'Remark or note for the transaction',
        example: 'Points credited for product scan',
    })
    @IsString()
    @IsNotEmpty()
    remark: string;
}

export class WalletLedgerDto {
    @ApiProperty({
        description: 'Customer ID to fetch the wallet ledger for',
        example: '660cc1a3d7f42c001ff4ba29',
    })
    @IsString()
    @IsMongoId()
    @IsNotEmpty()
    customer_id: string;
}


