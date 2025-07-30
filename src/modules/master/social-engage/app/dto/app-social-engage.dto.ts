import { Transform, Type } from 'class-transformer';
import { IsString, IsNotEmpty, IsMongoId, IsOptional, IsEmail, IsDate, IsNumber, MaxLength, IsObject, Min, IsEnum, IsPhoneNumber, isArray } from 'class-validator';
import { IsArray } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateRequestDto {
    @ApiProperty({
        description: 'Unique identifier for the social engagement entity.',
        example: '609d9e8f2f79981e9a1e233d',
    })
    @IsNotEmpty()
    @IsString()
    @IsMongoId()
    social_engage_id: string;
}