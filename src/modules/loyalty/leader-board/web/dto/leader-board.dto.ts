import { Type, Transform } from 'class-transformer';
import { IsString, IsEnum, IsISO8601, ArrayNotEmpty, IsNumber, IsOptional, IsObject, IsNotEmpty, IsDate, IsArray, Min, Equals, ArrayMinSize, IsMongoId } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export enum LeaderBoardActiveTab {
  Running = 'Running',
  Expired = 'Expired',
}
export class CreateLeaderBoardDto {
  @ApiProperty({ description: 'Title of the leaderboard', example: 'Top Electricians April 2025' })
  @IsString()
  @IsNotEmpty()
  title: string;


  @ApiProperty({
    description: 'Start date of the leaderboard',
    type: Date,
    example: '2025-04-01T00:00:00.000Z',
  })
  @IsISO8601()
  @IsNotEmpty()
  start_date?: Date;

  @ApiProperty({
    description: 'End date of the leaderboard',
    type: Date,
    example: '2025-04-01T00:00:00.000Z',
  })
  @IsISO8601()
  @IsNotEmpty()
  end_date?: Date;

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

  @ApiProperty({ description: 'Minimum eligibility points required', example: 150 })
  @IsNumber()
  @Min(1)
  min_eligiblity_points: number;

  @ApiProperty({
    description: 'Ledger creation types used to calculate ranking',
    type: [Object],
    example: ["Purchase", "Scan"]
  })
  @IsArray()
  @ArrayMinSize(1)
  ledger_creation_type: Record<string, any>[];

  @ApiProperty({ description: 'Terms and conditions', example: 'Participants must have an active account.' })
  @IsString()
  @IsNotEmpty()
  terms_condition: string;

  @ApiProperty({
    description: 'Country eligible to participate',
    example:"India"
  })
  @IsNotEmpty()
  country: string;

  @ApiProperty({
    description: 'States eligible to participate',
    type: [Object],
    example: ["Haryana", "Delhi"]
  })
  @IsArray()
  @ArrayMinSize(1)
  state: Record<string, any>[];

  @ApiProperty({
    description: 'Gift details assigned to winners',
    type: [Object],
    example: [{ rank: "1st Rank", gift_title: 'Bike' }, { rank: "2nd Rank", gift_title: 'Smartphone' }]
  })
  @IsArray()
  @ArrayMinSize(1)
  gift_detail: Record<string, any>[];
}

export class ReadLeaderBoardDto {
  @ApiProperty({
    description: 'Active tab for leaderboard (used for filtering)',
    enum: LeaderBoardActiveTab,
    example: LeaderBoardActiveTab.Running,
  })
  @IsEnum(LeaderBoardActiveTab, { message: 'activeTab must be either Running or Expired' })
  activeTab?: LeaderBoardActiveTab;


  @ApiPropertyOptional({
    description: 'Filters to apply on leaderboard list',
    type: Object,
    example: { field_name: 'Xyz' }
  })
  @IsOptional()
  @IsObject()
  filters?: Record<string, any>;

  @ApiProperty({ description: 'Current page for pagination', example: 1 })
  @IsNumber()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({ description: 'Limit per page for pagination', example: 10 })
  @IsOptional()
  @IsNumber()
  @Min(10)
  limit?: number = 10;
}


export class DetailLeaderBoardDto {
  @ApiProperty({ description: 'Leaderboard ID to fetch details', example: '6614e43fe7b2345b3d123abc' })
  @IsNotEmpty()
  @IsMongoId()
  @IsString()
  _id: string;
}

export class DeleteLeaderBoardDto {
  @ApiProperty({ description: 'Leaderboard ID to fetch details', example: '6614e43fe7b2345b3d123abc' })
  @IsNotEmpty()
  @IsMongoId()
  @IsString()
  _id: string;
}



export class UpdateLeaderStatusBoardDto {
  @ApiProperty({ description: 'Leaderboard ID to fetch details', example: '6614e43fe7b2345b3d123abc' })
  @IsNotEmpty()
  @IsMongoId()
  @IsString()
  _id: string;

  @ApiProperty({ description: 'Status', example: 'Active' })
  @IsString()
  @IsNotEmpty()
  status: string;
}
