import { IsString, IsNumber, IsOptional, Min, IsObject, IsNotEmpty, IsEnum, ValidateNested, IsMongoId, IsArray, Equals, IsBoolean } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export enum AnnouncementStatus {
  Published = 'Published',
  Unpublished = 'Unpublished',
}
export class CreateAnnouncementDto {
  @ApiProperty({ example: '60d21b4667d0d8992e610c85', description: 'Customer Type ID', required: true })
  @IsMongoId()
  @IsNotEmpty()
  customer_type_id: string;

  @ApiProperty({ example: 'Regular', description: 'Customer Type Name', required: false })
  @IsNotEmpty()
  @IsString()
  customer_type_name?: string;

  @ApiProperty({ example: 'Admin', description: 'Login Type Name', required: false })
  @IsOptional()
  @IsString()
  login_type_name?: string;

  @ApiProperty({ example: 1, description: 'Login Type ID', required: false })
  @IsOptional()
  @IsNumber()
  login_type_id?: number;

  @ApiProperty({ example: 'New Product Launch', description: 'Announcement Title', required: true })
  @IsString()
  @IsNotEmpty()
  title: string;

  @ApiProperty({ example: 'We are launching a new product this month!', description: 'Announcement Description', required: false })
  @IsNotEmpty()
  @IsString()
  description?: string;

  @ApiProperty({
    example: true,
    description: 'If marked true, a push notification will be sent.',
    required: false
  })
  @IsBoolean()
  @IsOptional()
  push_notification?: boolean;

  @ApiProperty({
    example: true,
    description: 'If marked true, an in-app notification will be sent.',
    required: false
  })
  @IsBoolean()
  @IsOptional()
  in_app_notification?: boolean;

  @ApiProperty({ example: 'Published', description: 'Status of the Announcement', required: false, enum: AnnouncementStatus })
  @IsOptional()
  @IsEnum(AnnouncementStatus)
  status?: AnnouncementStatus;

  @ApiProperty({ example: ['Delhi', 'Haryana'], description: 'Applicable states', required: true, isArray: true })
  @IsArray()
  @IsNotEmpty()
  state: string[];
}
export class ReadAnnouncementDto {
  @ApiProperty({ example: 'Published', description: 'Tab filter: Published / Unpublished', required: false })
  @IsNotEmpty()
  @IsString()
  activeTab?: string;

  @ApiProperty({
    example: { field_name: 'Xyz' },
    description: 'Filter conditions',
    required: false,
    type: Object,
  })
  @IsOptional()
  @IsObject()
  filters?: Record<string, any>;

  @ApiProperty({ example: 1, description: 'Pagination - Page number', required: false })
  @IsNumber()
  @Min(1)
  page?: number;

  @ApiProperty({ example: 10, description: 'Pagination - Items per page', required: false })
  @IsOptional()
  @IsNumber()
  @Min(1)
  limit?: number;
}

export class DetailAnnouncementDto {
  @ApiProperty({ example: '60d21b4667d0d8992e610c85', description: 'Announcement ID', required: true })
  @IsNotEmpty()
  @IsMongoId()
  _id: string;
}

export class UpdateStatusDto {
  @ApiProperty({ example: '60d21b4667d0d8992e610c85', description: 'Announcement ID', required: true })
  @IsNotEmpty()
  @IsMongoId()
  _id: string;

  @ApiProperty({ example: 'Published', description: 'New status', enum: AnnouncementStatus })
  @IsNotEmpty()
  @IsEnum(AnnouncementStatus)
  status: AnnouncementStatus;
}


export class DeleteAnnouncementDto {
  @ApiProperty({ example: '60d21b4667d0d8992e610c85', description: 'Announcement ID', required: true })
  @IsNotEmpty()
  @IsMongoId()
  _id: string;

  @ApiProperty({ example: 1, description: 'Delete flag (must be 1)', required: true })
  @IsNotEmpty()
  @IsNumber()
  @Equals(1, { message: 'is_delete must be 1' })
  is_delete: number;
}

