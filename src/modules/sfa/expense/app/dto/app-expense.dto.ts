import {
    IsArray, IsEnum, IsMongoId, IsNotEmpty, IsNumber,
    IsObject, IsOptional, IsString, Min, ValidateNested, IsIn, Equals,
    ValidateIf
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { ExpenseStatus, SeniorExpenseStatus } from '../../web/dto/expense.dto';

export enum ExpenseType {
    Local = "Local",
    OutStation = "Outstation",
    Working = "Working",
    Travelling = "Travelling",
    New_Searching = "New Searching"
}

export enum ActiveTab {
    SELF = 'self',
    TEAM = 'team'
}
export class AppCreateExpenseDto {
    @ApiProperty({
        description: 'Expense Type: Local or Outstation.',
        enum: ExpenseType,
        required: true,
    })
    @IsString()
    @IsIn([ExpenseType.Local, ExpenseType.OutStation])
    expense_type: ExpenseType;

    @ApiProperty({ description: 'User ID who is creating the expense', example: '65b9e4c7a7b3a1d2f8b45678' })
    @IsOptional()
    user_id: string;

    @ApiProperty({ description: 'Description of the expense', example: 'Business trip to NYC' })
    @IsNotEmpty()
    @IsString()
    description: string;

    @ApiProperty({ description: 'Start date of the expense', example: '2024-03-10' })
    @IsNotEmpty()
    @IsString()
    start_date: string;

    @ApiProperty({ description: 'End date of the expense', example: '2024-03-15' })
    @IsNotEmpty()
    @IsString()
    end_date: string;

    @ApiProperty({ description: 'Expense status', example: 'Submitted' })
    @IsOptional()
    @IsString()
    status: string;

    @ApiProperty({ description: 'Remarks on the status', example: 'Waiting for approval', required: false })
    @IsOptional()
    @IsString()
    status_remark?: string;
}
export class AppReadExpenseDto {
    @ApiProperty({ description: 'month number', example: 1, required: false })
    @IsOptional()
    @IsNumber()
    month: number;

    @ApiProperty({ description: 'year number', example: 2025, required: false })
    @IsOptional()
    @IsNumber()
    year: number;

    @ApiProperty({ description: 'Filter criteria', required: false, example: { status: 'approved' } })
    @IsOptional()
    @IsObject()
    filters: object;

    @ApiProperty({ description: 'Sorting criteria', required: false, example: { created_at: 'desc' } })
    @IsOptional()
    @IsObject()
    sorting: object;

    @ApiProperty({ description: 'Page number for pagination', example: 1, required: false })
    @IsOptional()
    @IsNumber()
    @Min(1)
    page: number;

    @ApiProperty({ description: 'Limit per page', example: 10, required: false })
    @IsOptional()
    @IsNumber()
    @Min(10)
    limit: number;

    @ApiProperty({})
    @IsOptional()
    @IsString()
    @IsEnum(ActiveTab)
    activeTab?: ActiveTab;
}
export class AppExpenseSummaryDto {
    @ApiProperty({ description: 'month number', example: 1, required: false })
    @IsOptional()
    @IsNumber()
    month: number;

    @ApiProperty({ description: 'year number', example: 2025, required: false })
    @IsOptional()
    @IsNumber()
    year: number;

    @ApiProperty({})
    @IsOptional()
    @IsString()
    @IsEnum(ActiveTab)
    activeTab?: ActiveTab
}
export class AppExpenseSummaryResponseDto {
    @ApiProperty({ description: 'Total claimed amount', example: 5000 })
    @IsNumber()
    total_claim_amount: number;

    @ApiProperty({ description: 'Total approved amount', example: 4000 })
    @IsNumber()
    total_approved_amount: number;

    @ApiProperty({ description: 'Total paid amount', example: 3500 })
    @IsNumber()
    total_paid_amount: number;
}
export class AppDeleteMainExpensedto {
    @ApiProperty({ description: 'Expense ID', example: '65d8b23a9c8d3e001f1a2b3c' })
    @IsNotEmpty()
    @IsMongoId()
    expense_id: string;

    @ApiProperty({
        description: 'Flag indicating whether the gift gallery should be deleted. Must be 1.',
        required: true,
        example: 1,
    })
    @IsNotEmpty()
    @IsNumber()
    @Equals(1, { message: 'is_delete must be 1' })
    is_delete: number;
}
export class AppDeleteSUbExpenseDto {
    @ApiProperty({ description: 'Sub Expense Row Id', example: '65d8b23a9c8d3e001f1a2b3c' })
    @IsNotEmpty()
    @IsMongoId()
    _id: string;

    @ApiProperty({
        description: 'Flag indicating whether the gift gallery should be deleted. Must be 1.',
        required: true,
        example: 1,
    })
    @IsNotEmpty()
    @IsNumber()
    @Equals(1, { message: 'is_delete must be 1' })
    is_delete: number;
}

export class AppExpenseDto {
    @ApiProperty({
        description: 'Unique identifier for the payment',
        example: '609e126f61e3e53b7c2d672c',
    })
    @IsMongoId()
    @IsNotEmpty()
    _id: string;
}

export class AppUpdateExpenseStatusDto {
    @ApiProperty({ description: 'Expense ID', example: '65d8b23a9c8d3e001f1a2b3c' })
    @IsNotEmpty()
    @IsString()
    _id: string;

    @ApiProperty({
        description: 'Updated senior status of the expense (required only for TEAM)',
        enum: SeniorExpenseStatus,
        example: SeniorExpenseStatus.Approved,
    })
    @ValidateIf(o => o.update_type === ActiveTab.TEAM)
    @IsNotEmpty()
    @IsEnum(SeniorExpenseStatus)
    senior_status: string;

    @ApiProperty({
        description: 'Remarks on senior status update (required if TEAM + Reject)',
        example: 'Rejected by manager',
        required: false,
    })
    @ValidateIf(
        o => o.update_type === ActiveTab.TEAM && o.senior_status === SeniorExpenseStatus.Reject
    )
    @IsNotEmpty()
    @IsString()
    senior_status_remark?: string;

    @ApiProperty({
        description: 'Updated final status of the expense (required only for SELF)',
        enum: ExpenseStatus,
        example: ExpenseStatus.Approved,
    })
    @ValidateIf(o => o.update_type === ActiveTab.SELF)
    @IsNotEmpty()
    @IsEnum(ExpenseStatus)
    status: string;

    @ApiProperty({
        description: 'Remarks on final status update',
        example: 'Approved by manager',
        required: false,
    })
    @ValidateIf(o => o.update_type === ActiveTab.SELF)
    @IsOptional()
    @IsString()
    status_remark?: string;

    @ApiProperty({
        description: 'Reason is required if status is Reject and update_type is SELF',
        required: false,
    })
    @ValidateIf(
        o => o.update_type === ActiveTab.SELF && o.status === ExpenseStatus.Reject
    )
    @IsNotEmpty()
    @IsString()
    reason: string;

    @ApiProperty({
        description: 'Update type - self or team',
        enum: ActiveTab,
        example: ActiveTab.SELF,
    })
    @IsNotEmpty()
    @IsEnum(ActiveTab)
    update_type: ActiveTab;
}

