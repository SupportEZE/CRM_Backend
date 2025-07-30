import {
    IsArray, IsEnum, IsMongoId, IsNotEmpty, IsNumber, IsObject, IsOptional, IsString, Min, ValidateNested, IsIn, ValidateIf, Equals,
    ArrayMinSize,
    IsISO8601
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';
import { expenseTypeUnit } from '../../models/expense.model';
import { ValidateSubExpense } from 'src/decorators/validate-sub-expense.decorator';

export enum ExpenseType {
    Local = "Local",
    OutStation = "OutStation",
    Working = "Working",
    Travelling = "Travelling",
    New_Searching = "New Searching"
}
export class CreateExpenseDto {
    @ApiProperty({
        description: 'Expense Type: Local or Outstation.',
        enum: ExpenseType,
        required: true,
    })
    @IsString()
    @IsIn([ExpenseType.Local, ExpenseType.OutStation])
    expense_type: ExpenseType;

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
export class SubExpenseDto {
    @ApiProperty({ description: 'Expense Title', example: 'Jaipur Visit', required: true })
    @IsNotEmpty()
    @IsString()
    expense_type: string;

    @ApiProperty({ description: 'value of expense type km/amount', example: "km", required: true })
    @IsNotEmpty()
    @IsString()
    @IsEnum(expenseTypeUnit)
    expense_type_unit: string;

    @ApiProperty({ description: 'value of expense type (hotal - 1000)', example: 100, required: true })
    @IsNotEmpty()
    @IsNumber()
    expense_type_value: number;

    @ApiProperty({ description: 'km', example: 10 })
    @ValidateIf((o) => o.expense_type_unit === expenseTypeUnit.KM)
    @IsNumber()
    km: number;

    @ApiProperty({ description: 'Date of the expense', example: '2024-03-11' })
    @IsNotEmpty()
    @IsISO8601()
    expense_date: string;

    @ApiProperty({ description: 'Expense amount', example: 100 })
    @IsNumber()
    @IsNotEmpty()
    expense_amount: number;

    @ApiProperty({ description: 'Additional description', example: 'Cab fare from airport to hotel', required: false })
    @IsOptional()
    @IsString()
    description?: string;
}
export class CreateSubExpenseDto {
    @ApiProperty({ description: 'Type of the expense', example: 'Transport' })
    @IsString()
    @IsNotEmpty()
    expense_id: string;

    @ApiProperty({ type: [SubExpenseDto] })
    @ValidateNested({ each: true })
    @Type(() => SubExpenseDto)
    @IsArray()
    @ArrayMinSize(1)
    @ValidateSubExpense()
    sub_expense: SubExpenseDto[];
}
export class ReadExpenseDto {

    @ApiProperty({ description: 'Active tab (optional)', required: false })
    @IsOptional()
    @IsString()
    activeTab: string;

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
}
export class DetailExpenseDto {
    @ApiProperty({ description: 'Expense ID', example: '65d8b23a9c8d3e001f1a2b3c' })
    @IsNotEmpty()
    @IsString()
    _id: string;
}

export enum ExpenseStatus {
    Approved = 'Approved',
    Reject = 'Reject',
    Paid = 'Paid',
    Submitted = 'Submitted',
}

export enum SeniorExpenseStatus {
    Approved = 'Approved',
    Reject = 'Reject'
}

export class UpdateExpenseStatusDto {
    @ApiProperty({ description: 'Expense ID', example: '65d8b23a9c8d3e001f1a2b3c' })
    @IsNotEmpty()
    @IsString()
    _id: string;

    @ApiProperty({
        description: 'Updated status of the expense',
        enum: ExpenseStatus,
        example: ExpenseStatus.Approved
    })
    @IsOptional()
    @IsEnum(ExpenseStatus)
    status: string;

    @ApiProperty({ description: 'Remarks on status update', example: 'Approved by manager', required: false })
    @IsOptional()
    @IsString()
    status_remark?: string;

    @ApiProperty({ description: 'Total approved amount', example: 1500, required: false })
    @ValidateIf(o => o.status === ExpenseStatus.Approved)
    @IsOptional()
    @IsNumber()
    approved_amount?: number;

    @ApiProperty({ description: 'Reason is required if status is Reject', required: false })
    @ValidateIf(o => o.status === ExpenseStatus.Reject)
    @IsString()
    @IsOptional()
    reason: string;

    @ApiProperty({
        description: 'Updated status of the expense',
        enum: SeniorExpenseStatus,
        example: SeniorExpenseStatus.Approved
    })
    @IsOptional()
    @IsEnum(SeniorExpenseStatus)
    senior_status: string;

    @ApiProperty({ description: 'Remarks on status update', example: 'Approved by manager', required: false })
    @IsOptional()
    @IsString()
    senior_status_remark?: string;
}
export class DeleteSUbExpenseDto {

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
export class DeleteExpenseImageDto {
    @ApiProperty({ description: 'Unique ID of the expense.', example: '61324abcdef1234567890abc' })
    @IsNotEmpty()
    @IsMongoId()
    @IsString()
    _id: string;
}
export class expensDocsDto {
    @ApiProperty({
        description: 'Unique identifier for the payment',
        example: '609e126f61e3e53b7c2d672c',
    })
    @IsMongoId()
    @IsNotEmpty()
    _id: string;
}

export class expensePolicyDto {
    @ApiProperty({
        description: 'user id',
        example: '609e126f61e3e53b7c2d672c',
    })
    @IsMongoId()
    @IsNotEmpty()
    user_id: string;
}