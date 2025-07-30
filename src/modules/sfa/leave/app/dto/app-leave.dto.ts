import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsObject,
  IsIn,
  IsNumber,
  Min,
  IsMongoId,
  Equals,
  IsISO8601
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export enum LeaveDuration {
  full_day = 'Full Day',
  half_day = 'Half Day',
}

export class AppCreateLeaveDto {
  @ApiProperty({
    description: 'Leave duration: Full Day or Half Day.',
    enum: LeaveDuration,
    required: true,
  })
  @IsString()
  @IsIn([LeaveDuration.full_day, LeaveDuration.half_day])
  leave_duration: LeaveDuration;

  @ApiProperty({ description: 'Type of leave.', required: true })
  @IsString()
  leave_type: string;

  @ApiProperty({ description: 'Subject of the leave request.', required: true })
  @IsString()
  subject: string;

  @ApiProperty({ description: 'Leave start date in ISO format.', required: true })
  @IsString()
  @IsISO8601()
  leave_start: string;

  @ApiProperty({ description: 'Leave end date in ISO format.', required: true })
  @IsString()
  @IsISO8601()
  leave_end: string;

  @ApiProperty({ description: 'Reason for the leave request.', required: true })
  @IsString()
  description: string;

}
export class AppUpdateLeaveStatusDto {
  @ApiProperty({ description: 'Leave request ID to update.', required: true })
  @IsNotEmpty()
  @IsString()
  _id: string;

  @ApiProperty({ description: 'Status of the leave request.', required: false })
  @IsNotEmpty()
  @IsString()
  senior_status?: string;

  @ApiProperty({ description: 'Remarks on status update', example: 'Approved by manager', required: false })
  @IsOptional()
  @IsString()
  senior_status_remark?: string;
}
export class AppDetailLeaveDto {
  @ApiProperty({ description: 'Leave request ID to fetch details.', required: true })
  @IsNotEmpty()
  @IsString()
  _id: string;
}

export class AppReadLeaveDto {
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

  @ApiProperty({ description: 'Choose Platform like app and web' })
  @IsOptional()
  @IsString()
  platform: string;
}


export class AppDeleteLeaveDto {
  @ApiProperty({ description: 'leave ID to delete', example: '609d9e8f2f79981e9a1e233b' })
  @IsNotEmpty()
  @IsMongoId()
  _id: string;

  @ApiProperty({
    description: 'Flag to confirm deletion',
    example: 1,
  })
  @IsNotEmpty()
  @IsNumber()
  @Equals(1, { message: 'is_delete must be 1' })
  is_delete: number;
}
