import { IsString, IsArray, IsNumber, IsObject, IsOptional, Min, IsNotEmpty, IsMongoId } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export class CreateDocumentDto {
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

  @ApiProperty({ type: [String], description: 'Array of Mongo IDs for customer types' })
  @IsNotEmpty()
  @IsArray()
  @IsMongoId({ each: true })
  customer_type_id: string[];

  @ApiProperty({ type: [String], description: 'Array of customer type names' })
  @IsNotEmpty()
  @IsArray()
  @IsString({ each: true })
  customer_type_name: string[];

  @ApiProperty({ example: 'Document Title', description: 'Title of the document' })
  @IsNotEmpty()
  @IsString()
  title: string;
}

export class UpdateDocumentDto {
  @ApiProperty({ type: [String], description: 'Array of Mongo IDs for customer types' })
  @IsNotEmpty()
  @IsArray()
  @IsMongoId({ each: true })
  customer_type_id: string[];

  @ApiProperty({ type: [String], description: 'Array of customer type names' })
  @IsNotEmpty()
  @IsArray()
  @IsString({ each: true })
  customer_type_name: string[];

  @ApiProperty({ example: 'Document Title', description: 'Title of the document' })
  @IsNotEmpty()
  @IsString()
  title: string;
}

export class DeleteDocumentFileDto {
  @ApiProperty({ example: '60c72b2f5f1b2c001c8d4567', description: 'Mongo ID of the document' })
  @IsNotEmpty()
  @IsMongoId()
  _id: string;
}
