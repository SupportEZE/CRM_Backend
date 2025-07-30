import { IsString, IsNumber, IsOptional, MaxLength, Min, IsObject, isNotEmpty, IsNotEmpty, IsEnum, ValidateNested, Max, IsEmail, IsMongoId } from 'class-validator';
import { Transform, Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateFaqDto {
  @ApiProperty({
    description: 'The question text of the FAQ.',
    example: 'What is your return policy?',
  })
  @IsNotEmpty()
  @IsString()
  question: string;

  @ApiProperty({
    description: 'The answer text of the FAQ.',
    example: 'You can return any product within 30 days of purchase.',
  })
  @IsNotEmpty()
  @IsString()
  answer: string;
}
export class UpdateFaqDto {
  @ApiProperty({
    description: 'The unique MongoDB ID of the FAQ to update.',
    example: '652e1aee2f98c2b4e9e42f31',
  })
  @IsNotEmpty()
  @IsMongoId()
  _id: string;

  @ApiProperty({
    description: 'The updated question text.',
    example: 'What is the updated return policy?',
  })
  @IsNotEmpty()
  @IsString()
  question?: string;

  @ApiProperty({
    description: 'The updated answer text.',
    example: 'Our return window has been extended to 60 days.',
  })
  @IsNotEmpty()
  @IsString({ message: 'Answer must be a string.' })
  answer?: string;
}
export class FaqDeleteDto {
  @ApiProperty({
    description: 'The unique MongoDB ID of the FAQ to delete.',
    example: '652e1aee2f98c2b4e9e42f31',
  })
  @IsNotEmpty()
  @IsMongoId()
  _id: string;
}

