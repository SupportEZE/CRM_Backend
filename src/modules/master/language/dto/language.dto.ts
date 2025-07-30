import { IsString, IsNumber, IsOptional, IsArray, MaxLength, Min, Max, IsDate, IsObject, IsNotEmpty, IsEnum, ValidateNested } from 'class-validator';
import { Transform, Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

export class ReadLanguageDto {
    @ApiProperty({
        description: 'Code of the language (e.g., "en", "fr", "es").',
        example: 'en',
    })
    @IsString()
    @IsNotEmpty()
    language_code?: string;
}