import { IsString, IsNumber, IsNotEmpty, IsMongoId, Equals, IsArray } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
export class CreateVideoDto {

  @ApiProperty({ example: 'Admin', description: 'Name of the login type' })
  @IsNotEmpty()
  @IsString()
  country: string;

  @ApiProperty({
    example: [10, 5, 7],
    description: 'Array of Login Type IDs (numeric)',
    required: true,
    type: [Number]
  })
  @IsNotEmpty()
  @IsArray()
  @Type(() => Number)
  @IsNumber({}, { each: true })
  login_type_id: number[];

  @ApiProperty({
    example: ['Influencer', 'Primary', 'Secondary'],
    description: 'Array of Login Type Names',
    required: true,
    type: [String]
  })
  @IsNotEmpty()
  @IsArray()
  @IsString({ each: true })
  login_type_name: string[];

  @ApiProperty({
    example: ['64ffce12b8b5a1e3c7b91fcd'],
    description: 'Array of customer type Mongo IDs',
    type: [String],
  })
  @IsNotEmpty()
  @IsArray()
  @IsMongoId({ each: true })
  customer_type_id: string[];

  @ApiProperty({
    example: ['Retail', 'Wholesale'],
    description: 'Array of customer type names',
    type: [String],
  })
  @IsNotEmpty()
  @IsArray()
  @IsString({ each: true })
  customer_type_name: string[];

  @ApiProperty({
    example: 'https://www.youtube.com/watch?v=abc123',
    description: 'YouTube video URL',
  })
  @IsNotEmpty()
  @IsString()
  youtube_url: string;

  @ApiProperty({ example: 'How to Use the Portal', description: 'Video title' })
  @IsNotEmpty()
  @IsString()
  title: string;
}

export class UpdateVideoDto {
  @ApiProperty({
    example: ['64ffce12b8b5a1e3c7b91fcd'],
    description: 'Array of customer type Mongo IDs',
    type: [String],
  })
  @IsNotEmpty()
  @IsArray()
  @IsMongoId({ each: true })
  customer_type_id: string[];

  @ApiProperty({
    example: ['Retail', 'Wholesale'],
    description: 'Array of customer type names',
    type: [String],
  })
  @IsNotEmpty()
  @IsArray()
  @IsString({ each: true })
  customer_type_name: string[];

  @ApiProperty({ example: 'How to Use the Portal', description: 'Video title' })
  @IsNotEmpty()
  @IsString()
  title: string;
}

export class DeleteVideoDto {
  @ApiProperty({
    example: '64ffce12b8b5a1e3c7b91fcd',
    description: 'Mongo ID of the video to delete',
  })
  @IsNotEmpty()
  @IsMongoId()
  _id: string;

  @ApiProperty({
    example: 1,
    description: 'Must be 1 to confirm deletion',
  })
  @IsNotEmpty()
  @IsNumber()
  @Equals(1, { message: 'is_delete must be 1' })
  is_delete: number;
}
