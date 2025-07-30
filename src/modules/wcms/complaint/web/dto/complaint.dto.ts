import {
  IsMongoId, IsNotEmpty, IsNumber,
  IsObject, IsOptional, IsString, Min,
  IsISO8601,
  ValidateIf
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export enum ComplaintStatus {
  Pending = 'Pending',
  Close = 'Close',
  Cancel = 'Cancel',
  All = 'All'
}
export class CreateComplaintDto {
  @ApiProperty({ description: 'Customer name', example: 'John Doe' })
  @IsString()
  @IsOptional()
  customer_name?: string;

  @ApiProperty({ description: 'Customer mobile number', example: '9876543210' })
  @IsString()
  @IsNotEmpty()
  customer_mobile: string;

  @ApiProperty({ description: 'Customer mobile number', example: '9876543210' })
  @IsString()
  @IsOptional()
  complaint_no: string;

  @ApiProperty({ description: 'Alternate mobile number', example: '9123456780', required: false })
  @IsString()
  @IsOptional()
  alternate_mobile_no?: string;

  @ApiProperty({ description: 'State', example: 'UTTAR PRADESH' })
  @IsString()
  @IsOptional()
  state?: string;

  @ApiProperty({ description: 'District', example: 'KANPUR NAGAR' })
  @IsString()
  @IsOptional()
  district?: string;

  @ApiProperty({ description: 'City', example: 'KANPUR' })
  @IsString()
  @IsOptional()
  city?: string;

  @ApiProperty({ description: 'Pincode', example: 876786 })
  @IsNumber()
  @IsOptional()
  pincode?: number;

  @ApiProperty({ description: 'Full address', example: '123 Main Street, KANPUR, UTTAR PRADESH, 876786' })
  @IsString()
  @IsOptional()
  address?: string;

  @IsObject()
  @IsOptional()
  form_data?: Record<string, any>;

  @ApiProperty({ description: 'Service engineer ID (Mongo ObjectId)' })
  @IsMongoId()
  @IsNotEmpty()
  service_engineer_id: string;

  @ApiProperty({ description: 'Service engineer name', example: 'Service User - Piyush' })
  @IsString()
  @IsOptional()
  service_engineer_name?: string;

  @ApiProperty({ description: 'Service engineer name', example: 'Service User - Piyush' })
  @IsString()
  @IsOptional()
  service_engineer_mobile: string;

  @ApiProperty({ description: 'Nature of the problem', example: 'leakage' })
  @IsString()
  @IsOptional()
  nature_of_problem?: string;

  @ApiProperty({ description: 'Priority of the complaint', example: 'High' })
  @IsString()
  @IsOptional()
  priority?: string;

  @ApiProperty({ description: 'Scheduled visit date', example: '2025-06-01T18:30:00.000Z' })
  @IsISO8601()
  @IsNotEmpty()
  visit_date: Date;

  @IsISO8601()
  @IsOptional()
  date_of_purchase: Date;

  @IsString()
  @IsOptional()
  product_description?: string;
}
export class ReadComplaintDto {
  @ApiPropertyOptional({
    type: Object,
    description: 'Filters for querying tickets, such as status, priority, or category.',
    example: { field_name: 'value' },
  })
  @IsOptional()
  @IsObject()
  filters?: object;

  @ApiPropertyOptional({
    type: Object,
    description: 'Sorting options for querying tickets.',
    example: { created_at: 'desc' },
  })
  @IsOptional()
  @IsObject()
  sorting?: object;

  @ApiPropertyOptional({
    type: String,
    description: 'Active tab used for UI filtering of tickets.',
    example: 'Open Tickets',
  })
  @IsOptional()
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
export class AssignEngineerDto {
  @ApiProperty({ description: 'Priority of the complaint', example: 'High' })
  @IsNotEmpty()
  @IsString()
  _id: string;

  @ApiProperty({ description: 'Priority of the complaint', example: 'High' })
  @IsNotEmpty()
  @IsString()
  service_engineer_id: string;

  @ApiProperty({ description: 'Priority of the complaint', example: 'High' })
  @IsNotEmpty()
  @IsString()
  service_engineer_name: string;

  @ApiProperty({ description: 'Priority of the complaint', example: 'High' })
  @IsString()
  @IsNotEmpty()
  service_engineer_mobile: string;

  @IsOptional()
  @IsString()
  priority: string;

  @IsISO8601()
  @IsOptional()
  visit_date: Date;

  

}
export class UpdateComplaintDto {
  @ApiProperty({ description: 'The ID of the row to update.' })
  @IsMongoId()
  _id: string;

  @ApiProperty({ description: 'Customer name', example: 'John Doe' })
  @IsString()
  @IsOptional()
  customer_name?: string;

  @ApiProperty({ description: 'Customer mobile number', example: '9876543210' })
  @IsString()
  @IsNotEmpty()
  customer_mobile: string;

  @ApiProperty({ description: 'Alternate mobile number', example: '9123456780', required: false })
  @IsString()
  @IsOptional()
  alternate_mobile_no?: string;

  @ApiProperty({ description: 'State', example: 'UTTAR PRADESH' })
  @IsString()
  @IsOptional()
  state?: string;

  @ApiProperty({ description: 'District', example: 'KANPUR NAGAR' })
  @IsString()
  @IsOptional()
  district?: string;

  @ApiProperty({ description: 'City', example: 'KANPUR' })
  @IsString()
  @IsOptional()
  city?: string;

  @ApiProperty({ description: 'Pincode', example: 876786 })
  @IsNumber()
  @IsOptional()
  pincode?: number;

  @ApiProperty({ description: 'Full address', example: '123 Main Street, KANPUR, UTTAR PRADESH, 876786' })
  @IsString()
  @IsOptional()
  address?: string;

  @IsObject()
  @IsOptional()
  form_data?: Record<string, any>;

  @ApiProperty({ description: 'Service engineer ID (Mongo ObjectId)' })
  @IsMongoId()
  @IsNotEmpty()
  service_engineer_id: string;

  @ApiProperty({ description: 'Service engineer name', example: 'Service User - Piyush' })
  @IsString()
  @IsOptional()
  service_engineer_name?: string;

  @ApiProperty({ description: 'Nature of the problem', example: 'leakage' })
  @IsString()
  @IsOptional()
  nature_of_problem?: string;

  @ApiProperty({ description: 'Priority of the complaint', example: 'High' })
  @IsString()
  @IsOptional()
  priority?: string;

  @ApiProperty({ description: 'Scheduled visit date', example: '2025-06-01T18:30:00.000Z' })
  @IsISO8601()
  @IsNotEmpty()
  visit_date: Date;

  @IsISO8601()
  @IsOptional()
  date_of_purchase: Date;

  @IsString()
  @IsOptional()
  product_description?: string;
}
export class ComplaintStatusUpdateDto {
  @ApiProperty({ description: 'Row Id of Complaint', required: true })
  @IsNotEmpty()
  @IsMongoId()
  _id: string;

  @ApiProperty({ description: 'status is a required field', required: true })
  @IsNotEmpty()
  @IsString()
  status: string;

  @ApiProperty({ description: 'reason is optional field', required: true })
  @ValidateIf(o => o.status === ComplaintStatus.Cancel)
  @IsOptional()
  @IsString()
  reason: string;
}
export class LocatioDto {
  @ApiProperty({ description: 'row id of Site is required field', required: true })
  @IsNotEmpty()
  @IsMongoId()
  _id: string;

  @ApiPropertyOptional({ example: 2000.230, description: 'Latitude coordinate of customer location' })
  @IsOptional()
  @IsNumber()
  lat?: number;

  @ApiPropertyOptional({ example: 2000.230, description: 'Longitude coordinate of customer location' })
  @IsOptional()
  @IsNumber()
  long?: number;
}
export class GetExistComplaintDto {
  @IsNotEmpty()
  @IsString()
  customer_mobile: string;
}
export class RescheduleDateDto {

  @IsNotEmpty()
  @IsString()
  _id: string;

  @ApiProperty({ description: 'Scheduled visit date', example: '2025-06-01T18:30:00.000Z' })
  @IsISO8601()
  @IsNotEmpty()
  visit_date: Date;

  @IsNotEmpty()
  @IsString()
  reschedule_reason: string;
}

export class SaveCommentDto {
  @ApiProperty({ description: 'comment is a required field', required: true })
  @IsNotEmpty()
  @IsString()
  comment: string;

  @ApiProperty({ description: 'comment is a required field', required: true })
  @IsNotEmpty()
  @IsString()
  row_id: string;
}

export class ReadCommentsDto {
  @ApiProperty({ description: 'row_id', required: true })
  @IsNotEmpty()
  @IsMongoId()
  row_id: string;
}

export class CreateInspectionDto {

  @IsMongoId()
  @IsNotEmpty()
  product_id: string;

  @IsNotEmpty()
  @IsString()
  product_name: string;

  @IsNotEmpty()
  @IsString()
  product_code: string;

  @IsNotEmpty()
  @IsMongoId()
  complaint_id: string;

  @IsNotEmpty()
  @IsMongoId()
  service_engineer_id: string;

  @IsNotEmpty()
  @IsString()
  product_verification: string;

  @IsNotEmpty()
  @IsString()
  warranty_verification: string;

  @IsNotEmpty()
  @IsString()
  purchase_bill: string;

  @IsNotEmpty()
  @IsString()
  warranty_slip: string;

  @IsNotEmpty()
  @IsString()
  resolution_type: string;

  @IsNotEmpty()
  @IsString()
  purchase_location: string;

  @IsNotEmpty()
  @IsString()
  inspection_remarks: string;

}

export class CustomerComplaintSummaryDto {
  customer_name: string;
  customer_mobile: string;
  address: string;
  complaint_count: number;
  latest_complaint_status: string;
  complaints: {
    complaint_no: string;
    status: string;
    created_at: Date;
  }[];
}

export class ComplaintCustomerDetailDTO {
  @IsNotEmpty()
  @IsMongoId()
  _id: string;
}



