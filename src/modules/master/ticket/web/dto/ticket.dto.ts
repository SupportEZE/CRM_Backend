import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsNumber, IsOptional, Max, Min, IsObject, IsNotEmpty, IsArray, IsMongoId, MaxLength, IsEnum } from 'class-validator';
import { Types } from 'mongoose';
import { TicketPriority } from '../../app/dto/app-ticket.dto';

export class CreateTicketBySystemUserDto {
  @ApiProperty({
    type: String,
    description: 'Unique identifier of the customer submitting the ticket.',
    example: '609d9e8f2f79981e9a1e233b',
  })
  @IsNotEmpty()
  @IsMongoId()
  customer_id: Types.ObjectId;
  
  @ApiProperty({
    type: String,
    description: 'Category of the ticket, such as "Technical" or "Billing".',
    example: 'Technical',
  })
  @IsString()
  @IsNotEmpty()
  ticket_category: string;
  
  @ApiProperty({
    type: String,
    description: 'Priority of the ticket, such as "High", "Medium", or "Low".',
    example: 'High',
  })
  @IsString()
  @IsNotEmpty()
  @IsEnum(TicketPriority, { message: 'Priority must be High, Medium, or Low.' })
  ticket_priority: TicketPriority;
  
  @ApiProperty({
    type: String,
    description: 'Detailed description of the issue or problem faced by the customer.',
    example: 'Internet connection is not working properly.',
  })
  @IsString()
  @IsNotEmpty()
  ticket_description: string;
  
  @ApiPropertyOptional({
    type: String,
    description: 'Employee ID to whom the ticket is assigned.',
    example: '609d9e8f2f79981e9a1e233c',
  })
  @IsNotEmpty()
  @IsMongoId()
  assign_to_user_id: Types.ObjectId;
  
}

export class CreateTicketByUserDto {
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

export class CreateTicketByCustomerDto {
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
  
}

export class SaveCommentTicketDto {
  @ApiProperty({ description: 'site_project_id is a required field', required: true })
  @IsNotEmpty()
  @IsString()
  row_id: string;
  
  @ApiProperty({ description: 'comment is a required field', required: true })
  @IsNotEmpty()
  @IsString()
  comment: string;
}

export class ReadTicketDto {
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

export class CloseTicketDto {
  @ApiProperty({
    type: String,
    description: 'Unique identifier of the ticket to be closed.',
    example: '609d9e8f2f79981e9a1e233d',
  })
  @IsNotEmpty()
  @IsMongoId()
  @IsString()
  _id: string;
  
  @ApiPropertyOptional({
    type: String,
    description: 'Optional remarks or reasons for closing the ticket.',
    example: 'Issue resolved by support team.',
  })
  @IsOptional()
  @IsString()
  status_remark?: string;
  
  @ApiProperty({
    type: String,
    description: 'Status of the ticket upon closure.',
    example: 'Closed',
  })
  @IsNotEmpty()
  @IsString()
  status: string;
}

export class SubmitFeedbackDto {
  @ApiProperty({
    type: String,
    description: 'Unique identifier of the ticket for which feedback is submitted.',
    example: '609d9e8f2f79981e9a1e233e',
  })
  @IsNotEmpty()
  @IsMongoId()
  @IsString()
  _id: string;
  
  @ApiProperty({
    type: Number,
    description: 'Feedback rating provided by the customer (between 1 and 5).',
    example: 5,
    minimum: 1,
    maximum: 5,
  })
  @IsNotEmpty()
  @IsNumber()
  @Min(1)
  @Max(5)
  feedback_star: number;
  
  @ApiPropertyOptional({
    type: String,
    description: 'Optional remarks or comments for the feedback.',
    example: 'Excellent service!',
  })
  @IsOptional()
  @IsString()
  feedback_remark?: string;
}

export class DetailTicketDto {
  @ApiProperty({
    type: String,
    description: 'Unique identifier of the ticket to retrieve detailed information.',
    example: '609d9e8f2f79981e9a1e233f',
  })
  @IsNotEmpty()
  @IsMongoId()
  _id: string;
}
export class ReadCommentsTicketDto {
  @ApiProperty({ description: 'siteproject id is a required field', required: true })
  @IsNotEmpty()
  @IsString()
  row_id: string;
}
