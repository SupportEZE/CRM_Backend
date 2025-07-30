import {
    IsEnum, IsMongoId, IsNotEmpty, IsNumber,
    IsObject, IsOptional, IsString, Min, ValidateNested,
    ArrayMinSize,
    IsLatitude,
    IsLongitude,
    IsISO8601,
    IsArray
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';


export class ReadComplaintDto {
  @ApiPropertyOptional({ description: 'Filters for querying stock audits', type: Object })
  @IsOptional()
  @IsObject()
  filters: object;

  @ApiProperty({ example: 'Reject', description: 'Tab filter: Reject / Verified', required: false })
  @IsNotEmpty()
  @IsString()
  activeTab?: string;

  @ApiPropertyOptional({ description: 'Page number for pagination', minimum: 1 })
  @IsOptional()
  @IsNumber()
  @Min(1)
  page?: number;

  @ApiPropertyOptional({ description: 'Number of records per page', minimum: 1 })
  @IsOptional()
  @IsNumber()
  @Min(1)
  limit?: number;
}


export enum ActiveTab {
    INCOMING = 'incoming',
    OUTGOING = 'outgoing',
}

export class StartVisitDto {
  @ApiProperty({
      description: 'Complaint No  (e.g., Enquiry, Site, Customer)',
      example: 'Customers',
    })
    @IsString()
    @IsNotEmpty()
    complaint_no: string;
    
    @ApiProperty({
      description: 'Unique customer identifier',
      example: '661df32d9c6f2f7e3f99c123',
    })
    @IsMongoId()
    @IsNotEmpty()
    complaint_id: string;
    
    @ApiProperty({
      description: 'Starting latitude coordinate',
      example: 28.6139,
    })
    @IsNumber()
    @IsNotEmpty()
    start_lat: number;
    
    @ApiProperty({
      description: 'Starting longitude coordinate',
      example: 77.2090,
    })
    @IsNumber()
    @IsNotEmpty()
    start_lng: number;
}

export class EndVisitDto {
    @IsMongoId()
    @IsNotEmpty()
    complaint_id: string;

    @IsOptional()
    @IsString()
    stop_address?: string;

    @ApiProperty({
      description: 'Starting latitude coordinate',
      example: 28.6139,
    })
    @IsNumber()
    @IsNotEmpty()
    stop_lat: number;
    
    @ApiProperty({
      description: 'Starting longitude coordinate',
      example: 77.2090,
    })
    @IsNumber()
    @IsNotEmpty()
    stop_lng: number;
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

export class UpdateStatusDto {

    @IsNotEmpty()
    @IsString()
    _id: string;

    @IsNotEmpty()
    @IsString()
    status: string;

    @IsNotEmpty()
    @IsString()
    reason: string;
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

class SpareItemDto {
  @IsMongoId()
  @IsNotEmpty()
  product_id: string;

  @IsNotEmpty()
  product_name: string;

  @IsNumber()
  transaction_qty: number;
}

export class CreateComplaintSpareDto {
  @IsMongoId()
  @IsNotEmpty()
  complaint_id: string;

  @IsNotEmpty()
  complaint_no: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SpareItemDto)
  spares: SpareItemDto[];
}
export class GetExistComplaintDto {
  @IsNotEmpty()
  @IsString()
  customer_mobile: string;
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