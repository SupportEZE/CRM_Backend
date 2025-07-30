import {
  IsString, IsNumber, IsOptional, MaxLength, Min, Max, IsObject, IsNotEmpty, IsEnum, IsMongoId
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export enum TicketPriority {
  High = 'High',
  Medium = 'Medium',
  Low = 'Low',
}

export class AppReadTicketDto {
  @ApiPropertyOptional({
    description: 'Filter options for querying tickets, such as status or priority.',
    example: { search: "abc" },
  })
  @IsOptional()
  @IsObject()
  filters?: object;

  @ApiPropertyOptional({
    description: 'Active tab for UI filtering',
    example: 'all',
  })
  @IsOptional()
  @IsString()
  activeTab?: string;

  @ApiPropertyOptional({
    description: 'Page number for pagination (starts from 1).',
    example: 1,
    default: 1,
  })
  @IsNumber()
  @Min(1, { message: 'Page number must be at least 1.' })
  page?: number;

  @ApiPropertyOptional({
    description: 'Number of items per page for pagination.',
    example: 10,
    default: 10,
  })
  @IsOptional()
  @IsNumber()
  @Min(10, { message: 'Limit must be at least 10.' })
  limit?: number;
}

export class SubmitFeedbackDto {
  @ApiProperty({
    description: 'Unique identifier of the ticket being reviewed.',
    example: '609d9e8f2f79981e9a1e233c',
  })
  @IsNotEmpty()
  @IsString()
  @IsMongoId()
  _id: string;

  @ApiProperty({
    description: 'Feedback rating for the ticket (between 1 and 5).',
    example: 5,
    minimum: 1,
    maximum: 5,
  })
  @IsNotEmpty()
  @IsNumber()
  @Min(1, { message: 'Feedback rating must be at least 1.' })
  @Max(5, { message: 'Feedback rating must not exceed 5.' })
  feedback_star: number;

  @ApiPropertyOptional({
    description: 'Optional remarks or comments for the feedback.',
    example: 'Excellent service!',
  })
  @IsOptional()
  @IsString()
  @MaxLength(250, { message: 'Feedback remarks must not exceed 250 characters.' })
  feedback_remark?: string;
}

export class AppDetailTicketDto {
  @ApiProperty({
    description: 'Unique identifier of the ticket.',
    example: '609d9e8f2f79981e9a1e233d',
  })
  @IsNotEmpty()
  @IsMongoId()
  _id: string;
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

export class ReadCommentsTicketDto {
  @ApiProperty({ description: 'siteproject id is a required field', required: true })
  @IsNotEmpty()
  @IsString()
  row_id: string;
}

