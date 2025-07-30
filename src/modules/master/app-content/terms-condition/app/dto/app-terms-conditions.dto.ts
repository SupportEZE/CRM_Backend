import { IsString, IsNumber, IsOptional, Min, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ReadTermsConditionsDto {

    @ApiProperty({ description: 'App Id', example: 'com.ezeone.com' })
    @IsNotEmpty()
    @IsString()
    app_id?: string;
}