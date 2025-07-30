import { IsString, IsOptional, IsObject, IsNumber, Min, IsArray, IsNotEmpty, Equals, IsMongoId, ArrayNotEmpty, isNotEmpty } from 'class-validator';
import { Transform, Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

export class ReadBeatRouteDto {

    @IsOptional()
    @IsObject()
    filters: object;

    @IsOptional()
    @IsString()
    state?: string;

    @IsOptional()
    @IsString()
    district?: string;

    @IsOptional()
    @IsString()
    description?: string;

    @IsOptional()
    @IsString()
    beat_route_code?: string;

    @IsOptional()
    @IsNumber()
    @Min(1)
    page?: number;

    @IsOptional()
    @IsNumber()
    @Min(1)
    limit?: number;

}
export class CreateBeatRouteDto {
    @IsOptional()
    @IsString()
    country: string;

    @IsNotEmpty()
    @IsString()
    state: string;

    @IsNotEmpty()
    @IsString()
    district: string;

    @IsNotEmpty()
    @IsString()
    description: string;

}

export class UpdateBeatRouteDto {
    @IsNotEmpty()
    @IsString()
    _id: string;

    @IsOptional()
    @IsString()
    state?: string;

    @IsOptional()
    @IsString()
    district?: string;

    @IsOptional()
    @IsString()
    description?: string;
}

export class DeleteBeatRouteDto {

    @IsNotEmpty()
    @IsString()
    _id: string;

    @IsNotEmpty()
    @IsNumber()
    @Equals(1, { message: 'is_delete must be 1' }) // Ensures only value 1 is allowed
    is_delete: number;

}

export class BeatRouteImportDto {
    @ApiProperty({ description: 'Form ID related to the import.', example: 123 })
    @IsNotEmpty()
    @IsNumber()
    form_id: number;

    @ApiProperty({
        description: 'CSV data to import.',
        type: Array,
        example: [{ product_name: 'Smartphone', product_code: 'PROD-12345' }],
    })
    @IsNotEmpty()
    @IsArray()
    csv_data?: Record<string, any>[];
}

export class ReadDropdownDto {

    @IsOptional()
    @IsObject()
    filters: object;

    @IsOptional()
    @IsString()
    state: string

    @IsOptional()
    @IsString()
    district: string
}

export class AssignBeatRouteDto {
    @ApiProperty({
        description: 'Array of user IDs (Mongo ObjectIds)',
        type: [String],
        required: true,
        example: ["67ad8250e0dcbc31f2068f06", "67ad8250e0dcbc31f2068f07"]
    })
    @IsArray()
    @ArrayNotEmpty()
    @IsMongoId({ each: true })
    @Type(() => String)
    user_id: string[];

    @ApiProperty({
        description: 'Array of beat route codes',
        type: [String],
        required: true,
        example: ["BEAT-97890", "BEAT-97898", "BEAT-97937"]
    })
    @IsArray()
    @ArrayNotEmpty()
    beat_route_code: string[];
}


export class UnAssignBeatRouteDto {
    @ApiProperty({
        description: 'Array of user IDs (Mongo ObjectIds)',
        required: true,
        example: "67ad8250e0dcbc31f2068f06"
    })
    @IsNotEmpty()
    @IsMongoId()
    user_id: string;

    @ApiProperty({
        description: 'Array of beat route codes',
        type: String,
        required: true,
        example: "BEAT-97890",
    })
    @IsString()
    @IsNotEmpty()
    beat_route_code: string[];
}