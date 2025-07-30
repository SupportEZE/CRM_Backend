import { IsString, IsOptional, IsObject, IsNumber, Min, IsArray, IsNotEmpty, Equals, ArrayMinSize } from 'class-validator';
import { Transform, Type } from 'class-transformer';

export class ReadPostalCodeDto {
    @IsOptional()
    @IsObject()
    filters: object;

    @IsOptional()
    @IsNumber()
    @Min(1)
    page: number;
    @IsOptional()
    @IsNumber()
    @Min(10)
    limit: number;
}

export class GetStatesDto {
    @IsOptional()
    @IsObject()
    filters?: object;

    @IsOptional()
    @IsString()
    search?: string;

    @IsOptional()
    @IsString()
    state: string;

    @IsOptional()
    @IsString()
    country: string;

    @IsOptional()
    @IsObject()
    @IsNotEmpty()
    sorting: object;
}

export class GetDistrictsDto {
    @IsOptional()
    @IsString()
    search?: string;

    @IsOptional()
    @IsObject()
    filters?: object;

    @IsOptional()
    @IsString()
    state: string;

    @IsOptional()
    @IsString()
    @IsNotEmpty()
    district: string;

    @IsOptional()
    @IsObject()
    @IsNotEmpty()
    sorting: object;

    @IsOptional()
    @IsString()
    country: string;
}

export class ReadUsingPincodeDto {

    @IsNotEmpty()
    @IsString()
    pincode: string;

}

export class CreatePostalCodeDto {
    @IsNotEmpty()
    @IsString()
    country: string;

    @IsNotEmpty()
    @IsString()
    state: string;

    @IsNotEmpty()
    @IsString()
    district: string;

    @IsOptional()
    @IsString()
    city: string;

    @IsNotEmpty()
    @IsString()
    pincode: string;
}

export class UpdatePostalCodeDto {
    @IsNotEmpty()
    @IsString()
    _id: string;

    @IsNotEmpty()
    @IsString()
    state: string;

    @IsNotEmpty()
    @IsString()
    district: string;

    @IsNotEmpty()
    @IsString()
    city: string;

    @IsNotEmpty()
    @IsString()
    pincode: string;
}

export class DeletePostalCodeDto {

    @IsNotEmpty()
    @IsString()
    _id: string;

    @IsNotEmpty()
    @IsNumber()
    @Equals(1, { message: 'is_delete must be 1' }) // Ensures only value 1 is allowed
    is_delete: number;

}
export class ReadUserCityWiseDto {
    @IsNotEmpty()
    @IsString()
    assigned_to_type: string;
}
