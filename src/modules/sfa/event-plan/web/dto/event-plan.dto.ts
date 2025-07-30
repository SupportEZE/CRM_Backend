import {
  IsString, IsNumber, IsOptional, Min, IsObject, IsNotEmpty, Equals, IsMongoId, IsArray, ValidateNested,
  IsISO8601
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { SubExpenseDto } from 'src/modules/sfa/expense/web/dto/expense.dto';

export enum EventStatus {
  Pending = 'Pending',
  Inprocess = 'Inprocess',
  Complete = 'Complete',
  Reject = 'Reject',
}

export enum ParticipantStatus {
  New = 'New',
  Repeated = 'Repeated',
  Win = 'Win'
}
export class CreateEventPlanByUserDto {
  @ApiProperty({
    description: 'Date of the event in ISO 8601 string format (e.g., 2025-06-01T00:00:00Z)',
    example: '2025-06-01T00:00:00Z',
    required: true
  })
  @IsNotEmpty()
  @IsString()
  @IsISO8601()
  event_date: string;
  
  @ApiProperty({
    description: 'Type of the event (e.g., Conference, Meeting, etc.)',
    example: 'Conference',
    required: true
  })
  @IsString()
  @IsNotEmpty()
  event_type: string;
  
  @ApiProperty({
    description: 'Customer type ID (MongoDB ID)',
    example: '609e126f61e3e53b7c2d672c',
    required: true
  })
  @IsNotEmpty()
  @IsMongoId()
  customer_type_id: string;
  
  @ApiProperty({
    description: 'Customer type name (e.g., Distributor, Retailer)',
    example: 'Distributor',
    required: true
  })
  @IsNotEmpty()
  @IsString()
  customer_type_name: string;
  
  @ApiProperty({
    description: 'Customer ID (MongoDB ID)',
    example: '6800cce7e50a3d0d0edb147f',
    required: true
  })
  @IsNotEmpty()
  @IsMongoId()
  customer_id: string;
  
  @ApiProperty({
    description: 'Customer name (e.g., John Doe, ABC Corp.)',
    example: 'Test',
    required: true
  })
  @IsNotEmpty()
  @IsString()
  customer_name: string;
  
  @ApiProperty({
    description: 'The number of members invited to the event.',
    example: 50,
    required: true
  })
  @IsNumber()
  @IsNotEmpty()
  invite_members: number;
  
  @ApiProperty({
    description: 'Budget requested per person for the event.',
    example: 100,
    required: true
  })
  @IsNumber()
  @IsNotEmpty()
  budget_request_per_person: number;
  
  @ApiProperty({
    description: 'Details of any gifts provided during the event.',
    example: 'Customized gift bags for each attendee.',
    required: false
  })
  @IsString()
  @IsOptional()
  gift_detail: string;
  
  @ApiProperty({
    description: 'Additional remarks or comments related to the event.',
    example: 'Event will be held in the city center.',
    required: false
  })
  @IsString()
  @IsOptional()
  remark: string;
  
  @ApiProperty({
    description: 'Venue where the event is hosted.',
    example: 'City Convention Center',
    required: true
  })
  @IsString()
  @IsNotEmpty()
  event_venue: string;
}
export class CreateEventPlanByAdminDto extends CreateEventPlanByUserDto {
  @ApiProperty({
    description: 'Name of the user to whom the event is assigned.',
    example: 'Admin User',
    required: true
  })
  @IsString()
  @IsNotEmpty()
  assigned_to_user_name: string;

  @ApiProperty({
    description: 'Assigned user ID (MongoDB ID)',
    example: '609e126f61e3e53b7c2d672c',
    required: true
  })
  @IsNotEmpty()
  @IsMongoId()
  assigned_to_user_id: string;
}
export class ReadEventPlanDto {
  @ApiProperty({ description: 'filters is an optional field', required: false })
  @IsOptional()
  @IsObject()
  filters: object;
  
  @ApiProperty({ description: 'activeTab is an optional field', required: false })
  @IsOptional()
  @IsString()
  activeTab: string;
  
  @ApiProperty({ description: 'sorting is an optional field', required: false })
  @IsOptional()
  @IsObject()
  sorting: object;
  
  @ApiProperty({ description: 'page number is an optional field', required: false })
  @IsOptional()
  @IsNumber()
  @Min(1)
  page: number;
  
  @ApiProperty({ description: 'limit is an optional field', required: false })
  @IsOptional()
  @IsNumber()
  @Min(10)
  limit: number;
}
export class DetailEventPlanDto {
  @ApiProperty({ description: 'id is a required', required: true })
  @IsNotEmpty()
  @IsMongoId()
  _id: string;
}
export class SaveParticipantDto {
  @ApiProperty({ description: 'id is a required', required: true })
  @IsNotEmpty()
  @IsMongoId()
  event_plan_id: string;
  
  @ApiProperty({ description: 'id is a required', required: true })
  @IsNotEmpty()
  @IsString()
  name: string;
  
  @ApiProperty({ description: 'mobile is a required', required: true })
  @IsNotEmpty()
  @IsString()
  mobile: string;
  
  @ApiProperty({ description: 'id is a required', required: true })
  @IsString()
  @IsOptional()
  status: string;
}

export class CreateEventExpenseDto {
  @ApiProperty({ description: 'Event Plan Row Id', example: '6821ec4635929726ed7f0e63' })
  @IsString()
  @IsNotEmpty()
  event_plan_id: string;
  
  @ApiProperty({ type: () => [SubExpenseDto], description: 'List of sub-expenses' })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SubExpenseDto)
  sub_expense: SubExpenseDto[];
}

export class StatusUdateEventDto {
  @ApiProperty({ description: 'id is a required field', required: true })
  @IsNotEmpty()
  @IsString()
  _id: string;
  
  @ApiProperty({ description: 'status is a required field', required: true })
  @IsNotEmpty()
  @IsString()
  status: string;
  
  @ApiProperty({ description: 'reason is optional field', required: true })
  @IsOptional()
  @IsString()
  reason: string;
}

