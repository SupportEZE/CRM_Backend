import { IsString, IsNumber, IsOptional, MaxLength, Min, IsObject, isNotEmpty, IsNotEmpty, IsEnum, ValidateNested, IsMongoId } from 'class-validator';
import { Transform, Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export enum CallStatus {
  Review_Pending = 'Review Pending',
  Completed = 'Completed',
  Technical_Team = 'Technical Team',
}

export enum CallSubStatus {
  JUNK_CALL = 'Junk Call',
  TRAINING_ISSUE = 'Training Issue',
  Technical_ISSUE = 'Technical Issue',
}
export class ReadCallRequestDto {
  @ApiProperty({
    description: 'Currently active tab on the UI',
    enum: CallStatus,
    example: CallStatus.Completed
  })
  @IsString()
  @IsEnum(CallStatus)

  @IsNotEmpty()
  activeTab: CallStatus;

  @ApiPropertyOptional({
    description: 'Filters to apply on the badge list',
    type: Object,
    example: { filed_name: 'value' },
  })
  @IsOptional()
  @IsObject()
  filters?: Record<string, any>;

  @ApiPropertyOptional({ description: 'Page number (min 1)', example: 1 })
  @IsNumber()
  @Min(1)
  page?: number;

  @ApiPropertyOptional({ description: 'Number of items per page (min 10)', example: 20 })
  @IsOptional()
  @IsNumber()
  @Min(10)
  limit?: number;
}

export class UpdateCallStatusDto {
  @ApiProperty({ description: 'MongoDB ObjectId of the row to update', example: '66177a43094d3f4f812f7b2c' })
  @IsNotEmpty()
  @IsMongoId()
  @IsString()
  _id: string;

  @ApiProperty({
    description: 'Primary status to update',
    enum: CallStatus,
    example: CallStatus.Completed,
  })
  @IsNotEmpty()
  @IsEnum(CallStatus)
  status: CallStatus;

  @ApiPropertyOptional({
    description: 'Optional sub-status for further categorization',
    enum: CallSubStatus,
    example: CallSubStatus.JUNK_CALL,
  })
  @IsOptional()
  @IsEnum(CallSubStatus)
  sub_status?: CallSubStatus;
}
