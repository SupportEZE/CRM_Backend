import { IsString, IsOptional, IsObject, IsNumber, Min, IsArray, IsNotEmpty, Equals, ArrayNotEmpty, IsBoolean, ValidateNested } from 'class-validator';
import { Transform, Type } from 'class-transformer';

export class ReadZoneDto {

    @IsOptional()
    @IsObject()
    filters?: object;

    @IsOptional()
    @IsString()
    zone?: string;

    @IsOptional()
    @IsArray()
    @IsString({ each: true })
    state?: string[];

    @IsOptional()
    @IsNumber()
    page?: number;

    @IsOptional()
    @IsNumber()
    limit?: number;
}


export class CreateZoneDto {

    @IsNotEmpty()
    @IsString()
    zone: string;

    @IsNotEmpty()
    @IsString()
    country: string;
}


class ZoneStateDto {
    @IsNotEmpty()
    @IsString()
    zone: string;

    @IsArray()
    @IsString({ each: true })
    state: string[];
}

export class UpdateZoneDto {
    @IsNotEmpty()
    @IsString()
    _id: string;

    @IsArray()
    @IsString({ each: true })
    state: string[];

    @IsOptional()
    @IsString()
    zone?: string;

    @IsOptional()
    @IsBoolean()
    forcefully?: boolean;

    @IsOptional()
    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => ZoneStateDto)
    responseData?: ZoneStateDto[];

    @IsOptional()
    @IsString()
    country?: string;
}

export class DeleteZoneDto {
    @IsNotEmpty()
    @IsString()
    _id: string;

    @IsNotEmpty()
    @IsNumber()
    @Equals(1, { message: 'is_delete must be 1' }) // Ensures only value 1 is allowed
    is_delete: number;
}

