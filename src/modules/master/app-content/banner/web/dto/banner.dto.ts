import { IsString, IsNumber, ValidateNested, IsOptional, Min, IsObject, IsNotEmpty, IsArray, IsMongoId } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';


export class CreateBannerDto {
  @ApiProperty({ example: 1, description: 'Login Type ID (numeric)', required: true })
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

  @ApiProperty({
    example: ['Plumber', 'Distributor'],
    description: 'Array of Customer Type Names',
    isArray: true,
    required: true,
  })
  @IsNotEmpty()
  @IsArray()
  @IsString({ each: true })
  customer_type_name: string[];
}

export class DeleteBannerFileDto {
  @ApiProperty({
    example: '64f7b1e2e2f2b1a1b1c1d1e1',
    description: 'Banner document ID',
    required: true,
  })
  @IsNotEmpty()
  @IsMongoId()
  _id: string;
}

export class UpdateBannerDto {
  @ApiProperty({
    example: ['64f7b1e2e2f2b1a1b1c1d1e1'],
    description: 'Array of Customer Type IDs',
    isArray: true,
    required: true,
  })
  @IsNotEmpty()
  @IsArray()
  @IsMongoId({ each: true })
  customer_type_id: string[];

  @ApiProperty({
    example: ['Plumber', 'Distributor'],
    description: 'Array of Customer Type Names',
    isArray: true,
    required: true,
  })
  @IsNotEmpty()
  @IsArray()
  @IsString({ each: true })
  customer_type_name: string[];
}
