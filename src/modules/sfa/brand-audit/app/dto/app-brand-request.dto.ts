import { IsNumber, IsOptional, IsString, Min, IsObject, IsNotEmpty, IsEnum, IsMongoId } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export enum Status {
  Pending = "Pending",
  Approved = "Approved",
  Reject = "Reject",
  Complete = "Complete",
}


export class ReadBrandRequestDto {
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

export class DetailBrandRequestDto {
  @ApiProperty({
    description: 'MongoDB ObjectId of the Brand Request',
    required: true,
    example: '603d2149e1c1f001540b7a7d',
  })
  @IsNotEmpty()
  @IsMongoId()
  _id: string;
}

export class StatusDto {
  @ApiProperty({
    description: 'MongoDB ObjectId of the Brand Request',
    required: true,
    example: '603d2149e1c1f001540b7a7d',
  })
  @IsNotEmpty()
  @IsString()
  _id: string;

  @ApiProperty({
    description: 'Status of the Brand Request', required: true, enum: Status, example: Status.Pending
  })
  @IsNotEmpty()
  @IsEnum(Status)
  status: Status;

  @IsNotEmpty()
  @IsString()
  reason: string;
}

export class AppBrandDocsDto {
  @ApiProperty({
    description: 'Unique identifier for the payment',
    example: '609e126f61e3e53b7c2d672c',
  })
  @IsMongoId()
  @IsNotEmpty()
  _id: string;
}