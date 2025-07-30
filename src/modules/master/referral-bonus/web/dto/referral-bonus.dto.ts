import { IsString, IsNumber, IsArray, ArrayNotEmpty, IsOptional, MaxLength, Min, IsObject, isNotEmpty, IsNotEmpty, IsEnum, ValidateNested, IsMongoId } from 'class-validator';
import { Transform, Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export enum ReferralBonusStatus {
  ACTIVE = 'Active',
  INACTIVE = 'Inactive',
}

export enum BonusType {
  WELCOME = 'Welcome',
  BIRTHDAY = 'Birthday',
  ANNIVERSARY = 'Anniversary',
  INVITE_FRIENDS = 'Invite Friends',
  REFER_ENQUIRY = 'Refer Enquiry',
  REFER_SITE_PROJECT = 'Refer Site | Project',
}
export class CreateReferralBonusDto {
  @ApiProperty({
    description: 'Type of the bonus.',
    enum: BonusType,
    example: BonusType.WELCOME,
  })
  @IsNotEmpty()
  @IsEnum(BonusType)
  bonus_type: BonusType;

  @ApiProperty({
    description: 'Templte of referral',
    example: 'templte of referral',
  })
  @IsOptional()
  @IsString()
  template: string;

  @ApiProperty({
    description: 'Array of Customer type IDs associated with leaderboard',
    example: ['6614e43fe7b2345b3d123abc', '6614e43fe7b2345b3d123abd'],
    isArray: true,
    type: String
  })
  @IsArray()
  @ArrayNotEmpty()
  @IsMongoId({ each: true })
  customer_type_id: string[];

  @ApiProperty({
    description: 'Array of Customer type names',
    example: ['Electrician', 'Plumber'],
    isArray: true,
    type: String
  })
  @IsArray()
  @ArrayNotEmpty()
  @IsString({ each: true })
  customer_type_name: string[];

  @ApiPropertyOptional({
    description: 'Points awarded as a bonus.',
    example: 100,
  })
  @IsNotEmpty()
  @IsNumber()
  bonus_point?: number;
}

export class ReadReferralBonusDto {
  @ApiPropertyOptional({
    description: 'Filters for retrieving referral bonuses.',
    example: { field_name: 'value' },
  })
  @IsOptional()
  @IsObject()
  filters?: object;

  @ApiPropertyOptional({
    description: 'Page number for pagination.',
    example: 1,
  })
  @IsNumber()
  @Min(1)
  page?: number;

  @ApiPropertyOptional({
    description: 'Number of items per page.',
    example: 10,
  })
  @IsOptional()
  @IsNumber()
  @Min(10)
  limit?: number;
}

// UpdateReferralBonusDto
export class UpdateReferralBonusDto {
  @ApiProperty({
    description: 'Unique ID of the referral bonus.',
    example: '60ad0f486123456789abcdef',
  })
  @IsNotEmpty()
  @IsMongoId()
  @IsString()
  _id: string;

  @ApiPropertyOptional({
    description: 'Updated points for the referral bonus.',
    example: 150,
  })
  @IsNotEmpty()
  @IsNumber()
  bonus_point?: number;

  @ApiPropertyOptional({
    description: 'Array of customer type IDs (as strings).',
    example: [
      "67c9904bd2ede5ebd2647e24",
      "67c9906ad2ede5ebd2647e25"
    ],
    type: [String],
  })
  @IsOptional()
  @IsArray()
  @Type(() => String)
  @IsString({ each: true })
  customer_type_id?: string[];

  @ApiPropertyOptional({
    description: 'Array of customer type names.',
    example: [
      "Interior Designer",
      "Builder",
      "Fabricator"
    ],
    type: [String],
  })
  @IsOptional()
  @IsArray()
  @Type(() => String)
  @IsString({ each: true })
  customer_type_name?: string[];
}

export class StatusUpdateReferralBonusDto {
  @ApiProperty({
    description: 'Unique ID of the referral bonus.',
    example: '60ad0f486123456789abcdef',
  })
  @IsNotEmpty()
  @IsMongoId()
  @IsString()
  _id: string;

  @ApiProperty({
    description: 'Updated status of the referral bonus.',
    enum: ReferralBonusStatus,
    example: ReferralBonusStatus.ACTIVE,
  })
  @IsNotEmpty()
  @IsEnum(ReferralBonusStatus)
  status: ReferralBonusStatus;
}

export class DeleteReferralBonusDto {
  @ApiProperty({
    description: 'Unique ID of the referral bonus.',
    example: '60ad0f486123456789abcdef',
  })
  @IsNotEmpty()
  @IsMongoId()
  @IsString()
  _id: string;

  @ApiProperty({
    description: 'Flag indicating deletion status (1 for deleted, 0 for not deleted).',
    example: 1,
  })
  @IsNotEmpty()
  @IsNumber()
  is_delete: number;
}