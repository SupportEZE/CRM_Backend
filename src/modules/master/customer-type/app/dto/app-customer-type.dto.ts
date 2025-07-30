import { Type } from 'class-transformer';
import { IsNotEmpty, IsString, IsOptional, IsBoolean, IsNumber, IsObject, Min, IsArray } from 'class-validator';


export class ReadDropdownDto {
    @IsOptional()
    @IsNumber()
    login_type_id: number;

    @IsOptional()
    @IsArray()
    @IsNumber({}, { each: true }) 
    @Type(() => Number)
    login_type_ids?: number[];

}