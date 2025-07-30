import { IsNumber, IsOptional, Min, ValidateNested, IsString, IsObject, IsDate, IsNotEmpty, ValidateIf, IsBoolean, IsMongoId, IsISO8601, IsEnum, MaxLength, isNotEmpty, IsEmail, IsArray } from 'class-validator';
import { Transform, Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { TicketPriority } from 'src/modules/master/ticket/app/dto/app-ticket.dto';
export class StartVisitDto {
  @ApiProperty({
    description: 'Module name (e.g., Enquiry, Site, Customer)',
    example: 'Customers',
    required: true,
  })
  @IsString()
  @IsNotEmpty()
  module_name: string;

  @ApiProperty({
    description: 'ID of the selected module (corresponds to module_name)',
    example: 4,
    required: true,
  })
  @IsNumber()
  @IsNotEmpty()
  module_id: number;

  @ApiProperty({
    description: 'Unique customer identifier',
    example: '661df32d9c6f2f7e3f99c123',
    required: false,
  })
  @ValidateIf((o) => !o.is_new_counter_visit)
  @IsMongoId()
  @IsNotEmpty()
  customer_id: string;

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

  @ApiProperty({
    description: 'Is this a new counter visit?',
    example: true,
    required: false,
  })
  @IsBoolean()
  @IsOptional()
  is_new_counter_visit: boolean;

  @ApiProperty({
    description: 'Outlet Name (required if new counter visit)',
    example: 'My Outlet',
    required: false,
  })
  @ValidateIf((o) => o.is_new_counter_visit === true)
  @IsString()
  @IsNotEmpty()
  outlet_name: string;

  @ApiProperty({
    description: 'Outlet Type (required if new counter visit)',
    example: 'Retail',
    required: false,
  })
  @ValidateIf((o) => o.is_new_counter_visit === true)
  @IsString()
  @IsNotEmpty()
  outlet_type: string;

  @ApiProperty({
    description: 'Outlet Type ID (MongoId) - required if new counter visit',
    example: '661df32d9c6f2f7e3f99c999',
    required: false,
  })
  @ValidateIf((o) => o.is_new_counter_visit === true)
  @IsMongoId()
  @IsNotEmpty()
  outlet_type_id: string;

  @ApiProperty({
    description: 'Mobile Number of the outlet',
    example: '3698521470',
    required: false,
  })
  @ValidateIf((o) => o.is_new_counter_visit === true)
  @IsString()
  @IsOptional()
  mobile: string;

  @ApiProperty({
    description: 'Source of the information',
    example: 'email',
    required: false,
  })
  @ValidateIf((o) => o.is_new_counter_visit === true)
  @IsString()
  @IsOptional()
  lead_source: string;

  @ApiProperty({
    description: 'Category of the outlet',
    example: 'cold',
    required: false,
  })
  @ValidateIf((o) => o.is_new_counter_visit === true)
  @IsString()
  @IsOptional()
  lead_category: string;

  @ApiProperty({
    description: 'Contact Person for the outlet',
    example: 'Shandar',
    required: false,
  })
  @ValidateIf((o) => o.is_new_counter_visit === true)
  @IsString()
  @IsOptional()
  contact_person_name: string;

  @IsString()
  @IsOptional()
  @IsISO8601()
  planned_date: string
}
export class EndVisitDto {
  @ApiProperty({
    description: 'row_id',
    required: true,
  })
  @IsMongoId()
  @IsNotEmpty()
  _id: string;

  @ApiProperty({
    description: 'Ending latitude coordinate',
    example: '28.6140',
    required: true,
  })
  @IsNumber()
  @IsNotEmpty()
  end_lat: number;

  @ApiProperty({
    description: 'Ending longitude coordinate',
    example: '77.2100',
    required: true,
  })
  @IsNumber()
  @IsNotEmpty()
  end_lng: number;

  @ApiProperty({
    description: 'Document flag (e.g., whether documents were provided)',
    required: false,
  })
  @IsString()
  @IsOptional()
  doc_flag?: string;

  @ApiProperty({
    description: 'Checklist data or ID',
    required: false,
  })
  @IsString()
  @IsOptional()
  check_list?: any;

  @ApiProperty({
    description: 'Remarks entered during end visit',
    example: 'Store closed, will visit later.',
    required: false,
  })
  @IsString()
  @IsOptional()
  remark?: string;

  @IsObject()
  @IsOptional()
  check_out_activities: Record<string, any>

  @ApiProperty({
    description: 'Unique identifier',
    example: '609e126f61e3e53b7c2d672c',
  })
  @IsArray()
  @IsOptional()
  dropdown_options_id: string;

}


export class ReadVisitDto {
  @ApiProperty({
    description: 'Filters object with a possible search field',
    example: { search: 'text' },
  })
  @IsOptional()
  @IsObject()
  filters: object;

  @ApiProperty({ description: 'Page number for pagination' })
  @IsOptional()
  @IsNumber()
  @Min(1)
  page?: number;

  @ApiProperty({ description: 'Limit of items per page for pagination' })
  @IsOptional()
  @IsNumber()
  @Min(10)
  limit?: number;
}

export class DetailVisitDto {
  @ApiProperty({ description: 'Row id', required: true })
  @IsNotEmpty()
  @IsMongoId()
  _id: string;

  @ApiProperty({ description: 'Customer ID' })
  @IsOptional()
  customer_id: string;

  @ApiProperty({ description: 'Customer ID' })
  @IsOptional()
  module_id: number;
}

export class AssignCustomers {
  @ApiPropertyOptional({ example: 'mongo id' })
  @IsNotEmpty()
  @IsMongoId()
  customer_type_id: string;

  @ApiPropertyOptional({ example: 1 })
  @IsOptional()
  @IsNumber()
  @Min(1)
  page: number;

  @ApiPropertyOptional({ example: 10 })
  @IsOptional()
  @IsNumber()
  @Min(1)
  limit: number;

  @ApiPropertyOptional({ type: Object, example: { customer_name: "John Doe" } })
  @IsOptional()
  @IsObject()
  filters: object;

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @IsBoolean()
  nearBy: boolean;

  @ApiPropertyOptional({ example: 28.6139 })
  @ValidateIf(o => o.nearBy)
  @IsNotEmpty()
  @IsNumber()
  user_lat: number;

  @ApiPropertyOptional({ example: 77.2090 })
  @ValidateIf(o => o.nearBy)
  @IsNotEmpty()
  @IsNumber()
  user_lang: number;

  @ApiPropertyOptional({ example: 50000 })
  @IsOptional()
  @IsNumber()
  max_distance: number;

  @IsString()
  @IsOptional()
  tab?: string;
}

export enum BeatCustomerTab {
  COMPLETED = 'completed',
  PLANNED = 'planned',
  ALL = 'all'
}

export class AppBeatCustomers {
  @ApiPropertyOptional({ example: '2024-04-13', description: 'IST date' })
  @IsOptional()
  @IsISO8601()
  date: string;

  @ApiPropertyOptional({ enum: BeatCustomerTab, example: BeatCustomerTab.PLANNED, description: 'Active tab type' })
  @IsNotEmpty()
  @IsEnum(BeatCustomerTab)
  activeTab?: BeatCustomerTab;

  @ApiPropertyOptional({ example: 'customer name', description: 'rahul' })
  @IsOptional()
  @IsObject()
  filters: Record<string, any>;

}

export class AppBeatPerformance {
  @ApiPropertyOptional({ example: '2024-04-13', description: 'IST date' })
  @IsNotEmpty()
  @IsISO8601()
  date: string;
}

export class AppCreateTicketFromActivityDto {


  @ApiPropertyOptional({ description: 'chekin-id' })
  @IsMongoId()
  @IsNotEmpty()
  visit_activity_id: string;

  @ApiProperty({
    description: 'Category of the ticket (e.g., Technical, Billing).',
    example: 'Technical',
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(50, { message: 'Ticket category must not exceed 50 characters.' })
  ticket_category: string;

  @ApiProperty({
    description: 'Priority of the ticket.',
    enum: TicketPriority,
    example: TicketPriority.High,
  })
  @IsEnum(TicketPriority, { message: 'Priority must be High, Medium, or Low.' })
  @IsNotEmpty()
  ticket_priority: TicketPriority;

  @ApiProperty({
    description: 'Detailed description of the issue faced by the user.',
    example: 'Unable to access the portal due to server error.',
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(500, { message: 'Description must not exceed 500 characters.' })
  ticket_description: string;

  @ApiProperty({
    description: 'ID representing the type of customer raising the ticket.',
    example: '609d9e8f2f79981e9a1e233b',
  })
  @IsMongoId()
  customer_id: string;

}
export class AppReadCheckinForCustomerDto {
  @ApiPropertyOptional({ example: '681ccb96dd76a494d85362c2', description: 'Customer Id' })
  @IsNotEmpty()
  @IsMongoId()
  customer_id: string;
}


