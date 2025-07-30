import { IsNumber, IsOptional, Min, ValidateNested } from 'class-validator';
import { Transform, Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

class FiltersDto {
    @ApiProperty({ description: 'Example field for filtering', required: false, example: 'value' })
    @IsOptional()
    someField: string;
}

export class ReadCallDto {
    @ApiProperty({
        description: 'Filters to apply for attendance search. Must be a valid object.',
        required: false,
        type: FiltersDto,
    })
    @IsOptional()
    @ValidateNested()
    @Type(() => FiltersDto)
    filters: FiltersDto;

    @ApiProperty({
        description: 'Page number for pagination. Minimum value is 1.',
        example: 1,
        required: false,
    })
    @IsOptional()
    @Transform(({ value }) => parseInt(value, 10))
    @IsNumber()
    @Min(1)
    page: number;

    @ApiProperty({
        description: 'Number of records per page. Minimum value is 10.',
        example: 10,
        required: false,
    })
    @IsOptional()
    @Transform(({ value }) => parseInt(value, 10))
    @IsNumber()
    @Min(10)
    limit: number;
}
