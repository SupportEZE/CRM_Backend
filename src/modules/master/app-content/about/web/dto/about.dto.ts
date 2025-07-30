import { IsString, MinLength, IsOptional, MaxLength, Min, IsObject, IsNotEmpty, IsEnum, ValidateNested, Max, IsEmail } from 'class-validator';
import { Transform, Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

export class CreateAboutDto {
  @ApiProperty({
    example: 'We are a customer-first company with a mission to deliver excellence.',
    description: 'Short content for the About Us section',
    maxLength: 1000,
    minLength: 10,
    required: true,
  })
  @IsNotEmpty({ message: 'about_us field is required' })
  @IsString({ message: 'about_us must be a string' })
  @MinLength(10, { message: 'about_us must be at least 10 characters' })
  @MaxLength(10000, { message: 'about_us must not exceed 10000 characters' })
  about_us: string;
}