import {
  IsString,
  IsNumber,
  IsOptional,
  Min,
  IsMongoId,
  IsObject,
  IsNotEmpty,
  ValidateIf,
  IsIn,
  IsEnum,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export enum LeaveMode {
  full_day = 'Full Day',
  half_day = 'Half Day',
}

export enum LeaveStatus {
  Reject = 'Rejected',
  Approved = 'Approved',
}

export class CreateLeaveMasterDto {
  @ApiProperty({ description: 'The user ID For Leave Mater Creating.' })
  @IsMongoId()
  @IsNotEmpty()
  user_id: string;

  @ApiProperty({ description: 'The user Name For Leave Mater Creating.' })
  @IsString()
  @IsNotEmpty()
  user_name: string;

  @ApiProperty({ description: 'Leave start date in ISO format.' })
  @IsString()
  leave_start: string;

  @ApiProperty({ description: 'Leave end date in ISO format.' })
  @IsNotEmpty()
  @IsString()
  leave_end: string;

  @ApiProperty({ description: 'Form data related to the leave request.', required: false })
  @IsObject()
  form_data?: Record<string, any>;
}

export class UpdateLeaveMasterDto {
  @ApiProperty({ description: 'The leave master ID to be updated.' })
  @IsNotEmpty()
  @IsString()
  _id: string;

  @ApiProperty({ description: 'User ID of the person applying for leave.' })
  @IsNotEmpty()
  @IsMongoId()
  user_id: string;

  @ApiProperty({ description: 'The user Name For Leave Mater Creating.' })
  @IsString()
  @IsNotEmpty()
  user_name: string;

  @ApiProperty({ description: 'Leave start date in ISO format.', required: false })
  @IsOptional()
  @IsString()
  leave_start: string;

  @ApiProperty({ description: 'Leave end date in ISO format.' })
  @IsNotEmpty()
  @IsString()
  leave_end: string;

  @ApiProperty({ description: 'Form data related to the leave request.', required: false })
  @IsObject()
  @IsOptional()
  form_data?: Record<string, any>;
}

export class ReadLeaveMasterDto {
  @ApiProperty({ description: 'Filters to apply on leave masters.', required: false })
  @IsOptional()
  @IsObject()
  filters: object;

  @ApiProperty({ description: 'Sorting options for the leave masters.', required: false })
  @IsOptional()
  @IsObject()
  sorting: object;

  @ApiProperty({ description: 'Page number for pagination.', required: false })
  @IsOptional()
  @IsNumber()
  @Min(1)
  page: number;

  @ApiProperty({ description: 'Limit for pagination (number of records per page).', required: false })
  @IsOptional()
  @IsNumber()
  @Min(10)
  limit: number;
}

export class DeleteLeaveMasterDto {
  @ApiProperty({ description: 'The leave master ID to be deleted.' })
  @IsNotEmpty()
  @IsString()
  _id: string;

  @ApiProperty({ description: 'Indicates whether the record should be deleted or not.' })
  @IsNotEmpty()
  @IsNumber()
  is_delete: number;
}

export class ReadLeaveDto {
  @ApiProperty({ description: 'Filters to apply on leaves.', required: false })
  @IsOptional()
  @IsObject()
  filters: object;

  @ApiProperty({ description: 'Sorting options for leaves.', required: false })
  @IsOptional()
  @IsObject()
  sorting: object;

  @ApiProperty({ description: 'Page number for pagination.', required: false })
  @IsOptional()
  @IsNumber()
  @Min(1)
  page: number;

  @ApiProperty({ description: 'Limit for pagination (number of records per page).', required: false })
  @IsOptional()
  @IsNumber()
  @Min(10)
  limit: number;
}


export class CreateLeaveDto {
  @ApiProperty({
    description: 'Leave Mode: Full Day or Half Day.',
    enum: LeaveMode,
    required: true,
  })
  @IsString()
  @IsIn([LeaveMode.full_day, LeaveMode.half_day])
  leave_duration: LeaveMode;

  @ApiProperty({ description: 'Type of leave.', required: true })
  @IsString()
  leave_type: string;

  @ApiProperty({ description: 'The user ID For Leave Mater Creating.' })
  @IsString()
  user_id: string;

  @ApiProperty({ description: 'The user ID For Leave Mater Creating.' })
  @IsString()
  @IsOptional()
  user_name: string;

  @ApiProperty({ description: 'Subject of the leave request.', required: true })
  @IsString()
  subject: string;

  @ApiProperty({ description: 'Leave start date in ISO format.', required: true })
  @IsString()
  leave_start: string;

  @ApiProperty({ description: 'Leave end date in ISO format.', required: true })
  @IsString()
  leave_end: string;

  @ApiProperty({ description: 'Reason for the leave request.', required: true })
  @IsString()
  @IsOptional()
  reason: string;

  @ApiProperty({
    description: 'Form data related to the leave (optional).',
    required: false,
  })
  @IsObject()
  @IsNotEmpty()
  form_data?: Record<string, any>;
}


export class LeaveDetailDto {
  @ApiProperty({ description: 'Leave request ID to fetch details.', required: true })
  @IsNotEmpty()
  @IsString()
  leave_id: string;
}

export class UpdateLeaveStatusDto {
  @ApiProperty({ description: 'Leave request ID to fetch details.', required: true })
  @IsNotEmpty()
  @IsString()
  _id: string;

  @ApiProperty({
    description: 'Leave Status: Approved or Reject.',
    enum: LeaveStatus,
  })
  @IsString()
  @IsOptional()
  @IsIn([LeaveStatus.Approved, LeaveStatus.Reject])
  status: LeaveStatus;


  @ApiProperty({
    description: 'Reason For Reject',
  })
  @ValidateIf(o => o.status === LeaveStatus.Reject)
  @IsString()
  @IsNotEmpty()
  reason: string;

  @ApiProperty({
    description: 'Updated status of the expense',
    enum: LeaveStatus,
    example: LeaveStatus.Approved
  })
  @IsOptional()
  @IsEnum(LeaveStatus)
  senior_status: string;

  @ApiProperty({ description: 'Remarks on status update', example: 'Approved by manager', required: false })
  @IsOptional()
  @IsString()
  senior_status_remark?: string;

}

export class DeleteLeaveDto {
  @ApiProperty({ description: 'Leave request ID to fetch details.', required: true })
  @IsNotEmpty()
  @IsString()
  _id: string;
}

export class ReadDocDto {
  @ApiProperty({ description: 'Doc ID to fetch details.', required: true })
  @IsNotEmpty()
  @IsString()
  _id: string;
}

